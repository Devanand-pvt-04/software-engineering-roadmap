"use client";

import Link from "next/link";
import { useState } from "react";
import { makePlan, missedSessions, lastActive, type CatchUpPlan } from "@/lib/catchup";
import { useContent } from "@/lib/content";
import { TRACK_LABEL } from "@/lib/roadmap";
import { dayKey, fmtShort, parseDate } from "@/lib/schedule";
import { setEntry, useSettings, useStore, useValue } from "@/lib/store";
import { CheckRow, SectionTitle } from "./ui";

const short = (t: string) => (t.length > 90 ? t.slice(0, 88) + "…" : t);

/** Today-page card: notices slipped sessions and offers to spread them out or slide the calendar. */
export function CatchUp({ now, n }: { now: Date; n: number }) {
  const s = useStore();
  const c = useContent();
  const cfg = useSettings();
  const [plan, setPlan] = useValue<CatchUpPlan | null>("cfg:catchup", null);
  const [showAll, setShowAll] = useState(false);
  const today = dayKey(now);

  // A welcome back after two weeks or more away.
  const last = lastActive(s);
  const awayDays = last ? Math.floor((now.getTime() - last.getTime()) / 86_400_000) : 0;
  if (last && awayDays >= 14) {
    const weeksAway = Math.floor(awayDays / 7);
    const resumeAt = Math.max(1, n - weeksAway);
    return (
      <section className="card border-accent bg-accent-soft p-5">
        <SectionTitle>Welcome back</SectionTitle>
        <p className="text-[15px] leading-relaxed">
          It&apos;s been {awayDays} days since you last ticked anything. Don&apos;t start where the calendar says. Spend one session redoing the last Done-when test you
          passed, then continue. Sliding the calendar by {weeksAway} week{weeksAway > 1 ? "s" : ""} puts you back on week {resumeAt}.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={() => setEntry("cfg:slide", cfg.slide + weeksAway)}>
            Resume at week {resumeAt}
          </button>
          {c.tracks.map((t) => (
            <Link key={t} className="btn" href={`/${t}/${resumeAt}`}>
              {TRACK_LABEL[t]} week {resumeAt}
            </Link>
          ))}
        </div>
      </section>
    );
  }

  // An active plan: show what's due, and drop items as they get ticked.
  if (plan) {
    const open = plan.items.filter((i) => !s.entries[i.key]?.v);
    if (!open.length) {
      return (
        <section className="card border-ok bg-ok-soft p-5">
          <SectionTitle>Caught up</SectionTitle>
          <p className="text-[15px]">Every missed session from your catch-up plan is ticked.</p>
          <button className="btn mt-3" onClick={() => setPlan(null)}>
            Clear the plan
          </button>
        </section>
      );
    }
    const due = open.filter((i) => i.on <= today);
    const later = open.filter((i) => i.on > today);
    return (
      <section className="card border-warn p-5">
        <SectionTitle hint={`${open.length} left`}>Catch-up plan</SectionTitle>
        {due.length > 0 ? (
          <>
            <p className="mb-1 text-sm text-muted">{due.length > 1 ? "Due now, oldest first:" : "Today's catch-up:"}</p>
            {due.map((i) => (
              <CheckRow key={i.key} k={i.key} color={i.track}>
                <span className="mr-1 text-xs font-semibold text-muted">
                  {TRACK_LABEL[i.track]} W{i.n} {i.label}:
                </span>
                {i.text}
              </CheckRow>
            ))}
          </>
        ) : (
          <p className="text-sm text-muted">Nothing due today. Next one is on {fmtShort(parseDate(later[0].on))}.</p>
        )}
        {later.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {(showAll ? later : later.slice(0, 3)).map((i) => (
              <li key={i.key}>
                {fmtShort(parseDate(i.on))}: {TRACK_LABEL[i.track]} W{i.n} {i.label}, {short(i.text)}
              </li>
            ))}
            {later.length > 3 && !showAll && (
              <li>
                <button className="underline hover:text-fg" onClick={() => setShowAll(true)}>
                  {later.length - 3} more
                </button>
              </li>
            )}
          </ul>
        )}
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <button className="text-muted underline hover:text-fg" onClick={() => setPlan(null)}>
            Drop the plan
          </button>
        </div>
      </section>
    );
  }

  const missed = missedSessions(s, c, cfg, now, n);
  if (!missed.length) return null;
  const tooMany = missed.length > (c.tracks.length > 1 ? 4 : 5);
  const lastWeekOpen = missed.some((m) => m.n < n);
  const preview = makePlan(missed, c, now);
  const finish = preview.items.length ? preview.items[preview.items.length - 1].on : today;

  return (
    <section className="card border-warn bg-warn-soft p-5">
      <SectionTitle hint="Slide, don't skip">
        {missed.length} session{missed.length > 1 ? "s" : ""} behind
      </SectionTitle>
      <ul className="space-y-1 text-[15px]">
        {(showAll ? missed : missed.slice(0, 4)).map((m) => (
          <li key={m.key} className="flex gap-2">
            <span className="w-28 shrink-0 text-xs font-semibold text-muted">
              {c.tracks.length > 1 ? (m.track === "main" ? "Main" : "Java") + " " : ""}W{m.n} {m.label}
            </span>
            <Link href={`/${m.track}/${m.n}`} className="min-w-0 hover:text-accent">
              {short(m.text)}
            </Link>
          </li>
        ))}
        {missed.length > 4 && !showAll && (
          <li>
            <button className="text-sm underline" onClick={() => setShowAll(true)}>
              Show all {missed.length}
            </button>
          </li>
        )}
      </ul>
      <p className="mt-3 text-sm leading-relaxed">
        {tooMany
          ? "That's more than a week can absorb without cramming. Sliding the calendar a week is the better move."
          : `You can spread ${missed.length > 1 ? "them" : "it"} out, one a day${c.tracks.length === 1 ? ", free days first" : ""}, and be caught up by ${fmtShort(parseDate(finish))}. Or slide the calendar a week.`}
        {lastWeekOpen && " If you passed last week's Done-when test, just tick it."}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {!tooMany && (
          <button className="btn btn-primary" onClick={() => setPlan(makePlan(missed, c, now))}>
            {missed.length > 1 ? "Spread them out" : "Fit it in"}
          </button>
        )}
        <button className={`btn ${tooMany ? "btn-primary" : ""}`} onClick={() => setEntry("cfg:slide", cfg.slide + 1)}>
          Slide calendar 1 week
        </button>
      </div>
    </section>
  );
}

