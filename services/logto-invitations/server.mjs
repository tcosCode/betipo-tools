import { createServer } from "node:http";

import {
  buildInvitationUrl,
  DEFAULT_INVITATION_EXPIRES_IN,
  escapeHtml,
  hasValidBasicAuth,
  invitationEmail,
  isTrustedRequestOrigin,
  isValidEmail,
  MANAGEMENT_API_INDICATOR,
  normalizeOrigin,
  requireEnv,
} from "./lib.mjs";

const config = {
  port: Number(process.env.PORT || 3000),
  adminOrigin: normalizeOrigin(requireEnv("ADMIN_ORIGIN")),
  adminUsername: requireEnv("ADMIN_USERNAME"),
  adminPassword: requireEnv("ADMIN_PASSWORD"),
  logtoEndpoint: normalizeOrigin(requireEnv("LOGTO_ENDPOINT")),
  logtoM2mAppId: requireEnv("LOGTO_M2M_APP_ID"),
  logtoM2mAppSecret: requireEnv("LOGTO_M2M_APP_SECRET"),
  betipoAppUrl: normalizeOrigin(requireEnv("BETIPO_APP_URL")),
  resendApiKey: requireEnv("RESEND_API_KEY"),
  resendFrom: requireEnv("RESEND_FROM"),
  resendReplyTo: process.env.RESEND_REPLY_TO?.trim() || undefined,
};

let managementTokenCache = null;

const securityHeaders = {
  "Cache-Control": "no-store",
  "Content-Security-Policy":
    "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  "Referrer-Policy": "same-origin",
  Vary: "Sec-Fetch-Site, Origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

const send = (response, status, body, headers = {}) => {
  response.writeHead(status, { ...securityHeaders, ...headers });
  response.end(body);
};

const redirect = (response, location) =>
  send(response, 303, "", { Location: location });

const parseJson = async (response, label) => {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`${label} failed with status ${response.status}`);
  }
  if (!data || typeof data !== "object") {
    throw new Error(`${label} returned an invalid response`);
  }
  return data;
};

const getManagementToken = async () => {
  if (
    managementTokenCache &&
    managementTokenCache.expiresAt > Date.now() + 30_000
  ) {
    return managementTokenCache.value;
  }

  const response = await fetch(`${config.logtoEndpoint}/oidc/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.logtoM2mAppId}:${config.logtoM2mAppSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      resource: MANAGEMENT_API_INDICATOR,
      scope: "all",
    }),
  });
  const data = await parseJson(response, "Logto M2M token request");
  if (
    typeof data.access_token !== "string" ||
    typeof data.expires_in !== "number"
  ) {
    throw new Error("Logto M2M token response is missing required fields");
  }

  managementTokenCache = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
};

const managementRequest = async (path, init = {}, canRetry = true) => {
  const accessToken = await getManagementToken();
  const response = await fetch(`${config.logtoEndpoint}/api${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...init.headers,
    },
  });

  if (response.status === 401 && canRetry) {
    managementTokenCache = null;
    return managementRequest(path, init, false);
  }
  if (!response.ok) {
    throw new Error(
      `Logto Management API request failed with status ${response.status}`,
    );
  }
  return response;
};

const listInvitations = async () => {
  const response = await managementRequest("/one-time-tokens?status=active");
  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Logto returned an invalid invitation list");
  }
  return data;
};

const getInvitation = async (id) => {
  const response = await managementRequest(
    `/one-time-tokens/${encodeURIComponent(id)}`,
  );
  return response.json();
};

const createInvitation = async (email) => {
  const response = await managementRequest("/one-time-tokens", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      expiresIn: DEFAULT_INVITATION_EXPIRES_IN,
    }),
  });
  const invitation = await response.json();
  if (
    !invitation ||
    typeof invitation.id !== "string" ||
    typeof invitation.token !== "string"
  ) {
    throw new Error("Logto returned an invalid one-time token");
  }
  return invitation;
};

const deleteInvitation = async (id) => {
  await managementRequest(`/one-time-tokens/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
};

const sendInvitationEmail = async (email, invitationUrl) => {
  const content = invitationEmail(invitationUrl);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.resendFrom,
      to: [email],
      reply_to: config.resendReplyTo,
      subject: content.subject,
      html: content.html,
      text: content.text,
    }),
  });
  if (!response.ok) {
    throw new Error(`Resend request failed with status ${response.status}`);
  }
};

const createAndSendInvitation = async (email) => {
  const invitation = await createInvitation(email);
  try {
    await sendInvitationEmail(
      email,
      buildInvitationUrl(config.betipoAppUrl, invitation.token, email),
    );
  } catch (error) {
    await deleteInvitation(invitation.id).catch(() => undefined);
    throw error;
  }
  return invitation;
};

const readForm = async (request) => {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 16_384) {
      throw new Error("Request body is too large");
    }
  }
  return new URLSearchParams(body);
};

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : new Intl.DateTimeFormat("es-ES", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Europe/Madrid",
      }).format(date);
};

const renderPage = (invitations, searchParams) => {
  const sent = searchParams.get("sent");
  const revoked = searchParams.has("revoked");
  const resent = searchParams.get("resent");
  const error = searchParams.has("error");
  const message = sent
    ? `Invitacion enviada a ${escapeHtml(sent)}.`
    : resent
      ? `Invitacion reenviada a ${escapeHtml(resent)}.`
      : revoked
        ? "Invitacion revocada."
        : error
          ? "No se pudo completar la operacion. Revisa los logs del servicio."
          : "";
  const messageClass = error ? "notice error" : "notice success";
  const rows = invitations
    .map(
      (invitation) => `
        <tr>
          <td>${escapeHtml(invitation.email || "-")}</td>
          <td>${escapeHtml(formatDate(invitation.createdAt))}</td>
          <td>${escapeHtml(formatDate(invitation.expiresAt))}</td>
          <td>
            <div class="actions">
              <form method="post" action="/invitations/${encodeURIComponent(invitation.id)}/resend">
                <button class="secondary" type="submit">Reenviar</button>
              </form>
              <form method="post" action="/invitations/${encodeURIComponent(invitation.id)}/revoke">
                <button class="danger" type="submit">Revocar</button>
              </form>
            </div>
          </td>
        </tr>
      `,
    )
    .join("");

  return `<!doctype html>
  <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Invitaciones | Betipo Tools</title>
      <style>
        :root{font-family:Inter,ui-sans-serif,system-ui,sans-serif;color:#172033;background:#e9eef5}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:linear-gradient(135deg,#e7edf6 0%,#f8fafc 52%,#dbe7f3 100%)}main{width:min(1080px,calc(100% - 32px));margin:0 auto;padding:56px 0 80px}.eyebrow{margin:0 0 8px;color:#2458a6;font-size:12px;font-weight:800;letter-spacing:.13em;text-transform:uppercase}h1{margin:0;font-size:clamp(32px,5vw,52px);letter-spacing:-.04em}header p{max-width:650px;margin:14px 0 0;color:#55647a;line-height:1.65}.grid{display:grid;grid-template-columns:minmax(280px,.7fr) minmax(0,1.3fr);gap:22px;margin-top:34px}.card{border:1px solid rgba(116,137,165,.28);border-radius:18px;background:rgba(255,255,255,.9);box-shadow:0 18px 50px rgba(65,83,110,.09);overflow:hidden}.card-content{padding:24px}.card h2{margin:0 0 8px;font-size:19px}.card p{margin:0;color:#67758a;font-size:14px;line-height:1.55}label{display:block;margin:22px 0 7px;font-size:13px;font-weight:750}input{width:100%;border:1px solid #cbd5e1;border-radius:10px;padding:12px 13px;background:#fff;color:#172033;font:inherit}input:focus{border-color:#2563eb;outline:3px solid rgba(37,99,235,.13)}button{border:0;border-radius:10px;padding:11px 15px;background:#2458a6;color:#fff;font:inherit;font-size:14px;font-weight:750;cursor:pointer}button:hover{filter:brightness(.96)}button.secondary{background:#edf3fa;color:#234c84}button.danger{background:#fff0f0;color:#b42318}.submit{width:100%;margin-top:14px}.notice{margin-top:24px;border-radius:12px;padding:13px 15px;font-size:14px}.notice.success{border:1px solid #a7d8bb;background:#edf9f2;color:#166534}.notice.error{border:1px solid #fecaca;background:#fff1f2;color:#991b1b}.table-wrap{overflow-x:auto;border-top:1px solid #e2e8f0}table{width:100%;border-collapse:collapse;min-width:650px}th,td{padding:14px 18px;border-bottom:1px solid #e8edf3;text-align:left;font-size:13px}th{background:#f7f9fc;color:#607087;font-size:11px;letter-spacing:.08em;text-transform:uppercase}td:first-child{font-weight:700}.actions{display:flex;gap:8px}.actions form{margin:0}.empty{padding:34px;text-align:center;color:#748196}@media(max-width:800px){main{padding-top:34px}.grid{grid-template-columns:1fr}}
      </style>
    </head>
    <body>
      <main>
        <header>
          <p class="eyebrow">Acceso restringido</p>
          <h1>Invitaciones</h1>
          <p>Genera enlaces de un solo uso en Logto y envia el acceso mediante Resend. Las invitaciones caducan automaticamente en 48 horas.</p>
        </header>
        ${message ? `<div class="${messageClass}" role="status">${message}</div>` : ""}
        <div class="grid">
          <section class="card">
            <div class="card-content">
              <h2>Nueva invitacion</h2>
              <p>El destinatario recibira un enlace unico para crear su cuenta.</p>
              <form method="post" action="/invitations">
                <label for="email">Email</label>
                <input id="email" name="email" type="email" maxlength="128" autocomplete="email" required>
                <button class="submit" type="submit">Enviar invitacion</button>
              </form>
            </div>
          </section>
          <section class="card">
            <div class="card-content">
              <h2>Invitaciones activas</h2>
              <p>Puedes reenviar o invalidar cualquier enlace pendiente.</p>
            </div>
            ${rows ? `<div class="table-wrap"><table><thead><tr><th>Email</th><th>Creada</th><th>Caduca</th><th>Acciones</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="empty">No hay invitaciones activas.</div>'}
          </section>
        </div>
      </main>
    </body>
  </html>`;
};

const handleRequest = async (request, response) => {
  const url = new URL(request.url || "/", config.adminOrigin);

  if (request.method === "GET" && url.pathname === "/health") {
    return send(response, 200, "ok", { "Content-Type": "text/plain" });
  }

  if (
    !hasValidBasicAuth(
      request.headers.authorization,
      config.adminUsername,
      config.adminPassword,
    )
  ) {
    return send(response, 401, "Authentication required", {
      "Content-Type": "text/plain; charset=utf-8",
      "WWW-Authenticate": 'Basic realm="Betipo Invitations", charset="UTF-8"',
    });
  }

  if (request.method === "GET" && url.pathname === "/") {
    const invitations = await listInvitations();
    return send(response, 200, renderPage(invitations, url.searchParams), {
      "Content-Type": "text/html; charset=utf-8",
    });
  }

  if (request.method === "POST") {
    if (!isTrustedRequestOrigin(request.headers, config.adminOrigin)) {
      console.warn("Rejected invitation request origin", {
        origin: request.headers.origin,
        referer: request.headers.referer,
        fetchSite: request.headers["sec-fetch-site"],
      });
      return send(response, 403, "Invalid request origin", {
        "Content-Type": "text/plain; charset=utf-8",
      });
    }

    if (url.pathname === "/invitations") {
      const form = await readForm(request);
      const email = form.get("email")?.trim().toLowerCase() || "";
      if (!isValidEmail(email)) {
        return redirect(response, "/?error=invalid-email");
      }
      await createAndSendInvitation(email);
      return redirect(response, `/?sent=${encodeURIComponent(email)}`);
    }

    const action = url.pathname.match(
      /^\/invitations\/([^/]+)\/(resend|revoke)$/,
    );
    if (action) {
      const id = decodeURIComponent(action[1]);
      if (action[2] === "revoke") {
        await deleteInvitation(id);
        return redirect(response, "/?revoked=1");
      }

      const previous = await getInvitation(id);
      if (!previous || !isValidEmail(previous.email || "")) {
        throw new Error("Logto returned an invalid invitation");
      }
      await createAndSendInvitation(previous.email);
      await deleteInvitation(id);
      return redirect(
        response,
        `/?resent=${encodeURIComponent(previous.email)}`,
      );
    }
  }

  return send(response, 404, "Not found", {
    "Content-Type": "text/plain; charset=utf-8",
  });
};

const server = createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    console.error("Invitation service request failed:", error);
    if (!response.headersSent) {
      if (request.method === "POST") {
        redirect(response, "/?error=operation-failed");
      } else {
        send(response, 500, "Invitation service unavailable", {
          "Content-Type": "text/plain; charset=utf-8",
        });
      }
    } else {
      response.end();
    }
  });
});

server.listen(config.port, "0.0.0.0", () => {
  console.log(`Invitation service listening on port ${config.port}`);
});
