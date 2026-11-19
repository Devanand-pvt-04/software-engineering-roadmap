// Catch-up planning: find sessions that slipped, and spread them over coming days without cramming.
import type { ClientContent } from "./content";
import type { State } from "./merge";
import { keys, type Track } from "./roadmap";
import { addDays, dayKey, parseDate, weekStartFor } from "./schedule";
import type { Settings } from "./store";

const OFFSET: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
const TRACK_FOR_DAY: Record<string, Track> = { Mon: "main", Tue: "java", Wed: "main", Thu: "java", Fri: "main", Sat: "main", Sun: "java" };

export interface Missed {
  key: string;
  track: Track;
  n: number;
  label: string; // "Tue" or "Done when"
  text: string;
  date: string; // when it was scheduled
}
export interface CatchUpPlan {
  made: string;
  items: (Missed & { on: string })[];
}

const ticked = (s: State, k: string) => !!s.entries[k]?.v;

/** Unticked sessions from earlier this week and all of last week, plus last week's unpassed Done-when tests. */
export function missedSessions(s: State, c: ClientContent, cfg: Settings, now: Date, n: number): Missed[] {
  const today = dayKey(now);
  const out: Missed[] = [];
  for (const week of [n - 1, n]) {
    if (week < 1) continue;
    const start = weekStartFor(week, cfg.start, cfg.slide, cfg.buffers);
    for (const t of c.tracks) {
      const w = c.weeks[t]?.[week - 1];
      if (!w) continue;
      for (const d of w.checklist) {
        const date = dayKey(addDays(start, OFFSET[d.day]));
        const k = keys.day(t, week, d.day);
        if (date < today && !ticked(s, k)) out.push({ key: k, track: t, n: week, label: d.day, text: d.text, date });
      }
      if (week === n - 1 && w.doneWhen && !ticked(s, keys.done(t, week)))
        out.push({ key: keys.done(t, week), track: t, n: week, label: "Done when", text: "You can " + w.doneWhen.replace(/^you can /i, ""), date: dayKey(addDays(start, 6)) });
    }
  }
  return out;
}

/**
 * One catch-up item per day, starting tomorrow. People on one track get their free days first,
 * so a catch-up never stacks onto a day that already has a session if there's a free one.
 */
export function makePlan(missed: Missed[], c: ClientContent, now: Date): CatchUpPlan {
  const days: string[] = [];
  const free: string[] = [];
  for (let i = 1; i <= 14 && days.length + free.length < 28; i++) {
    const d = addDays(now, i);
    const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
    (c.tracks.includes(TRACK_FOR_DAY[wd]) ? days : free).push(dayKey(d));
  }
  const slots = [...free.slice(0, missed.length), ...days].slice(0, missed.length).sort();
  // Oldest first, Done-when tests last within their week.
  const order = [...missed].sort((a, b) => a.date.localeCompare(b.date));
  return { made: dayKey(now), items: order.map((m, i) => ({ ...m, on: slots[i] })) };
}

/** Last day anything was ticked or written, if any. */
export function lastActive(s: State): Date | null {
  let t = 0;
  for (const [k, e] of Object.entries(s.entries)) if (!k.startsWith("cfg:") && e.v && e.t > t) t = e.t;
  return t ? new Date(t) : null;
}

export const fromKey = (d: string) => parseDate(d);
