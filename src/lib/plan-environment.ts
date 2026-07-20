import { parseEnv } from "./env";

export type PlanEnvironmentResult =
  | { success: true; env: "dev" }
  | { success: false; status: 400 | 403; error: string };

export const parsePlanEnvironment = (url: URL): PlanEnvironmentResult => {
  const env = parseEnv(url);
  if (!env) {
    return { success: false, status: 400, error: "Invalid environment" };
  }
  if (env !== "dev") {
    return {
      success: false,
      status: 403,
      error: "Plan creation is restricted to development",
    };
  }
  return { success: true, env };
};
