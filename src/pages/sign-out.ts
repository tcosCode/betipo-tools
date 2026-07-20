export const prerender = false;

import type { APIRoute } from "astro";

import { startSignOut } from "../lib/logto";

export const GET: APIRoute = async ({ cookies, redirect }) => {
  return redirect(await startSignOut(cookies));
};
