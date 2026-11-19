import "server-only";
import { neon } from "@neondatabase/serverless";
import { promises as fs } from "fs";

// Vercel's Neon integration sets DATABASE_URL; older Vercel Postgres setups use POSTGRES_URL.
const DB_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
// Local development without Postgres: a JSON file. Never set on Vercel.
const LOCAL_DB = !DB_URL ? process.env.ZTD_LOCAL_DB || "" : "";
export const dbEnabled = Boolean(DB_URL || LOCAL_DB);

/** Every table is a simple key → JSON document store. */
type Table = "progress" | "members" | "profiles";
const KEY_COL: Record<Table, string> = { progress: "user_id", members: "login", profiles: "id" };

let ready: Promise<void> | null = null;
function sql() {
  return neon(DB_URL);
}
async function ensureTables() {
  if (!ready) {
    const q = sql();
    ready = Promise.all([
      q`CREATE TABLE IF NOT EXISTS progress (user_id TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
      q`CREATE TABLE IF NOT EXISTS members (login TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
      q`CREATE TABLE IF NOT EXISTS profiles (id TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
    ]).then(() => undefined);
    ready.catch(() => (ready = null));
  }
  return ready;
}

// ---- local file backend ----
type LocalData = Record<Table, Record<string, unknown>>;
async function readLocal(): Promise<LocalData> {
  try {
    return { progress: {}, members: {}, profiles: {}, ...JSON.parse(await fs.readFile(LOCAL_DB, "utf8")) };
  } catch {
    return { progress: {}, members: {}, profiles: {} };
  }
}
async function writeLocal(d: LocalData) {
  await fs.writeFile(LOCAL_DB, JSON.stringify(d, null, 1));
}

export async function kvGet<T>(table: Table, key: string): Promise<T | null> {
  if (LOCAL_DB) return ((await readLocal())[table][key] as T) ?? null;
  await ensureTables();
  const rows = await sql().query(`SELECT data FROM ${table} WHERE ${KEY_COL[table]} = $1`, [key]);
  return (rows[0]?.data as T) ?? null;
}

export async function kvMany<T>(table: Table, keys: string[]): Promise<Record<string, T>> {
  if (!keys.length) return {};
  if (LOCAL_DB) {
    const all = (await readLocal())[table];
    return Object.fromEntries(keys.filter((k) => k in all).map((k) => [k, all[k] as T]));
  }
  await ensureTables();
  const rows = await sql().query(`SELECT ${KEY_COL[table]} AS k, data FROM ${table} WHERE ${KEY_COL[table]} = ANY($1)`, [keys]);
  return Object.fromEntries(rows.map((r) => [r.k as string, r.data as T]));
}

export async function kvList<T>(table: Table): Promise<T[]> {
  if (LOCAL_DB) return Object.values((await readLocal())[table]) as T[];
  await ensureTables();
  const rows = await sql().query(`SELECT data FROM ${table} ORDER BY ${KEY_COL[table]}`);
  return rows.map((r) => r.data as T);
}

export async function kvSet(table: Table, key: string, data: unknown): Promise<void> {
  if (LOCAL_DB) {
    const d = await readLocal();
    d[table][key] = data;
    return writeLocal(d);
  }
  await ensureTables();
  await sql().query(
    `INSERT INTO ${table} (${KEY_COL[table]}, data, updated_at) VALUES ($1, $2::jsonb, now())
     ON CONFLICT (${KEY_COL[table]}) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [key, JSON.stringify(data)],
  );
}

export async function kvDelete(table: Table, key: string): Promise<void> {
  if (LOCAL_DB) {
    const d = await readLocal();
    delete d[table][key];
    return writeLocal(d);
  }
  await ensureTables();
  await sql().query(`DELETE FROM ${table} WHERE ${KEY_COL[table]} = $1`, [key]);
}

export const readProgress = (userId: string) => kvGet<unknown>("progress", userId);
export const writeProgress = (userId: string, data: unknown) => kvSet("progress", userId, data);
