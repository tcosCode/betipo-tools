import { timingSafeEqual } from "node:crypto";

export const MANAGEMENT_API_INDICATOR = "https://default.logto.app/api";
export const DEFAULT_INVITATION_EXPIRES_IN = 60 * 60 * 48;

export const requireEnv = (name, env = process.env) => {
  const value = env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const normalizeOrigin = (value) => value.replace(/\/+$/, "");

const firstHeaderValue = (value) => {
  const header = Array.isArray(value) ? value[0] : value;
  return header?.split(",")[0]?.trim();
};

export const isTrustedRequestOrigin = (headers, configuredOrigin) => {
  const origin = firstHeaderValue(headers.origin);
  let requestOrigin = origin;

  if (!requestOrigin) {
    const referer = firstHeaderValue(headers.referer);
    if (referer) {
      try {
        requestOrigin = new URL(referer).origin;
      } catch {
        return false;
      }
    }
  }

  if (!requestOrigin) return false;

  const protocol = firstHeaderValue(headers["x-forwarded-proto"]);
  const host =
    firstHeaderValue(headers["x-forwarded-host"]) ||
    firstHeaderValue(headers.host);
  const forwardedOrigin =
    protocol && host ? `${protocol}://${host}` : undefined;

  return (
    requestOrigin === configuredOrigin || requestOrigin === forwardedOrigin
  );
};

export const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 128;

export const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
};

export const hasValidBasicAuth = (authorization, username, password) => {
  if (!authorization?.startsWith("Basic ")) return false;

  try {
    const credentials = Buffer.from(authorization.slice(6), "base64").toString(
      "utf8",
    );
    const separator = credentials.indexOf(":");
    if (separator < 0) return false;
    return (
      safeEqual(credentials.slice(0, separator), username) &&
      safeEqual(credentials.slice(separator + 1), password)
    );
  } catch {
    return false;
  }
};

export const buildInvitationUrl = (appUrl, token, email) => {
  const url = new URL("/invitacion", `${normalizeOrigin(appUrl)}/`);
  url.searchParams.set("token", token);
  url.searchParams.set("email", email);
  return url.toString();
};

export const invitationEmail = (invitationUrl) => ({
  subject: "Invitacion para acceder a Betipo Tools",
  text: [
    "Has recibido una invitacion para acceder a Betipo Tools.",
    "",
    `Aceptar invitacion: ${invitationUrl}`,
    "",
    "El enlace caduca en 48 horas y solo puede utilizarse una vez.",
    "Si no esperabas esta invitacion, puedes ignorar este mensaje.",
  ].join("\n"),
  html: `
    <!doctype html>
    <html lang="es">
      <body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a">
        <div style="max-width:560px;margin:0 auto;padding:40px 20px">
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:32px">
            <p style="margin:0 0 8px;color:#2563eb;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Betipo Tools</p>
            <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2">Has sido invitado</h1>
            <p style="margin:0 0 24px;color:#475569;line-height:1.6">Utiliza el siguiente boton para crear tu cuenta y acceder a Betipo Tools.</p>
            <a href="${escapeHtml(invitationUrl)}" style="display:inline-block;border-radius:10px;background:#2563eb;padding:13px 20px;color:#fff;font-weight:700;text-decoration:none">Aceptar invitacion</a>
            <p style="margin:24px 0 0;color:#64748b;font-size:13px;line-height:1.5">El enlace caduca en 48 horas y solo puede utilizarse una vez. Si no esperabas esta invitacion, ignora este mensaje.</p>
          </div>
        </div>
      </body>
    </html>
  `,
});
