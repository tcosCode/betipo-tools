import { describe, expect, it } from "vitest";

import { parseEnv } from "./env";

const urlWithEnv = (env?: string) => {
  const url = new URL("https://example.com/api/formaciones");
  if (env !== undefined) {
    url.searchParams.set("env", env);
  }
  return url;
};

describe("parseEnv", () => {
  it("defaults to dev when env is omitted", () => {
    expect(parseEnv(urlWithEnv())).toBe("dev");
  });

  it("accepts dev", () => {
    expect(parseEnv(urlWithEnv("dev"))).toBe("dev");
  });

  it("accepts prod", () => {
    expect(parseEnv(urlWithEnv("prod"))).toBe("prod");
  });

  it("rejects unknown environments", () => {
    expect(parseEnv(urlWithEnv("staging"))).toBeNull();
  });
});
