import { describe, expect, it } from "vitest";

import {
  createCookieStorage,
  decryptValue,
  encryptValue,
  type CookieStore,
} from "./logto-session";

const SECRET = "test-cookie-secret";

const createFakeCookies = () => {
  const jar = new Map<string, string>();
  const deleted: string[] = [];

  const cookies: CookieStore = {
    get: (key) => {
      const value = jar.get(key);
      if (value === undefined) return undefined;
      return {
        value,
        json: () => JSON.parse(value) as Record<string, unknown>,
        number: () => Number(value),
        boolean: () => value === "true",
      };
    },
    set: (key, value) => {
      jar.set(key, typeof value === "string" ? value : JSON.stringify(value));
    },
    delete: (key) => {
      jar.delete(key);
      deleted.push(key);
    },
  };

  return { jar, deleted, cookies };
};

describe("encryptValue / decryptValue", () => {
  it("round-trips a value", () => {
    const encrypted = encryptValue("hello logto", SECRET);
    expect(encrypted).not.toContain("hello logto");
    expect(decryptValue(encrypted, SECRET)).toBe("hello logto");
  });

  it("produces different ciphertexts for the same value", () => {
    expect(encryptValue("same", SECRET)).not.toBe(encryptValue("same", SECRET));
  });

  it("returns null when decrypting with the wrong secret", () => {
    const encrypted = encryptValue("hello logto", SECRET);
    expect(decryptValue(encrypted, "another-secret")).toBeNull();
  });

  it("returns null for tampered payloads", () => {
    expect(decryptValue("not-valid-base64url!!!", SECRET)).toBeNull();
    const encrypted = encryptValue("hello logto", SECRET);
    const tampered = `${encrypted.slice(0, -4)}aaaa`;
    expect(decryptValue(tampered, SECRET)).toBeNull();
  });
});

describe("createCookieStorage", () => {
  const options = { secret: SECRET, secure: true };

  it("returns null for missing keys", async () => {
    const { cookies } = createFakeCookies();
    const storage = createCookieStorage(cookies, options);
    await expect(storage.getItem("idToken")).resolves.toBeNull();
  });

  it("round-trips values through prefixed cookies", async () => {
    const { jar, cookies } = createFakeCookies();
    const storage = createCookieStorage(cookies, options);

    await storage.setItem("idToken", "the-token");

    expect(jar.has("logto_idToken")).toBe(true);
    expect(jar.get("logto_idToken")).not.toContain("the-token");
    await expect(storage.getItem("idToken")).resolves.toBe("the-token");
  });

  it("removes values", async () => {
    const { jar, cookies } = createFakeCookies();
    const storage = createCookieStorage(cookies, options);

    await storage.setItem("refreshToken", "the-token");
    await storage.removeItem("refreshToken");

    expect(jar.has("logto_refreshToken")).toBe(false);
    await expect(storage.getItem("refreshToken")).resolves.toBeNull();
  });

  it("returns null and deletes the cookie when it cannot be decrypted", async () => {
    const { jar, deleted, cookies } = createFakeCookies();
    const foreign = createCookieStorage(cookies, {
      secret: "another-secret",
      secure: true,
    });
    await foreign.setItem("idToken", "the-token");

    const storage = createCookieStorage(cookies, options);

    expect(jar.has("logto_idToken")).toBe(true);
    await expect(storage.getItem("idToken")).resolves.toBeNull();
    expect(deleted).toContain("logto_idToken");
    expect(jar.has("logto_idToken")).toBe(false);
  });
});
