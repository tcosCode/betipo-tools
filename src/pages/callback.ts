export const prerender = false;

import type { APIRoute } from "astro";

import { completeSignIn } from "../lib/logto";

export const GET: APIRoute = async ({ cookies, url, redirect }) => {
  try {
    await completeSignIn(cookies, url);
  } catch (error) {
    console.error("Error handling Logto callback:", error);
    return new Response(
      "No se pudo completar el inicio de sesion. Vuelve a Betipo Tools e intentalo de nuevo.",
      {
        status: 400,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  }
  return redirect("/");
};
