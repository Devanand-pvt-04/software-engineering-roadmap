import type { Day } from "./constants";

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
/** Start Monday such that `d` falls in plan week `n` with a rhythm that does one plan week per calendar week. */
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

export const fmt = (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
export const fmtShort = (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
