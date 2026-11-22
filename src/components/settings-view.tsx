"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { clearAll, getState, replaceState, setEntry, useHydrated, useSettings, useSync } from "@/lib/store";
import { mergeState, type State } from "@/lib/merge";
import { endDate, fmt, parseDate } from "@/lib/schedule";
import { StartPicker } from "./start-picker";
import { useContent } from "@/lib/content";
import { download, notesMarkdown } from "@/lib/notes-export";
import { dayKey } from "@/lib/schedule";
import { SectionTitle } from "./ui";
import { signInGitHub, signOutAction } from "@/app/actions";

function useTheme(): [string, (t: string) => void] {
  const t = useSyncExternalStore(
    (cb) => {
      window.addEventListener("ztd-theme", cb);
      return () => window.removeEventListener("ztd-theme", cb);
    },
    () => document.documentElement.dataset.theme || "system",
    () => "system",
  );
  const set = (v: string) => {
    try {
      if (v === "system") {
        delete document.documentElement.dataset.theme;
        localStorage.removeItem("ztd:theme");
      } else {
        document.documentElement.dataset.theme = v;
        localStorage.setItem("ztd:theme", v);
      }
    } catch {}
    window.dispatchEvent(new Event("ztd-theme"));
  };
  return [t, set];
}

export function SettingsView() {
  const cfg = useSettings();
  const content = useContent();
  const backup = content.features.includes("backup");
  const h = useHydrated();
  const sync = useSync();
  const [theme, setTheme] = useTheme();
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(getState(), null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `zero-to-deep-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importJson = async (f: File) => {
    try {
      const data = JSON.parse(await f.text());
      replaceState(mergeState(getState(), data));
      setMsg("Imported and merged. Newer entries won.");
    } catch {
      setMsg("That file isn't a valid progress export.");
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
      </header>

      <section className="card p-5">
        <SectionTitle>Calendar</SectionTitle>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <span className="mb-2 block text-sm font-medium">
              Start date{h && <span className="font-normal text-muted">: currently {fmt(parseDate(cfg.start))}{!cfg.startSet && " (not chosen yet, using this week)"}</span>}
            </span>
            <StartPicker />
          </div>
          <div>
            <span className="mb-1 block text-sm font-medium">Slide the calendar</span>
            <div className="flex items-center gap-2">
              <button className="btn" onClick={() => setEntry("cfg:slide", Math.max(0, cfg.slide - 1))} disabled={cfg.slide === 0} aria-label="Slide back one week">
                −
              </button>
              <span className="w-24 text-center tabular-nums">{h ? `${cfg.slide} week${cfg.slide === 1 ? "" : "s"}` : "0 weeks"}</span>
              <button className="btn" onClick={() => setEntry("cfg:slide", cfg.slide + 1)} aria-label="Slide forward one week">
                +
              </button>
            </div>
            <span className="mt-1 block text-xs text-muted">Missed days? Slide the whole calendar by a week. Never cram, never skip.</span>
          </div>
          <label className="flex items-start gap-3 sm:col-span-2">
            <input type="checkbox" className="mt-1 size-4 accent-[var(--accent)]" checked={h && cfg.buffers} onChange={(e) => setEntry("cfg:buffers", e.target.checked)} />
            <span>
              <span className="block text-sm font-medium">Include buffer weeks</span>
              <span className="block text-xs text-muted">Optional catch-up weeks after weeks 6, 12, 18, 24 and 30. Makes the plan 41 weeks; that&apos;s normal and expected.</span>
            </span>
          </label>
        </div>
        {h && <p className="mt-4 text-sm">Your plan ends on <b>{fmt(endDate(cfg.start, cfg.slide, cfg.buffers))}</b>.</p>}
      </section>

      <section className="card p-5">
        <SectionTitle>Account and sync</SectionTitle>
        {!sync.authEnabled ? (
          <p className="text-sm text-muted">Cloud sync isn&apos;t configured on this deployment, so progress is saved in this browser. Use export and import below to move it.</p>
        ) : sync.user ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              Signed in as <b>{sync.user.name}</b>. Progress syncs across your devices.
              <span className="ml-1 text-muted">({sync.status})</span>
            </p>
            <div className="flex gap-2">
              <button className="btn" onClick={sync.syncNow}>
                Sync now
              </button>
              <form action={signOutAction}>
                <button className="btn">Sign out</button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">Sign in with GitHub to sync progress across devices. Anything you ticked here is merged into your account.</p>
            <form action={signInGitHub}>
              <button className="btn btn-primary">Sign in with GitHub</button>
            </form>
          </div>
        )}
      </section>

      <section className="card p-5">
        <SectionTitle>Appearance</SectionTitle>
        <div className="flex gap-1.5" role="radiogroup" aria-label="Theme">
          {["system", "light", "dark"].map((t) => (
            <button key={t} role="radio" aria-checked={theme === t} onClick={() => setTheme(t)} className={`chip !px-3 !py-2 capitalize ${theme === t ? "!border-accent !text-accent" : ""}`}>
              {t}
            </button>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <SectionTitle>{backup ? "Backup" : "Reset"}</SectionTitle>
        {backup && (
        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={exportJson}>
            Export progress (JSON)
          </button>
          <button className="btn" onClick={() => file.current?.click()}>
            Import…
          </button>
          <button className="btn" onClick={() => download(`zero-to-deep-notes-${dayKey()}.md`, notesMarkdown(getState(), content, dayKey()), "text/markdown")}>
            Export notes (Markdown)
          </button>
          <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
        </div>
        )}
        {msg && <p className="mt-2 text-sm text-muted">{msg}</p>}
        <div className={backup ? "mt-6 border-t border-line pt-4" : ""}>
          {!confirmReset ? (
            <button className="text-sm text-danger hover:underline" onClick={() => setConfirmReset(true)}>
              Reset all progress…
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span>
                This clears ticks, quiz marks, notes, problems and your start date{sync.user ? " here and in your synced copy, so every signed-in device resets too" : " in this browser"}. Export first if unsure.
              </span>
              <button
                className="btn !border-danger !text-danger"
                onClick={async () => {
                  let remote: State | undefined;
                  if (sync.user) {
                    try {
                      const res = await fetch("/api/progress");
                      if (res.ok) remote = (await res.json()) as State;
                    } catch {}
                  }
                  clearAll(remote);
                  if (sync.user) sync.syncNow();
                  setConfirmReset(false);
                  setMsg(sync.user ? "All progress cleared, including your synced copy." : "All progress cleared.");
                }}
              >
                Yes, reset
              </button>
              <button className="btn" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
