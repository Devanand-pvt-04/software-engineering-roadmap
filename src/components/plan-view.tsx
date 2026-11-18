"use client";

import Link from "next/link";
import { Fragment } from "react";
import { GROUPS, WEEKS, groupOf, type Track } from "@/lib/roadmap";
import { weekProgress } from "@/lib/progress";
import { useHydrated, useSettings, useStore, useToday } from "@/lib/store";
import { fmtShort, position, slots, weekStartFor } from "@/lib/schedule";
import { PHASE_SUMMARY } from "@/data/guide";
import { Bar } from "./ui";

export function PlanView() {
  const s = useStore();
  const h = useHydrated();
  const cfg = useSettings();
  const now = useToday();
  const pos = now ? position(cfg.start, cfg.slide, cfg.buffers, now) : null;
  const all = slots(cfg.buffers);

  const Cell = ({ track, n }: { track: Track; n: number }) => {
    const w = WEEKS[track][n - 1];
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
  const newGroup = new Map<number, { main: boolean; java: boolean }>();
  {
    let lm = "";
    let lj = "";
    for (let n = 1; n <= 36; n++) {
      const gm = groupOf("main", n)!.id;
      const gj = groupOf("java", n)!.id;
      newGroup.set(n, { main: gm !== lm, java: gj !== lj });
      lm = gm;
      lj = gj;
    }
  }
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">The 36-week map</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-muted">
          Two tracks in parallel: Main on Mon, Wed, Fri and Sat; Java + DSA on Tue, Thu and Sun. Find the current week, open its tab, tick today&apos;s box.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {(["main", "java"] as Track[]).map((t) => (
          <div key={t} className="card p-4">
            <div className={`mb-2 text-xs font-semibold uppercase tracking-wider ${t === "main" ? "text-main" : "text-java"}`}>{t === "main" ? "Main track phases" : "Java + DSA parts"}</div>
            <ul className="space-y-2">
              {GROUPS[t].map((g) => (
                <li key={g.id} className="text-sm">
                  <span className="font-semibold">{g.id}</span> <span className="text-muted">(W{g.weeks[0]}-{g.weeks[g.weeks.length - 1]})</span> {g.title.replace(/\s*\(Weeks.*\)$/, "")}
                  {PHASE_SUMMARY[g.id] && <div className="text-xs text-muted">Unlocks: {PHASE_SUMMARY[g.id].unlocks}</div>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <div className="card overflow-hidden">
        <div className="hidden grid-cols-[88px_1fr_1fr] gap-3 border-b border-line bg-panel-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted sm:grid">
          <div>Week</div>
          <div>Main track</div>
          <div>Java + DSA</div>
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
          const gm = groupOf("main", n)!;
          const gj = groupOf("java", n)!;
          const ng = newGroup.get(n)!;
          const header =
            ng.main || ng.java ? (
              <div className="grid grid-cols-1 gap-3 border-b border-line bg-panel-2/60 px-4 py-1.5 text-xs font-semibold text-muted sm:grid-cols-[88px_1fr_1fr]">
                <div className="hidden sm:block" />
                <div className="text-main">{ng.main ? `${gm.id}: ${gm.title.replace(/\s*\(Weeks.*\)$/, "")}` : ""}</div>
                <div className="text-java">{ng.java ? `${gj.id}: ${gj.title.replace(/\s*\(Weeks.*\)$/, "")}` : ""}</div>
              </div>
            ) : null;
          return (
            <Fragment key={n}>
              {header}
              <div id={`w${n}`} className={`grid grid-cols-1 gap-1 border-b border-line px-2 py-2 sm:grid-cols-[88px_1fr_1fr] sm:gap-3 sm:px-4 ${current ? "bg-accent-soft" : ""}`}>
                <div className="px-2 pt-2 text-sm">
                  <span className="font-semibold">W{n}</span>
                  {h && <span className="ml-2 text-xs text-muted sm:ml-0 sm:block">{fmtShort(weekStartFor(n, cfg.start, cfg.slide, cfg.buffers))}</span>}
                  {current && <span className="ml-2 text-xs font-semibold text-accent sm:ml-0 sm:block">Now</span>}
                </div>
                <Cell track="main" n={n} />
                <Cell track="java" n={n} />
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
