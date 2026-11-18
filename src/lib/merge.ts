// Shared by the browser and the API route: last-writer-wins per entry.

export interface Entry {
  v: unknown;
  t: number; // ms timestamp of last change
}
export interface State {
  version: 1;
  entries: Record<string, Entry>;
}

export const emptyState = (): State => ({ version: 1, entries: {} });

const MAX_KEYS = 20_000;
const MAX_KEY_LEN = 120;

export function sanitize(input: unknown): State {
  const out = emptyState();
  if (!input || typeof input !== "object") return out;
  const entries = (input as { entries?: unknown }).entries;
  if (!entries || typeof entries !== "object") return out;
  let n = 0;
  for (const [k, e] of Object.entries(entries as Record<string, unknown>)) {
    if (n++ >= MAX_KEYS) break;
    if (typeof k !== "string" || k.length > MAX_KEY_LEN) continue;
    if (!e || typeof e !== "object") continue;
    const t = (e as Entry).t;
    if (typeof t !== "number" || !Number.isFinite(t)) continue;
    out.entries[k] = { v: (e as Entry).v ?? null, t };
  }
  return out;
}

export function mergeState(a: unknown, b: unknown): State {
  const A = sanitize(a);
  const B = sanitize(b);
  const entries: Record<string, Entry> = { ...A.entries };
  for (const [k, e] of Object.entries(B.entries)) {
    const cur = entries[k];
    if (!cur || e.t > cur.t) entries[k] = e;
  }
  return { version: 1, entries };
}
