import { getSecret } from "astro:env/server";
import postgres from "postgres";
import type { AppEnv } from "./env";

const requireSecret = (key: string) => {
  const value = getSecret(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const dbHost = requireSecret("DB_HOST");
const dbPort = parseInt(getSecret("DB_PORT") || "5432", 10);
const dbUsername = requireSecret("DB_USERNAME");
const dbPassword = requireSecret("DB_PASSWORD");

const sqlDev = postgres({
  host: dbHost,
  port: dbPort,
  database: requireSecret("DB_DATABASE"),
  username: dbUsername,
  password: dbPassword,
  ssl: "require",
});

const sqlProd = postgres({
  host: dbHost,
  port: dbPort,
  database: requireSecret("DB_DATABASE_PROD"),
  username: dbUsername,
  password: dbPassword,
  ssl: "require",
});

export const getDb = (env: AppEnv = "dev") => {
  return env === "prod" ? sqlProd : sqlDev;
};

export default sqlDev;
