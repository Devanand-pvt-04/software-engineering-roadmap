"use client";

import Link from "next/link";
import { Fragment } from "react";
import { TRACK_LABEL, type Track } from "@/lib/roadmap";
import { groupOf, useContent } from "@/lib/content";
import { weekProgress } from "@/lib/progress";
import { useHydrated, useSettings, useStore, useToday } from "@/lib/store";
import { fmtShort, position, slots, weekStartFor } from "@/lib/schedule";
import { Bar } from "./ui";

export function PlanView() {
  const c = useContent();
  const tracks = c.tracks;
  const cols = tracks.length > 1 ? "sm:grid-cols-[88px_1fr_1fr]" : "sm:grid-cols-[88px_1fr]";
  const s = useStore();
  const h = useHydrated();
  const cfg = useSettings();
  const now = useToday();
  const pos = now ? position(cfg.start, cfg.slide, cfg.buffers, now) : null;
  const all = slots(cfg.buffers);

  const Cell = ({ track, n }: { track: Track; n: number }) => {
    const w = c.weeks[track]![n - 1];
    const p = weekProgress(s, track, w);
    return (
      <Link href={`/${track}/${n}`} className="block rounded-lg p-2 hover:bg-panel-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[14px] leading-snug">{w.title}</span>
          {p.passed && <span className="shrink-0 text-xs font-semibold text-ok">✓</span>}
        </div>
        <Bar value={h ? p.ratio : 0} track={track} className="mt-1.5" />
      </Link>
    );
  };

  // Which week rows start a new phase/part (for the group header rows).
  const newGroup = new Map<number, Partial<Record<Track, boolean>>>();
  {
    const last: Partial<Record<Track, string>> = {};
    for (let n = 1; n <= 36; n++) {
      const row: Partial<Record<Track, boolean>> = {};
      for (const t of tracks) {
        const g = groupOf(c, t, n)!.id;
        row[t] = g !== last[t];
        last[t] = g;
      }
      newGroup.set(n, row);
    }
  }
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">The 36-week map</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-muted">
          {tracks.length > 1
            ? "Two tracks in parallel: Main on Mon, Wed, Fri and Sat; Java + DSA on Tue, Thu and Sun. Find the current week, open its tab, tick today's box."
            : `${TRACK_LABEL[tracks[0]]} on ${c.schedule.filter((r) => r.track === tracks[0]).map((r) => r.day).join(", ")}. Find the current week, open it, tick today's box.`}
        </p>
      </header>

      <section className={`grid gap-3 ${tracks.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {tracks.map((t) => (
          <div key={t} className="card p-4">
            <div className={`mb-2 text-xs font-semibold uppercase tracking-wider ${t === "main" ? "text-main" : "text-java"}`}>{t === "main" ? "Main track phases" : "Java + DSA parts"}</div>
            <ul className="space-y-2">
              {c.groups[t]!.map((g) => (
                <li key={g.id} className="text-sm">
                  <span className="font-semibold">{g.id}</span> <span className="text-muted">(W{g.weeks[0]}-{g.weeks[g.weeks.length - 1]})</span> {g.title.replace(/\s*\(Weeks.*\)$/, "")}
                  {c.phaseSummary[g.id] && <div className="text-xs text-muted">Unlocks: {c.phaseSummary[g.id].unlocks}</div>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <div className="card overflow-hidden">
        <div className={`hidden gap-3 border-b border-line bg-panel-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted sm:grid ${cols}`}>
          <div>Week</div>
          {tracks.map((t) => (
            <div key={t}>{TRACK_LABEL[t]}</div>
          ))}
        </div>
        {all.map((slot, i) => {
          const current = pos?.status === "active" && pos.index === i;
          if (slot.kind === "buffer")
            return (
              <div key={`b${slot.after}`} className={`border-b border-line px-4 py-2 text-sm text-muted ${current ? "bg-accent-soft" : "bg-panel-2/50"}`}>
                Optional buffer week: catch up, or revisit the Overlooked lists
              </div>
            );
          const n = slot.n;
          const ng = newGroup.get(n)!;
          const header = tracks.some((t) => ng[t]) ? (
            <div className={`grid grid-cols-1 gap-3 border-b border-line bg-panel-2/60 px-4 py-1.5 text-xs font-semibold text-muted ${cols}`}>
              <div className="hidden sm:block" />
              {tracks.map((t) => {
                const g = groupOf(c, t, n)!;
                return (
                  <div key={t} className={t === "main" ? "text-main" : "text-java"}>
                    {ng[t] ? `${g.id}: ${g.title.replace(/\s*\(Weeks.*\)$/, "")}` : ""}
                  </div>
                );
              })}
            </div>
          ) : null;
          return (
            <Fragment key={n}>
              {header}
              <div id={`w${n}`} className={`grid grid-cols-1 gap-1 border-b border-line px-2 py-2 sm:gap-3 sm:px-4 ${cols} ${current ? "bg-accent-soft" : ""}`}>
                <div className="px-2 pt-2 text-sm">
                  <span className="font-semibold">W{n}</span>
                  {h && <span className="ml-2 text-xs text-muted sm:ml-0 sm:block">{fmtShort(weekStartFor(n, cfg.start, cfg.slide, cfg.buffers))}</span>}
                  {current && <span className="ml-2 text-xs font-semibold text-accent sm:ml-0 sm:block">Now</span>}
                </div>
                {tracks.map((t) => (
                  <Cell key={t} track={t} n={n} />
                ))}
              </div>
            </Fragment>
          );
        })}
      </div>
      <p className="text-sm text-muted">
        Buffer weeks are {cfg.buffers ? "shown" : "hidden"}.{" "}
        <Link href="/settings" className="underline hover:text-fg">
          Change in settings
        </Link>
        .
      </p>
    </div>
  );
}
