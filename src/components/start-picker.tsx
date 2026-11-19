"use client";

import { useState } from "react";
import { setEntry, useSettings, useToday } from "@/lib/store";
import { addDays, dayKey, fmt, mondayOf, parseDate, startForWeek } from "@/lib/schedule";

/** Lets the person choose when their 36 weeks start: a date, next Monday, or "I'm already on week N". */
export function StartPicker({ compact = false, onDone }: { compact?: boolean; onDone?: () => void }) {
  const today = useToday();
  const cfg = useSettings();
  const [week, setWeek] = useState(1);
  if (!today) return null;
  const thisMon = mondayOf(today);
  const nextMon = dayKey(addDays(parseDate(thisMon), 7));
  const save = (iso: string) => {
    setEntry("cfg:start", mondayOf(parseDate(iso)));
    setEntry("cfg:slide", 0);
    onDone?.();
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" onClick={() => save(thisMon)}>
          This week (Mon {fmt(parseDate(thisMon))})
        </button>
        <button className="btn" onClick={() => save(nextMon)}>
          Next Monday ({fmt(parseDate(nextMon))})
        </button>
      </div>
      <div className={`grid gap-4 ${compact ? "" : "sm:grid-cols-2"}`}>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Pick a date</span>
          <input type="date" className="input" value={cfg.start} onChange={(e) => e.target.value && save(e.target.value)} />
          <span className="mt-1 block text-xs text-muted">Any date snaps to the Monday of its week.</span>
        </label>
        <div>
          <span className="mb-1 block text-sm font-medium">Already started? I&apos;m on week…</span>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              max={36}
              className="input w-24"
              value={week}
              onChange={(e) => setWeek(Math.min(36, Math.max(1, Number(e.target.value) || 1)))}
              aria-label="Current week number"
            />
            <button className="btn" onClick={() => save(startForWeek(today, week))}>
              Set
            </button>
          </div>
          <span className="mt-1 block text-xs text-muted">Works back to the right start date, so this week becomes week {week}.</span>
        </div>
      </div>
    </div>
  );
}
