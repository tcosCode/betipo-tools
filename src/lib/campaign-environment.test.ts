import { describe, expect, it } from "vitest";

import { parseCampaignEnvironment } from "./campaign-environment";

describe("parseCampaignEnvironment", () => {
  it("admite desarrollo por defecto", () => {
    expect(
      parseCampaignEnvironment(new URL("https://tools.test/api/campannas")),
    ).toEqual({
      success: true,
      env: "dev",
    });
  });

  it("bloquea producción", () => {
    expect(
      parseCampaignEnvironment(
        new URL("https://tools.test/api/campannas?env=prod"),
      ),
    ).toEqual({
      success: false,
      status: 403,
      error: "Campaign management is restricted to development",
    });
  });

  it("rechaza entornos desconocidos", () => {
    expect(
      parseCampaignEnvironment(
        new URL("https://tools.test/api/campannas?env=staging"),
      ),
    ).toEqual({
      success: false,
      status: 400,
      error: "Invalid environment",
    });
  });
});
