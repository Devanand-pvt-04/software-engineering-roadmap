"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { APP_SLUG } from "@/lib/brand";
import { clearAll, getState, replaceState, useHydrated, useSettings, useSync } from "@/lib/store";
import { mergeState, type State } from "@/lib/merge";
import { fmt, parseDate } from "@/lib/schedule";
import { MissEditor, RhythmEditor } from "./rhythm-editor";
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
  const backup = true;
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
    a.download = `${APP_SLUG}-progress-${new Date().toISOString().slice(0, 10)}.json`;
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
        <SectionTitle>Start date</SectionTitle>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <span className="mb-2 block text-sm font-medium">
              Start date{h && <span className="font-normal text-muted">: currently {fmt(parseDate(cfg.start))}{!cfg.startSet && " (not chosen yet, using today)"}</span>}
            </span>
            <StartPicker />
          </div>
        </div>
      </section>

      <RhythmEditor />

      <MissEditor />

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
          <button className="btn" onClick={() => download(`${APP_SLUG}-notes-${dayKey()}.md`, notesMarkdown(getState(), content, dayKey()), "text/markdown")}>
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
