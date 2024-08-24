import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// Load environment variables
loadEnvConfig(process.cwd());

const URL = process.env.TURSO_CONNECTION_URL!;
const AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN!;

if (!URL || !AUTH_TOKEN) {
  throw new Error("TURSO_CONNECTION_URL and TURSO_AUTH_TOKEN must be set");
}

export default defineConfig({
  schema: "./lib/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  driver: "turso",
  strict: true,
  dbCredentials: {
    url: URL,
    authToken: AUTH_TOKEN,
  },
});
