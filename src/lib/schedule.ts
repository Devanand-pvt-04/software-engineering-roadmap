import { BUFFER_AFTER, type Day } from "./constants";

export type Slot = { kind: "week"; n: number } | { kind: "buffer"; after: number };

const MS_DAY = 86_400_000;

export function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
/** yyyy-mm-dd of the Monday of the week containing d. */
export function mondayOf(d: Date): string {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return dayKey(x);
}
/** Start Monday such that `d` falls in plan week `n` (ignores slide/buffers). */
export function startForWeek(d: Date, n: number): string {
  return dayKey(addDays(parseDate(mondayOf(d)), -(n - 1) * 7));
}
export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
export function weekday(d: Date): Day {
  return (["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as Day[])[d.getDay()];
}

export function slots(includeBuffers: boolean): Slot[] {
  const out: Slot[] = [];
  for (let n = 1; n <= 36; n++) {
    out.push({ kind: "week", n });
    if (includeBuffers && BUFFER_AFTER.includes(n)) out.push({ kind: "buffer", after: n });
  }
  return out;
}

export interface Position {
  status: "before" | "active" | "after";
  slot?: Slot;
  index: number; // slot index (0-based), clamped
  daysUntilStart: number;
  weekStart: Date; // Monday of the current slot
}

/** Where today falls in the plan, given a start Monday, how many weeks the calendar has slid, and buffer setting. */
export function position(start: string, slide: number, includeBuffers: boolean, today = new Date()): Position {
  const s = parseDate(start);
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((t.getTime() - s.getTime()) / MS_DAY);
  const all = slots(includeBuffers);
  const idx = Math.floor(days / 7) - slide;
  if (days < 0) return { status: "before", index: 0, daysUntilStart: -days, slot: all[0], weekStart: s };
  if (idx < 0) return { status: "active", index: 0, slot: all[0], daysUntilStart: 0, weekStart: addDays(s, slide * 7) };
  if (idx >= all.length) return { status: "after", index: all.length - 1, daysUntilStart: 0, weekStart: t };
  return { status: "active", index: idx, slot: all[idx], daysUntilStart: 0, weekStart: addDays(s, (idx + slide) * 7) };
}

/** Calendar Monday for a given plan week. */
export function weekStartFor(n: number, start: string, slide: number, includeBuffers: boolean): Date {
  const all = slots(includeBuffers);
  const idx = all.findIndex((x) => x.kind === "week" && x.n === n);
  return addDays(parseDate(start), (idx + slide) * 7);
}

export function endDate(start: string, slide: number, includeBuffers: boolean): Date {
  return addDays(parseDate(start), (slots(includeBuffers).length + slide) * 7 - 1);
}

export const fmt = (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
export const fmtShort = (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
