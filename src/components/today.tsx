"use client";

import Link from "next/link";
import { getWeek, keys, type Track } from "@/lib/roadmap";
import { problemStats, streak, trackProgress, weekProgress } from "@/lib/progress";
import { setEntry, useSettings, useStore, useToday } from "@/lib/store";
import { addDays, endDate, fmt, fmtShort, position, weekday } from "@/lib/schedule";
import { ENCOURAGEMENT, SCHEDULE } from "@/data/guide";
import { Bar, CheckRow, Ring, SectionTitle, TrackTag } from "./ui";
import { FocusTimer } from "./focus-timer";
import { ProblemRow } from "./problem-row";

const TRACK_FOR_DAY: Record<string, Track> = { Mon: "main", Tue: "java", Wed: "main", Thu: "java", Fri: "main", Sat: "main", Sun: "java" };

export function TodayView() {
  const today = useToday();
  const s = useStore();
  const cfg = useSettings();
  if (!today) return <div className="h-96" />;

  const now = today;
  const pos = position(cfg.start, cfg.slide, cfg.buffers, now);
  const day = weekday(now);
  const sched = SCHEDULE.find((x) => x.day === day)!;
  const track = TRACK_FOR_DAY[day];
  const n = pos.slot?.kind === "week" ? pos.slot.n : pos.slot?.kind === "buffer" ? pos.slot.after : 1;
  const isBuffer = pos.status === "active" && pos.slot?.kind === "buffer";
  const week = getWeek(track, n)!;
  const todayItem = week.checklist.find((c) => c.day === day);
  const main = trackProgress(s, "main");
  const java = trackProgress(s, "java");
  const ps = problemStats(s, now);
  const st = streak(s, now);
  const prevN = n - 1;
  const prevUnpassed =
    prevN >= 1 && !isBuffer && (["main", "java"] as Track[]).filter((t) => !weekProgress(s, t, getWeek(t, prevN)!).passed);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted">{now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          {pos.status === "before"
            ? `Week 1 starts in ${pos.daysUntilStart} day${pos.daysUntilStart === 1 ? "" : "s"}`
            : pos.status === "after"
              ? "You finished the 36 weeks"
              : isBuffer
                ? `Buffer week after week ${n}`
                : `Week ${n} of 36 · ${sched.track} day`}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Plan runs {fmt(new Date(cfg.start + "T00:00:00"))} → {fmt(endDate(cfg.start, cfg.slide, cfg.buffers))}
          {cfg.slide > 0 && ` (slid ${cfg.slide} week${cfg.slide > 1 ? "s" : ""})`}.{" "}
          <Link href="/settings" className="underline hover:text-fg">
            Change
          </Link>
        </p>
      </header>

      {pos.status === "before" && (
        <section className="card p-5">
          <SectionTitle>Before week 1</SectionTitle>
          <p className="text-[15px]">
            Do the setup checklist first, then read how the plan works.{" "}
            <Link href="/guide#setup" className="font-medium text-accent">
              Open setup →
            </Link>
          </p>
        </section>
      )}

      {isBuffer && (
        <section className="card p-5">
          <SectionTitle>Buffer week</SectionTitle>
          <p className="text-[15px] leading-relaxed">
            Optional catch-up or review. Behind? Finish week {n}&apos;s Done-when tests. On schedule? Revisit the Overlooked lists from the last six weeks.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link className="btn" href={`/main/${n}`}>
              Main week {n}
            </Link>
            <Link className="btn" href={`/java/${n}`}>
              Java week {n}
            </Link>
          </div>
        </section>
      )}

      {pos.status === "active" && !isBuffer && (
        <section className={`card border-l-4 p-5 ${track === "main" ? "border-l-main" : "border-l-java"}`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <TrackTag track={track} n={n} />
              <span className="text-xs text-muted">
                {sched.time} · {week.title}
              </span>
            </div>
            <Link href={`/${track}/${n}`} className="text-sm text-muted hover:text-fg">
              Open week →
            </Link>
          </div>
          <h2 className="mb-1 text-lg font-semibold">Today&apos;s box</h2>
          {todayItem ? (
            <CheckRow k={keys.day(track, n, day)} color={track} links="">
              {todayItem.text}
            </CheckRow>
          ) : (
            <p className="text-muted">{sched.what}</p>
          )}
          {day === "Sun" && (
            <div className="mt-4 border-t border-line pt-4">
              <h3 className="mb-1 text-sm font-semibold">Then 1 h review: Done-when tests for both tracks</h3>
              {(["main", "java"] as Track[]).map((t) => {
                const w = getWeek(t, n)!;
                return (
                  <CheckRow key={t} k={keys.done(t, n)} color="ok">
                    <span className="mr-1 font-medium">{t === "main" ? "Main" : "Java"}:</span>
                    {"you can " + w.doneWhen.replace(/^you can /i, "")}
                  </CheckRow>
                );
              })}
            </div>
          )}
        </section>
      )}

      {prevUnpassed && prevUnpassed.length > 0 && pos.status === "active" && (
        <section className="card border-warn bg-warn-soft p-5">
          <SectionTitle>Slide, don&apos;t skip</SectionTitle>
          <p className="text-[15px] leading-relaxed">
            Week {prevN}&apos;s Done-when test isn&apos;t ticked on {prevUnpassed.map((t) => (t === "main" ? "Main" : "Java")).join(" and ")}. If you passed it, tick it. If not, finish it
            first or slide the whole calendar by a week. Never cram.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {prevUnpassed.map((t) => (
              <Link key={t} className="btn" href={`/${t}/${prevN}`}>
                Open {t === "main" ? "Main" : "Java"} week {prevN}
              </Link>
            ))}
            <button className="btn" onClick={() => setEntry("cfg:slide", cfg.slide + 1)}>
              Slide calendar 1 week
            </button>
          </div>
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Main track" value={`${Math.round(main.ratio * 100)}%`} sub={`${main.weeksPassed}/36 weeks passed`}>
          <Bar value={main.ratio} track="main" className="mt-2" />
        </Stat>
        <Stat label="Java + DSA" value={`${Math.round(java.ratio * 100)}%`} sub={`${java.weeksPassed}/36 weeks passed`}>
          <Bar value={java.ratio} track="java" className="mt-2" />
        </Stat>
        <Stat label="Problems" value={`${ps.attempted}`} sub={`of ${ps.total} listed · goal 180-200`}>
          <Bar value={ps.attempted / ps.total} track="ok" className="mt-2" />
        </Stat>
        <Stat label="Streak" value={`${st} day${st === 1 ? "" : "s"}`} sub="Zero weeks are the only thing to avoid" />
      </section>

      {pos.status === "active" && (
        <section className="card p-5">
          <SectionTitle hint={`${fmtShort(pos.weekStart)} – ${fmtShort(addDays(pos.weekStart, 6))}`}>This week</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["main", "java"] as Track[]).map((t) => {
              const w = getWeek(t, n)!;
              const p = weekProgress(s, t, w);
              return (
                <Link key={t} href={`/${t}/${n}`} className="flex items-center gap-4 rounded-xl border border-line p-4 hover:border-muted">
                  <Ring value={p.ratio} track={t} size={56} />
                  <div className="min-w-0">
                    <TrackTag track={t} n={n} link={false} />
                    <div className="mt-1 truncate font-medium">{w.title}</div>
                    <div className="mt-1 flex gap-1">
                      {w.checklist.map((c) => (
                        <span
                          key={c.day}
                          title={c.day}
                          className={`grid size-6 place-items-center rounded text-[10px] font-semibold ${s.entries[keys.day(t, n, c.day)]?.v ? (t === "main" ? "bg-main text-white" : "bg-java text-white") : c.day === day ? "border border-accent text-accent" : "bg-panel-2 text-muted"}`}
                        >
                          {c.day.slice(0, 2)}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {ps.due.length > 0 && (
        <section className="card p-5">
          <SectionTitle hint="Practice rule 6">Re-solves due</SectionTitle>
          {ps.due.map((d) => (
            <ProblemRow key={d.slug} slug={d.slug} name={d.name} week={d.week} showWeek />
          ))}
        </section>
      )}

      <section className="card p-5">
        <SectionTitle hint="The template for every session">Session timer</SectionTitle>
        <FocusTimer />
      </section>

      <p className="text-sm italic leading-relaxed text-muted">{ENCOURAGEMENT}</p>
    </div>
  );
}

function Stat({ label, value, sub, children }: { label: string; value: string; sub: string; children?: React.ReactNode }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {children}
      <div className="mt-2 text-[11px] leading-snug text-muted">{sub}</div>
    </div>
  );
}
