import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

function sanitizeEnv(val?: string | null): string | undefined {
  if (!val) return undefined;
  const clean = val.trim().replace(/^["']|["']$/g, "").trim();
  return clean.length > 0 ? clean : undefined;
}

const tursoUrl = sanitizeEnv(process.env.TURSO_DATABASE_URL);
const databaseUrl = sanitizeEnv(process.env.DATABASE_URL);
const authToken = sanitizeEnv(process.env.TURSO_AUTH_TOKEN);

const url = tursoUrl || databaseUrl || "file:local.db";

export const client = createClient({
  url,
  authToken: authToken || undefined,
});

export const db = drizzle(client, { schema });
export { schema };

let tablesInitPromise: Promise<void> | null = null;

export async function ensureTablesExist(): Promise<void> {
  if (tablesInitPromise) return tablesInitPromise;

  tablesInitPromise = (async () => {
    try {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS companies (
          id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          sector TEXT NOT NULL,
          careers_url TEXT NOT NULL,
          scraper_type TEXT NOT NULL,
          typical_season TEXT,
          logo_url TEXT,
          last_checked_at INTEGER
        );
      `);

      await client.execute(`
        CREATE TABLE IF NOT EXISTS internships (
          id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          category TEXT NOT NULL,
          location TEXT NOT NULL,
          application_url TEXT NOT NULL UNIQUE,
          status TEXT NOT NULL,
          source TEXT NOT NULL,
          source_type TEXT DEFAULT 'portal',
          submitted_by TEXT,
          posted_at INTEGER,
          expires_at INTEGER,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
        );
      `);
    } catch (err: any) {
      console.error("[Database] ensureTablesExist error:", err.message || err);
      tablesInitPromise = null;
    }
  })();

  return tablesInitPromise;
}
