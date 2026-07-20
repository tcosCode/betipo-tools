import LogtoClient, { type IdTokenClaims, type Storage } from "@logto/node";
import { getSecret } from "astro:env/server";
import type { AstroCookies } from "astro";

import { createCookieStorage } from "./logto-session";

const requireEnv = (key: string) => {
  const value = getSecret(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

type LogtoSettings = {
  endpoint: string;
  appId: string;
  appSecret: string;
  baseUrl: string;
  cookieSecret: string;
};

const getSettings = (): LogtoSettings => ({
  endpoint: requireEnv("LOGTO_ENDPOINT"),
  appId: requireEnv("LOGTO_APP_ID"),
  appSecret: requireEnv("LOGTO_APP_SECRET"),
  baseUrl: requireEnv("LOGTO_BASE_URL").replace(/\/+$/, ""),
  cookieSecret: requireEnv("LOGTO_COOKIE_SECRET"),
});

// Cache en memoria compartido entre requests para la configuración OIDC
// y el JWKS de Logto (el SDK crea uno por instancia si no se inyecta).
const sharedCacheMap = new Map<string, string>();
const sharedCache: Storage<string> = {
  async getItem(key) {
    return sharedCacheMap.get(key) ?? null;
  },
  async setItem(key, value) {
    sharedCacheMap.set(key, value);
  },
  async removeItem(key) {
    sharedCacheMap.delete(key);
  },
};

export const createLogtoClient = (cookies: AstroCookies) => {
  const settings = getSettings();
  let navigationUrl: string | undefined;

  const client = new LogtoClient(
    {
      endpoint: settings.endpoint,
      appId: settings.appId,
      appSecret: settings.appSecret,
    },
    {
      storage: createCookieStorage(cookies, {
        secret: settings.cookieSecret,
        secure: settings.baseUrl.startsWith("https://"),
      }),
      unstable_cache: sharedCache,
      navigate: (url) => {
        navigationUrl = url;
      },
    },
  );

  const takeNavigationUrl = () => {
    const url = navigationUrl;
    navigationUrl = undefined;
    return url;
  };

  return { client, settings, takeNavigationUrl };
};

export type AuthUser = {
  name: string | null;
  picture: string | null;
};

export type AuthSession = {
  userId: string | null;
  user: AuthUser | null;
};

const anonymousSession: AuthSession = { userId: null, user: null };

const toAuthUser = (claims: IdTokenClaims): AuthUser => ({
  name: claims.name ?? claims.username ?? null,
  picture: claims.picture ?? null,
});

// Hidrata la sesión desde las cookies, renovando los tokens si han expirado.
export const getAuthSession = async (
  cookies: AstroCookies,
): Promise<AuthSession> => {
  const { client } = createLogtoClient(cookies);

  if (!(await client.isAuthenticated())) {
    return anonymousSession;
  }

  try {
    // Fuerza la renovación con el refresh token cuando el access token expira;
    // el SDK rota también el ID token y lo persiste en las cookies.
    await client.getAccessToken();
    const claims = await client.getIdTokenClaims();
    return { userId: claims.sub, user: toAuthUser(claims) };
  } catch {
    await client.clearAllTokens();
    return anonymousSession;
  }
};

// Devuelve la URL de Logto a la que hay que redirigir al usuario.
export const startSignIn = async (
  cookies: AstroCookies,
  extraParams?: Record<string, string>,
): Promise<string> => {
  const { client, settings, takeNavigationUrl } = createLogtoClient(cookies);
  await client.signIn({
    redirectUri: `${settings.baseUrl}/callback`,
    extraParams,
  });
  const url = takeNavigationUrl();
  if (!url) {
    throw new Error("Logto did not provide a sign-in URL");
  }
  return url;
};

export const completeSignIn = async (
  cookies: AstroCookies,
  callbackUrl: URL,
): Promise<void> => {
  const { client, settings } = createLogtoClient(cookies);
  const publicCallbackUrl = new URL(`${settings.baseUrl}/callback`);
  publicCallbackUrl.search = callbackUrl.search;
  await client.handleSignInCallback(publicCallbackUrl.toString());
};

// Devuelve la URL de cierre de sesión de Logto (o un fallback local).
export const startSignOut = async (cookies: AstroCookies): Promise<string> => {
  const { client, settings, takeNavigationUrl } = createLogtoClient(cookies);
  await client.signOut(settings.baseUrl);
  return takeNavigationUrl() ?? "/sign-in";
};
