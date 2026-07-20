import { describe, expect, it } from "vitest";

import {
  buildInvitationUrl,
  escapeHtml,
  hasValidBasicAuth,
  isValidEmail,
} from "./lib.mjs";

describe("invitation service helpers", () => {
  it("builds an encoded invitation URL", () => {
    const url = new URL(
      buildInvitationUrl(
        "https://betipo-tools.monteserin.dev/",
        "token+/=",
        "user+test@example.com",
      ),
    );

    expect(url.origin).toBe("https://betipo-tools.monteserin.dev");
    expect(url.pathname).toBe("/invitacion");
    expect(url.searchParams.get("token")).toBe("token+/=");
    expect(url.searchParams.get("email")).toBe("user+test@example.com");
  });

  it("validates email input", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("invalid")).toBe(false);
    expect(isValidEmail("user @example.com")).toBe(false);
  });

  it("escapes untrusted HTML", () => {
    expect(escapeHtml('<script data-x="1">&</script>')).toBe(
      "&lt;script data-x=&quot;1&quot;&gt;&amp;&lt;/script&gt;",
    );
  });

  it("checks basic authentication credentials", () => {
    const value = `Basic ${Buffer.from("admin:secret:with-colon").toString("base64")}`;
    expect(hasValidBasicAuth(value, "admin", "secret:with-colon")).toBe(true);
    expect(hasValidBasicAuth(value, "admin", "wrong")).toBe(false);
    expect(hasValidBasicAuth(undefined, "admin", "secret")).toBe(false);
  });
});
