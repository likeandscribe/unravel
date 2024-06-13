import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const POSTGRES_URL = process.env.POSTGRES_URL;
if (!POSTGRES_URL) {
  throw new Error("POSTGRES_URL is not set");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/schema.ts",
  out: "./drizzle",
  strict: true,
  verbose: true,
  dbCredentials: {
    url: POSTGRES_URL,
  },
});
