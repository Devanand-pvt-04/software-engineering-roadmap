import { neon } from "@neondatabase/serverless";

// Vercel's Neon integration sets DATABASE_URL; older Vercel Postgres setups use POSTGRES_URL.
const DB_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
export const dbEnabled = Boolean(DB_URL);

let ready: Promise<void> | null = null;

function sql() {
  return neon(DB_URL);
}

async function ensureTable() {
  if (!ready) {
    ready = sql()`
      CREATE TABLE IF NOT EXISTS progress (
        user_id    TEXT PRIMARY KEY,
        data       JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`.then(() => undefined);
    ready.catch(() => (ready = null));
  }
  return ready;
}

export async function readProgress(userId: string): Promise<unknown | null> {
  await ensureTable();
  const rows = await sql()`SELECT data FROM progress WHERE user_id = ${userId}`;
  return rows[0]?.data ?? null;
}

export async function writeProgress(userId: string, data: unknown): Promise<void> {
  await ensureTable();
  await sql()`
    INSERT INTO progress (user_id, data, updated_at)
    VALUES (${userId}, ${JSON.stringify(data)}::jsonb, now())
    ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`;
}
