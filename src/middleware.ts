import { defineMiddleware } from "astro:middleware";

import { getAuthSession } from "./lib/logto";

const isStaticAsset = (pathname: string) =>
  pathname.startsWith("/_astro/") || pathname === "/favicon.png";

export const onRequest = defineMiddleware(async (context, next) => {
  if (isStaticAsset(context.url.pathname)) {
    context.locals.auth = () => ({ userId: null });
    context.locals.user = null;
    return next();
  }

  const session = await getAuthSession(context.cookies);
  context.locals.auth = () => ({ userId: session.userId });
  context.locals.user = session.user;

  return next();
});
