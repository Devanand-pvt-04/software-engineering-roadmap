"use client";

import { useState } from "react";
import { useContent } from "@/lib/content";
import { getState, setEntries, setEntry, useSettings, useToday } from "@/lib/store";
import { baselinePlan, planLength } from "@/lib/sessions";
import { addDays, dayKey, fmt, mondayOf, parseDate, startForWeek } from "@/lib/schedule";

/** Lets the person choose when their plan starts: a date, next Monday, or "I've already done N weeks". */
export function StartPicker({ compact = false, onDone }: { compact?: boolean; onDone?: () => void }) {
  const today = useToday();
  const cfg = useSettings();
  const c = useContent();
  const [week, setWeek] = useState(1);
  const [msg, setMsg] = useState("");
  const len = planLength(c);
  if (!today) return null;
  const todayKey = dayKey(today);
  const nextMon = dayKey(addDays(parseDate(mondayOf(today)), 7));
  const save = (iso: string) => {
    setEntry("cfg:start", iso);
    onDone?.();
  };
  /** Start far enough back that this is week N, and mark every session before week N as done on the day it was planned. */
  const already = () => {
    const start = startForWeek(today, week);
    setEntry("cfg:start", start);
    const s = getState();
    const marks = baselinePlan(c, s, start)
      .filter((p) => p.n < week && !s.entries[p.key]?.v)
      .map((p) => ({ key: p.key, v: true, t: parseDate(p.date).getTime() + 12 * 3_600_000 }));
    setEntries(marks);
    setMsg(week > 1 ? `Marked ${marks.length} sessions from weeks 1–${week - 1} as done.` : "");
    onDone?.();
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button className={`btn ${cfg.start === todayKey ? "btn-primary" : ""}`} onClick={() => save(todayKey)}>
          Today ({fmt(today)})
        </button>
        <button className={`btn ${cfg.start === nextMon ? "btn-primary" : ""}`} onClick={() => save(nextMon)}>
          Next Monday ({fmt(parseDate(nextMon))})
        </button>
      </div>
      <div className={`grid gap-4 ${compact ? "" : "sm:grid-cols-2"}`}>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Pick a date</span>
          <input type="date" className="input" value={cfg.start} onChange={(e) => e.target.value && save(e.target.value)} />
        </label>
        <div>
          <span className="mb-1 block text-sm font-medium">Already started? I&apos;m on week…</span>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              max={len}
              className="input w-24"
              value={week}
              onChange={(e) => setWeek(Math.min(len, Math.max(1, Number(e.target.value) || 1)))}
              aria-label="Current week number"
            />
            <button className="btn" onClick={already}>
              Set
            </button>
          </div>
          <span className="mt-1 block text-xs text-muted">{msg || `Sets the start date so this is week ${week}, and ticks the sessions of the weeks before it.`}</span>
        </div>
      </div>
    </div>
  );
}
