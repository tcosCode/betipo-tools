export type AppEnv = "dev" | "prod";

export const parseEnv = (url: URL): AppEnv | null => {
  const env = url.searchParams.get("env") || "dev";
  return env === "dev" || env === "prod" ? env : null;
};
