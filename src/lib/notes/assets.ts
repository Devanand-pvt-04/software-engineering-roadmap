"use client";
// Images in notes. They are too big for the synced progress document, so each one is stored in this
// browser's IndexedDB and, when the person is signed in, uploaded to /api/assets/<id> so other devices can
// fetch it. Notes refer to them as ![alt](asset:<id>).
//
// The same database keeps a local version history of each note.

const DB = "ztd-notes";
const VERSION = 1;

interface AssetRow {
  id: string;
  type: string;
  data: Blob;
  /** Not yet uploaded. */
  pending?: boolean;
}
export interface Snapshot {
  noteId: string;
  t: number;
  title: string;
  body: string;
}

let dbp: Promise<IDBDatabase> | null = null;
function db(): Promise<IDBDatabase> {
  if (!dbp)
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open(DB, VERSION);
      r.onupgradeneeded = () => {
        const d = r.result;
        if (!d.objectStoreNames.contains("assets")) d.createObjectStore("assets", { keyPath: "id" });
        if (!d.objectStoreNames.contains("history")) {
          const h = d.createObjectStore("history", { autoIncrement: true });
          h.createIndex("noteId", "noteId");
        }
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  dbp.catch(() => (dbp = null));
  return dbp;
}
function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return db().then(
    (d) =>
      new Promise((res, rej) => {
        const t = d.transaction(store, mode);
        const req = fn(t.objectStore(store));
        t.oncomplete = () => res(req ? req.result : undefined);
        t.onerror = () => rej(t.error);
      }),
  );
}

// ---------- sync ----------
let signedIn = false;
export function setAssetSync(on: boolean) {
  if (on === signedIn) return;
  signedIn = on;
  if (on) void uploadPending();
}

function blobToDataUrl(b: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(b);
  });
}
function dataUrlToBlob(u: string): Blob {
  const [head, b64] = u.split(",");
  const type = head.match(/data:([^;]+)/)?.[1] ?? "application/octet-stream";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type });
}

async function upload(row: AssetRow) {
  if (!signedIn) return;
  try {
    const res = await fetch(`/api/assets/${row.id}`, { method: "PUT", headers: { "content-type": "text/plain" }, body: await blobToDataUrl(row.data) });
    if (res.ok) await tx("assets", "readwrite", (s) => s.put({ ...row, pending: false }));
  } catch {
    /* stays pending, retried on next sign-in */
  }
}
async function uploadPending() {
  const all = ((await tx<AssetRow[]>("assets", "readonly", (s) => s.getAll() as IDBRequest<AssetRow[]>)) ?? []).filter((r) => r.pending);
  for (const r of all) await upload(r);
}

// ---------- images ----------
const MAX_SIDE = 1800;

/** Shrinks big photos and screenshots so notes stay light. Small images are kept as they are. */
export async function compressImage(file: Blob): Promise<Blob> {
  if (file.type === "image/svg+xml" || file.type === "image/gif" || file.size < 350_000) return file;
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k);
    c.height = Math.round(bmp.height * k);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    const out = await new Promise<Blob | null>((r) => c.toBlob(r, "image/webp", 0.85));
    return out && out.size < file.size ? out : file;
  } catch {
    return file;
  }
}

export async function saveImage(file: Blob): Promise<string> {
  const data = await compressImage(file);
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const row: AssetRow = { id, type: data.type, data, pending: true };
  await tx("assets", "readwrite", (s) => s.put(row));
  void upload(row);
  return id;
}

const urlCache = new Map<string, string>();
const inflight = new Map<string, Promise<Blob | null>>();

/** The image's bytes: from this browser, else from the account (then kept here). */
export function getImage(id: string): Promise<Blob | null> {
  if (!/^[a-z0-9]{4,40}$/.test(id)) return Promise.resolve(null);
  const cur = inflight.get(id);
  if (cur) return cur;
  const p = (async () => {
    try {
      const row = await tx<AssetRow>("assets", "readonly", (s) => s.get(id) as IDBRequest<AssetRow>);
      if (row) return row.data;
    } catch {
      /* fall through to the server */
    }
    try {
      const res = await fetch(`/api/assets/${id}`);
      if (!res.ok) return null;
      const blob = dataUrlToBlob(await res.text());
      await tx("assets", "readwrite", (s) => s.put({ id, type: blob.type, data: blob } satisfies AssetRow)).catch(() => {});
      return blob;
    } catch {
      return null;
    }
  })();
  inflight.set(id, p);
  p.finally(() => inflight.delete(id));
  return p;
}

export async function imageUrl(id: string): Promise<string | null> {
  const hit = urlCache.get(id);
  if (hit) return hit;
  const b = await getImage(id);
  if (!b) return null;
  const u = URL.createObjectURL(b);
  urlCache.set(id, u);
  return u;
}
export async function imageDataUrl(id: string): Promise<string | null> {
  const b = await getImage(id);
  return b ? blobToDataUrl(b) : null;
}

export const assetIds = (body: string) => [...new Set([...body.matchAll(/\(asset:([a-z0-9]+)\)/g)].map((m) => m[1]))];

// ---------- version history (this browser only) ----------
const KEEP = 50;
const GAP = 4 * 60_000;
const lastSnap = new Map<string, number>();

/** Saves a version at most every few minutes while a note is being edited. */
export async function snapshot(noteId: string, title: string, body: string, force = false) {
  const now = Date.now();
  if (!force && now - (lastSnap.get(noteId) ?? 0) < GAP) return;
  lastSnap.set(noteId, now);
  try {
    const list = await history(noteId);
    if (list[0] && list[0].body === body && list[0].title === title) return;
    await tx("history", "readwrite", (s) => s.add({ noteId, t: now, title, body } satisfies Snapshot));
    if (list.length >= KEEP) {
      const d = await db();
      const t = d.transaction("history", "readwrite");
      const idx = t.objectStore("history").index("noteId");
      const req = idx.openCursor(IDBKeyRange.only(noteId));
      let n = list.length + 1 - KEEP;
      req.onsuccess = () => {
        const cur = req.result;
        if (cur && n-- > 0) {
          cur.delete();
          cur.continue();
        }
      };
    }
  } catch {
    /* history is a convenience */
  }
}

export async function history(noteId: string): Promise<Snapshot[]> {
  try {
    const d = await db();
    return await new Promise((res, rej) => {
      const r = d.transaction("history").objectStore("history").index("noteId").getAll(IDBKeyRange.only(noteId));
      r.onsuccess = () => res((r.result as Snapshot[]).sort((a, b) => b.t - a.t));
      r.onerror = () => rej(r.error);
    });
  } catch {
    return [];
  }
}

/** Restores an image from a backup under its original id. */
export async function putImage(id: string, dataUrl: string) {
  if (!/^[a-z0-9]{4,40}$/.test(id) || !dataUrl.startsWith("data:image/")) return;
  const blob = dataUrlToBlob(dataUrl);
  const row: AssetRow = { id, type: blob.type, data: blob, pending: true };
  await tx("assets", "readwrite", (s) => s.put(row));
  void upload(row);
}
