"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { DEFAULT_START } from "./constants";
import { dayKey } from "./schedule";
import { mergeState, emptyState, type Entry, type State } from "./merge";
import { setAssetSync } from "./notes/assets";

const LS_KEY = "ztd:v1";

// ---------- module-level store ----------
let state: State = emptyState();
let loaded = false;
const listeners = new Set<() => void>();
let onLocalChange: (() => void) | null = null;

function emit() {
  listeners.forEach((l) => l());
}
function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (raw) state = mergeState(emptyState(), JSON.parse(raw));
  } catch {
    /* ignore corrupt storage */
  }
}
function persist() {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    /* storage may be unavailable */
  }
}
export function getState(): State {
  return state;
}
export function replaceState(next: State, fromRemote = false) {
  state = next;
  persist();
  emit();
  if (!fromRemote) onLocalChange?.();
}
/** A timestamp newer than the key's current one, so a write always wins last-writer-wins merges (even after a reset stamped ahead of this clock). */
const nextT = (key: string, now = Date.now()) => Math.max(now, (state.entries[key]?.t ?? 0) + 1);

export function setEntry(key: string, v: unknown) {
  load();
  const e: Entry = { v, t: nextT(key) };
  replaceState({ ...state, entries: { ...state.entries, [key]: e } });
}
/** Write several entries at once. `t` keeps an entry's original time (when copying one), but never below the key's current time. */
export function setEntries(list: { key: string; v: unknown; t?: number }[]) {
  load();
  const entries = { ...state.entries };
  const now = Date.now();
  for (const x of list) entries[x.key] = { v: x.v, t: Math.max(x.t ?? now, (entries[x.key]?.t ?? 0) + 1) };
  replaceState({ ...state, entries });
}
/**
 * Clear every saved entry: ticks, quiz marks, notes, problems, settings. Each key becomes an empty
 * entry with a fresh timestamp rather than disappearing, so the cleared value wins the last-writer-wins
 * merge against the synced copy and other devices instead of being merged back in.
 * Pass the synced copy as `also` so keys this browser has never seen are cleared too.
 */
export function clearAll(also?: State) {
  load();
  // Newer than every entry on either side, so the reset wins even over an entry stamped in the
  // future (a device with its clock ahead, or a back-dated tick that landed after today).
  let t = Date.now();
  for (const e of [...Object.values(state.entries), ...Object.values(also?.entries ?? {})]) if (e.t >= t) t = e.t + 1;
  const entries: Record<string, Entry> = {};
  for (const k of new Set([...Object.keys(state.entries), ...Object.keys(also?.entries ?? {})])) entries[k] = { v: null, t };
  replaceState({ version: 1, entries });
}
function subscribe(l: () => void) {
  load();
  listeners.add(l);
  return () => listeners.delete(l);
}
const serverSnapshot = emptyState();

export function useStore(): State {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return state;
    },
    () => serverSnapshot,
  );
}

// A clock that is null during prerender and ticks every minute on the client.
let today: Date | null = null;
function subscribeClock(cb: () => void) {
  const id = setInterval(() => {
    today = new Date();
    cb();
  }, 60_000);
  return () => clearInterval(id);
}
export function useToday(): Date | null {
  return useSyncExternalStore(
    subscribeClock,
    () => {
      if (!today) today = new Date();
      return today;
    },
    () => null,
  );
}

/** True after the first client render, so date-dependent UI can avoid hydration mismatches. */
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function useValue<T>(key: string, fallback: T): [T, (v: T) => void] {
  const s = useStore();
  const e = s.entries[key];
  const v = (e && e.v !== null && e.v !== undefined ? e.v : fallback) as T;
  const set = useCallback((nv: T) => setEntry(key, nv), [key]);
  return [v, set];
}
export function useCheck(key: string): [boolean, (v: boolean) => void] {
  const [v, set] = useValue<unknown>(key, false);
  return [!!v, set as (v: boolean) => void];
}
export function isChecked(s: State, key: string) {
  return !!s.entries[key]?.v;
}

export interface Settings {
  start: string;
  /** False until the person picks a start date; until then the plan starts today. */
  startSet: boolean;
}
export function useSettings(): Settings {
  const s = useStore();
  const today = useToday();
  const chosen = s.entries["cfg:start"]?.v as string | undefined;
  return {
    start: chosen || (today ? dayKey(today) : DEFAULT_START),
    startSet: !!chosen,
  };
}

// ---------- cloud sync ----------
export type SyncStatus = "local" | "syncing" | "synced" | "error";
interface SyncCtx {
  status: SyncStatus;
  user: { name?: string | null; image?: string | null } | null;
  authEnabled: boolean;
  lastSynced: number | null;
  syncNow: () => void;
}
const Ctx = createContext<SyncCtx>({ status: "local", user: null, authEnabled: false, lastSynced: null, syncNow: () => {} });
export const useSync = () => useContext(Ctx);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<{ enabled: boolean; user: SyncCtx["user"] }>({ enabled: false, user: null });
  const user = me.user;
  const authEnabled = me.enabled;
  const [status, setStatus] = useState<SyncStatus>("local");
  const [lastSynced, setLastSynced] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflight = useRef(false);

  const push = useCallback(async () => {
    if (!user || inflight.current) return;
    inflight.current = true;
    setStatus("syncing");
    try {
      const res = await fetch("/api/progress", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(getState()),
      });
      if (!res.ok) throw new Error(String(res.status));
      const merged = (await res.json()) as State;
      replaceState(mergeState(getState(), merged), true);
      setStatus("synced");
      setLastSynced(Date.now());
    } catch {
      setStatus("error");
    } finally {
      inflight.current = false;
    }
  }, [user]);

  // Note images upload only for signed-in people.
  useEffect(() => setAssetSync(!!user), [user]);

  // who am I?
  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : { enabled: false, user: null }))
      .then(setMe)
      .catch(() => {});
  }, []);

  // initial pull + merge
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/progress");
        if (!res.ok) throw new Error(String(res.status));
        const remote = (await res.json()) as State;
        if (cancelled) return;
        load();
        replaceState(mergeState(getState(), remote), true);
        await push();
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, push]);

  // debounce pushes on local edits
  useEffect(() => {
    if (!user) return;
    onLocalChange = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(push, 1200);
    };
    const flush = () => {
      if (document.visibilityState === "hidden" && timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
        navigator.sendBeacon?.("/api/progress", new Blob([JSON.stringify(getState())], { type: "application/json" }));
      }
    };
    document.addEventListener("visibilitychange", flush);
    return () => {
      onLocalChange = null;
      document.removeEventListener("visibilitychange", flush);
    };
  }, [user, push]);

  return (
    <Ctx.Provider value={{ status: user ? status : "local", user, authEnabled, lastSynced, syncNow: push }}>
      {children}
    </Ctx.Provider>
  );
}
