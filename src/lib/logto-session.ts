import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

import type { Storage } from "@logto/node";
import type { AstroCookies } from "astro";

// Subconjunto de AstroCookies para poder testear el storage sin Astro.
export type CookieStore = Pick<AstroCookies, "get" | "set" | "delete">;

const SESSION_COOKIE_PREFIX = "logto_";
// 14 días, alineado con la duración por defecto del refresh token de Logto.
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 14;

const deriveKey = (secret: string) =>
  createHash("sha256").update(secret, "utf8").digest();

export const encryptValue = (value: string, secret: string): string => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(secret), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString(
    "base64url",
  );
};

export const decryptValue = (
  payload: string,
  secret: string,
): string | null => {
  try {
    const raw = Buffer.from(payload, "base64url");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const encrypted = raw.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", deriveKey(secret), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
};

type CookieStorageOptions = {
  secret: string;
  secure: boolean;
};

// Storage de @logto/node persistido en cookies httpOnly cifradas con AES-256-GCM.
export const createCookieStorage = (
  cookies: CookieStore,
  { secret, secure }: CookieStorageOptions,
): Storage<string> => {
  const cookieName = (key: string) => `${SESSION_COOKIE_PREFIX}${key}`;

  return {
    async getItem(key) {
      const raw = cookies.get(cookieName(key))?.value;
      if (!raw) return null;
      const value = decryptValue(raw, secret);
      if (value === null) {
        cookies.delete(cookieName(key), { path: "/" });
      }
      return value;
    },
    async setItem(key, value) {
      cookies.set(cookieName(key), encryptValue(value, secret), {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure,
        maxAge: SESSION_COOKIE_MAX_AGE,
      });
    },
    async removeItem(key) {
      cookies.delete(cookieName(key), { path: "/" });
    },
  };
};
