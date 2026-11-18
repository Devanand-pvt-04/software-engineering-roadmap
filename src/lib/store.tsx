"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { DEFAULT_START } from "@/data/guide";
import { mergeState, emptyState, type Entry, type State } from "./merge";

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
export function setEntry(key: string, v: unknown) {
  const e: Entry = { v, t: Date.now() };
  replaceState({ ...state, entries: { ...state.entries, [key]: e } });
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
  return useValue<boolean>(key, false);
}
export function isChecked(s: State, key: string) {
  return !!s.entries[key]?.v;
}

export interface Settings {
  start: string;
  slide: number;
  buffers: boolean;
}
export function useSettings(): Settings {
  const s = useStore();
  return {
    start: (s.entries["cfg:start"]?.v as string) || DEFAULT_START,
    slide: (s.entries["cfg:slide"]?.v as number) || 0,
    buffers: !!s.entries["cfg:buffers"]?.v,
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
