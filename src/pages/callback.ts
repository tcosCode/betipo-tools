export const prerender = false;

import type { APIRoute } from "astro";

import { completeSignIn } from "../lib/logto";

export const GET: APIRoute = async ({ cookies, url, redirect }) => {
  try {
    await completeSignIn(cookies, url.toString());
  } catch (error) {
    console.error("Error handling Logto callback:", error);
    return redirect("/sign-in");
  }
  return redirect("/");
};
