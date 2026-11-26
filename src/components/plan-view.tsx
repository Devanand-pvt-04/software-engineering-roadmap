"use client";

import Link from "next/link";
import { useState } from "react";
import { TRACK_LABEL, type Track } from "@/lib/roadmap";
import { useContent } from "@/lib/content";
import { weekProgress } from "@/lib/progress";
import { useHydrated, useStore } from "@/lib/store";
import { usePlan } from "@/lib/use-plan";
import { dayKey, fmt, fmtShort, parseDate } from "@/lib/schedule";
import { Bar, Ring, SectionTitle } from "./ui";
import { TrackTimeline } from "./big-picture";
import { planLength } from "@/lib/sessions";
import { hoursLabel } from "./session-row";
import { Heatmap } from "./heatmap";

export function PlanView() {
  const c = useContent();
  const tracks = c.tracks;
  const s = useStore();
  const h = useHydrated();
  const live = usePlan();
  const [days, setDays] = useState(7);

  // First date of each plan week's sessions (done or planned), per track.
  const weekDate = new Map<string, string>();
  if (live) {
    const planned = new Map(live.plan.planned.map((p) => [p.key, p.date]));
    for (const x of live.plan.sessions) {
      const d = live.plan.doneOn.get(x.key) ?? planned.get(x.key);
      const k = `${x.track}${x.n}`;
      if (d && (!weekDate.has(k) || d < weekDate.get(k)!)) weekDate.set(k, d);
    }
  }

  const Cell = ({ track, n }: { track: Track; n: number }) => {
    const w = c.weeks[track]![n - 1];
    const p = weekProgress(s, track, w);
    const d = weekDate.get(`${track}${n}`);
    return (
      <Link href={`/${track}/${n}`} className="block rounded-lg p-2 hover:bg-panel-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[14px] leading-snug">{w.title}</span>
          {p.passed && <span className="shrink-0 text-xs font-semibold text-ok">✓</span>}
        </div>
        <Bar value={h ? p.ratio : 0} track={track} className="mt-1.5" />
        {h && d && <div className="mt-1 text-[11px] text-muted">from {fmtShort(parseDate(d))}</div>}
      </Link>
    );
  };

  const t = live ? dayKey(live.today) : "";
  const horizon = live ? dayKey(new Date(live.today.getFullYear(), live.today.getMonth(), live.today.getDate() + days)) : "";
  const soon = live ? live.plan.planned.filter((p) => p.date <= horizon) : [];
  const soonDays = [...new Set(soon.map((p) => p.date))];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">The big picture</h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">
            Two tracks that build bottom-up and run side by side. Tap a phase to see why it sits where it does.
          </p>
        </div>
        {live && (
          <div className="flex shrink-0 items-center gap-3">
            <Ring value={live.pace.total ? live.pace.done / live.pace.total : 0} size={64} />
            <div className="whitespace-nowrap text-xs leading-relaxed text-muted">
              {live.pace.done} of {live.pace.total} sessions
              <br />
              {live.plan.finish ? `Finish ${fmt(parseDate(live.plan.finish))}` : "All done"}
            </div>
          </div>
        )}
      </header>

      {live && tracks.map((tr) => <TrackTimeline key={tr} track={tr} plan={live.plan} />)}

      {live && soon.length > 0 && (
        <section id="upcoming" className="card scroll-mt-20 p-5">
          <SectionTitle
            hint={
              <span className="flex gap-1">
                {[7, 14, 28].map((d) => (
                  <button key={d} className={`chip !py-0.5 ${days === d ? "!border-accent !text-accent" : ""}`} onClick={() => setDays(d)}>
                    {d / 7} wk
                  </button>
                ))}
              </span>
            }
          >
            Your schedule
          </SectionTitle>
          <p className="mb-2 text-sm text-muted">
            Miss a day and it moves back; do one early and it moves up.{" "}
            <Link href="/settings#rhythm" className="underline hover:text-fg">
              Change your days
            </Link>
          </p>
          <div className="divide-y divide-line">
            {soonDays.map((d) => (
              <div key={d} className="grid gap-1 py-2 sm:grid-cols-[150px_1fr]">
                <div className={`text-sm font-semibold ${d === t ? "text-accent" : ""}`}>{d === t ? "Today" : parseDate(d).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</div>
                <div>
                  {(live.plan.byDate.get(d) ?? []).map((x) => (
                    <div key={x.key} className="text-[14px]">
                      <Link href={x.track === "review" ? `/main/${x.n}` : `/${x.track}/${x.n}`} className={`mr-2 text-xs font-semibold ${x.track === "main" ? "text-main" : x.track === "java" ? "text-java" : "text-ok"}`}>
                        {x.track === "main" ? "Main" : x.track === "java" ? "Java" : "Review"} W{x.n}
                      </Link>
                      {x.label} <span className="text-muted">· {hoursLabel(x.hours)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {live && <Heatmap now={live.today} />}

      <details className="group card overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 [&::-webkit-details-marker]:hidden">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">All {planLength(c)} weeks, week by week</span>
          <span className="text-xs text-muted">
            <span className="group-open:hidden">Show</span>
            <span className="hidden group-open:inline">Hide</span>
          </span>
        </summary>
        <div className="border-t border-line">
          <div className="hidden gap-3 border-b border-line bg-panel-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted sm:grid sm:grid-cols-[60px_1fr_1fr]">
            <div>Week</div>
            {tracks.map((tr) => (
              <div key={tr}>{TRACK_LABEL[tr]}</div>
            ))}
          </div>
          {Array.from({ length: planLength(c) }, (_, i) => i + 1).map((n) => (
            <div key={n} id={`w${n}`} className="grid grid-cols-1 gap-1 border-b border-line px-2 py-2 last:border-b-0 sm:grid-cols-[60px_1fr_1fr] sm:gap-3 sm:px-4">
              <div className="px-2 pt-2 text-sm font-semibold">W{n}</div>
              {tracks.map((tr) => (c.weeks[tr]?.[n - 1] ? <Cell key={tr} track={tr} n={n} /> : <div key={tr} />))}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
