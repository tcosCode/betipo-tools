import { describe, expect, it } from "vitest";

import { parsePlanEnvironment } from "./plan-environment";

describe("parsePlanEnvironment", () => {
  it("permite desarrollo", () => {
    expect(parsePlanEnvironment(new URL("https://tools.test?env=dev"))).toEqual(
      {
        success: true,
        env: "dev",
      },
    );
  });

  it("bloquea producción", () => {
    expect(
      parsePlanEnvironment(new URL("https://tools.test?env=prod")),
    ).toEqual({
      success: false,
      status: 403,
      error: "Plan creation is restricted to development",
    });
  });

  it("rechaza entornos desconocidos", () => {
    expect(
      parsePlanEnvironment(new URL("https://tools.test?env=staging")),
    ).toEqual({
      success: false,
      status: 400,
      error: "Invalid environment",
    });
  });
});
