import { parseEnv } from "./env";

export type CampaignEnvironmentResult =
  | { success: true; env: "dev" }
  | { success: false; status: 400 | 403; error: string };

export const parseCampaignEnvironment = (
  url: URL,
): CampaignEnvironmentResult => {
  const env = parseEnv(url);
  if (!env) {
    return { success: false, status: 400, error: "Invalid environment" };
  }

  if (env !== "dev") {
    return {
      success: false,
      status: 403,
      error: "Campaign management is restricted to development",
    };
  }

  return { success: true, env };
};
