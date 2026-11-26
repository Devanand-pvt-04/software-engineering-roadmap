"use client";

import Link from "next/link";
import { useContent, type ClientContent } from "@/lib/content";
import { TRACK_LABEL, type Group, type Track } from "@/lib/roadmap";
import { currentWeek, planLength, type Plan } from "@/lib/sessions";
import { fmtShort, parseDate } from "@/lib/schedule";
import { SectionTitle } from "./ui";

export interface PhaseInfo {
  g: Group;
  index: number;
  status: "done" | "current" | "next";
  done: number;
  total: number;
  from: string | null;
  to: string | null;
}

/** Each phase (Main) or part (Java) of a track, with progress and its dates from the live plan. */
export function phasesOf(c: ClientContent, plan: Plan, track: Track): { phases: PhaseInfo[]; week: number; finished: boolean } {
  const finished = !plan.planned.some((p) => p.track === track);
  const week = currentWeek(plan, track);
  const planned = new Map(plan.planned.map((p) => [p.key, p.date]));
  const phases = (c.groups[track] ?? []).map((g, index): PhaseInfo => {
    const xs = plan.sessions.filter((x) => x.track === track && g.weeks.includes(x.n));
    const dates = xs.map((x) => plan.doneOn.get(x.key) ?? planned.get(x.key)).filter(Boolean).sort() as string[];
    const done = xs.filter((x) => plan.doneKeys.has(x.key)).length;
    const last = g.weeks[g.weeks.length - 1];
    const status = finished || week > last ? "done" : g.weeks.includes(week) ? "current" : "next";
    return { g, index, status, done, total: xs.length, from: dates[0] ?? null, to: dates[dates.length - 1] ?? null };
  });
  return { phases, week, finished };
}

const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
const color = (t: Track) => (t === "main" ? "bg-main" : "bg-java");
const text = (t: Track) => (t === "main" ? "text-main" : "text-java");
const unit = (t: Track) => (t === "main" ? "Phase" : "Part");

/** A strip of the track's phases, sized by weeks and filled by progress, with the current week marked. */
function PhaseStrip({ track, phases, week }: { track: Track; phases: PhaseInfo[]; week: number }) {
  return (
    <div className="flex gap-1" aria-hidden>
      {phases.map((p) => {
        const pos = p.status === "current" ? (p.g.weeks.indexOf(week) + 0.5) / p.g.weeks.length : null;
        return (
          <div key={p.g.id} className="relative h-2.5 overflow-hidden rounded-full bg-panel-2" style={{ flexGrow: p.g.weeks.length, flexBasis: 0 }} title={`${p.g.id}: ${p.g.title}`}>
            <div className={`h-full ${color(track)} ${p.status === "current" ? "" : "opacity-80"}`} style={{ width: `${p.total ? (p.done / p.total) * 100 : 0}%` }} />
            {pos !== null && <div className="absolute inset-y-0 w-0.5 bg-fg" style={{ left: `${pos * 100}%` }} />}
          </div>
        );
      })}
    </div>
  );
}

/** Today-page card: where you are on each track, why this part comes now, and what it leads to. */
export function YouAreHere({ plan }: { plan: Plan }) {
  const c = useContent();
  return (
    <section className="card p-5">
      <SectionTitle hint={<Link href="/plan" className="hover:text-fg">The big picture →</Link>}>You are here</SectionTitle>
      <div className="grid gap-5 sm:grid-cols-2 sm:gap-8">
        {c.tracks.map((t) => {
          const { phases, week, finished } = phasesOf(c, plan, t);
          const cur = phases.find((p) => p.status === "current");
          const next = cur ? phases[cur.index + 1] : undefined;
          const w = c.weeks[t]?.[week - 1];
          return (
            <div key={t} className="min-w-0">
              <div className={`mb-1 text-xs font-semibold uppercase tracking-wider ${text(t)}`}>{TRACK_LABEL[t]}</div>
              <PhaseStrip track={t} phases={phases} week={week} />
              {finished || !cur ? (
                <p className="mt-2 text-[15px] font-medium">Track finished. Every phase done.</p>
              ) : (
                <>
                  <p className="mt-2 text-[15px] font-medium leading-snug">
                    <Link href={`/${t}/${week}`} className="hover:underline">
                      {w ? w.title : `Week ${week}`}
                    </Link>
                  </p>
                  <p className="mt-0.5 text-[13px] text-muted">
                    Week {week} of {c.weeks[t]?.length ?? planLength(c)} · {cur.g.id} of {phases.length}: {cur.g.title}
                  </p>
                  <details className="group mt-2 text-sm">
                    <summary className="cursor-pointer list-none text-[13px] font-medium text-muted hover:text-fg [&::-webkit-details-marker]:hidden">
                      <span className="inline-block transition-transform group-open:rotate-90">›</span> Why this, now
                    </summary>
                    {cur.g.goal && <p className="mt-1.5 leading-relaxed">By the end of this {unit(t).toLowerCase()}, {cur.g.goal.replace(/\.$/, "")}.</p>}
                    {next && (
                      <p className="mt-1 leading-relaxed text-muted">
                        <span className="font-semibold">Then {next.g.id}:</span> {next.g.title}
                        {c.phaseSummary[next.g.id] ? `. Unlocks: ${c.phaseSummary[next.g.id].unlocks}.` : "."}
                      </p>
                    )}
                  </details>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** The full timeline of one track: every phase, why it sits where it does, and when you'll get there. */
export function TrackTimeline({ track, plan }: { track: Track; plan: Plan }) {
  const c = useContent();
  const { phases, week } = phasesOf(c, plan, track);
  return (
    <section className="card p-5">
      <div className={`mb-1 text-xs font-semibold uppercase tracking-wider ${text(track)}`}>{TRACK_LABEL[track]}</div>
      <p className="mb-4 text-sm leading-relaxed text-muted">{c.intros[track]}</p>
      <PhaseStrip track={track} phases={phases} week={week} />
      <ol className="mt-5 space-y-0">
        {phases.map((p, i) => {
          const sum = c.phaseSummary[p.g.id];
          const current = p.status === "current";
          return (
            <li key={p.g.id} className="relative flex gap-4 pb-4 last:pb-0">
              {i < phases.length - 1 && <span className="absolute left-[11px] top-7 bottom-0 w-px bg-line" aria-hidden />}
              <span
                className={`relative z-[1] mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                  p.status === "done" ? `${color(track)} text-white` : current ? `border-2 ${track === "main" ? "border-main" : "border-java"} bg-panel ${text(track)}` : "border border-line bg-panel text-muted"
                }`}
              >
                {p.status === "done" ? "✓" : i + 1}
              </span>
              <details open={current} className={`group min-w-0 flex-1 ${current ? "-mt-2 rounded-xl border border-line bg-panel-2/50 p-4" : ""}`}>
                <summary className="flex cursor-pointer list-none flex-wrap items-baseline justify-between gap-x-3 [&::-webkit-details-marker]:hidden">
                  <h3 className={`font-semibold ${p.status === "done" ? "text-muted" : ""}`}>
                    {p.g.id}: {p.g.title}
                  </h3>
                  <span className="text-xs text-muted">
                    {p.from && p.to ? `${fmtShort(parseDate(p.from))} – ${fmtShort(parseDate(p.to))}` : `Weeks ${p.g.weeks[0]}–${p.g.weeks[p.g.weeks.length - 1]}`}
                    {p.total > 0 && p.done > 0 && ` · ${Math.round((p.done / p.total) * 100)}%`}
                    <span className="ml-1.5 inline-block transition-transform group-open:rotate-90">›</span>
                  </span>
                </summary>
                {current && <div className={`mt-1 text-xs font-semibold ${text(track)}`}>You are here: week {week}</div>}
                <p className="mt-1 text-xs text-muted">
                  Weeks {p.g.weeks[0]}–{p.g.weeks[p.g.weeks.length - 1]}
                </p>
                {p.g.goal && (
                  <p className="mt-1.5 text-sm leading-relaxed">
                    <span className="font-semibold">By the end: </span>
                    {cap(p.g.goal)}
                  </p>
                )}
                {sum && (
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    <span className="font-semibold">Unlocks: </span>
                    {sum.unlocks}
                  </p>
                )}
                {(p.g.milestone || sum?.milestone) && (
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    <span className="font-semibold">Milestone: </span>
                    {cap(p.g.milestone || sum!.milestone)}
                  </p>
                )}
                {current && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.g.weeks.map((n) => {
                      const ws = plan.sessions.filter((x) => x.track === track && x.n === n);
                      const all = ws.every((x) => plan.doneKeys.has(x.key));
                      return (
                        <Link
                          key={n}
                          href={`/${track}/${n}`}
                          title={c.weeks[track]?.[n - 1]?.title}
                          className={`rounded-md px-2 py-1 text-xs font-semibold ${all ? `${color(track)} text-white` : n === week ? `border ${track === "main" ? "border-main" : "border-java"} ${text(track)}` : "bg-panel text-muted border border-line"}`}
                        >
                          W{n}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </details>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
