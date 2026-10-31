import { defineConfig } from "drizzle-kit";
import { existsSync } from "fs";

if (existsSync(".env")) {
  try {
    process.loadEnvFile(".env");
  } catch {}
}
if (existsSync(".env.local")) {
  try {
    process.loadEnvFile(".env.local");
  } catch {}
}

const isTurso = Boolean(process.env.TURSO_DATABASE_URL);

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: isTurso ? "turso" : "sqlite",
  dbCredentials: isTurso
    ? {
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }
    : {
        url: process.env.DATABASE_URL || "file:local.db",
      },
});
