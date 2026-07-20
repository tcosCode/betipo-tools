export const prerender = false;

import type { APIRoute } from "astro";

import { startSignIn } from "../lib/logto";

export const GET: APIRoute = async ({ cookies, redirect }) => {
  return redirect(await startSignIn(cookies));
};
