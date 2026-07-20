export const prerender = false;

import type { APIRoute } from "astro";

import { startSignIn } from "../lib/logto";

const errorPage = (message: string) =>
  new Response(
    `<!doctype html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width">
        <meta name="robots" content="noindex">
        <title>Invitacion no valida | Betipo Tools</title>
        <style>
          *{box-sizing:border-box}body{display:grid;min-height:100vh;margin:0;place-items:center;padding:16px;background:#f1f5f9;color:#1e293b;font-family:ui-sans-serif,system-ui,sans-serif}.card{width:min(100%,512px);padding:32px;border:1px solid #e2e8f0;border-radius:16px;background:#fff;text-align:center;box-shadow:0 1px 3px #0f172a14}.eyebrow{margin:0;color:#2563eb;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}h1{margin:12px 0 0;font-size:24px}p{margin:12px 0 0;color:#475569;line-height:1.6}a{display:inline-flex;margin-top:24px;padding:9px 16px;border-radius:8px;background:#0f172a;color:#fff;font-size:14px;font-weight:600;text-decoration:none}
        </style>
      </head>
      <body>
        <main class="card">
          <p class="eyebrow">Betipo Tools</p>
          <h1>Invitacion no valida</h1>
          <p>${message}</p>
          <a href="/">Volver</a>
        </main>
      </body>
    </html>`,
    {
      status: 400,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );

export const GET: APIRoute = async ({ cookies, url, redirect }) => {
  const token = url.searchParams.get("token");
  const email = url.searchParams.get("email");

  if (!token || !email) {
    return errorPage("El enlace no contiene una invitacion valida.");
  }

  try {
    return redirect(
      await startSignIn(cookies, {
        one_time_token: token,
        login_hint: email,
      }),
    );
  } catch (error) {
    console.error("Error starting invitation sign-in:", error);
    return errorPage(
      "No se pudo procesar la invitacion. Solicita un enlace nuevo.",
    );
  }
};
