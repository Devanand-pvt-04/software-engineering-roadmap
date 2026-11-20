// LeetCode weekly contest timing and the contest log (ct:<yyyy-mm-dd> entries). Client-safe.
import type { State } from "./merge";
import type { ContestInfo } from "./roadmap";
import { dayKey } from "./schedule";

export interface ContestRec {
  solved: number; // 0-4
  note?: string;
}

/** The weekly contest that starts at or after `from` (as a real instant; show it in local time). */
export function nextContest(info: ContestInfo, from: Date): Date {
  const { day, hour, minute } = info.weeklyUtc;
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), hour, minute));
  const ahead = (day - d.getUTCDay() + 7) % 7;
  d.setUTCDate(d.getUTCDate() + ahead);
  if (d.getTime() < from.getTime()) d.setUTCDate(d.getUTCDate() + 7);
  return d;
}

/** The most recent contest that has started (it lasts 90 minutes). */
export function lastContest(info: ContestInfo, now: Date): Date {
  const n = nextContest(info, now);
  return new Date(n.getTime() - 7 * 86400000);
}

/** Log key for a contest: the local date it started on. */
export const contestDay = (d: Date) => dayKey(d);

export function contestLog(s: State): { date: string; rec: ContestRec }[] {
  const out: { date: string; rec: ContestRec }[] = [];
  for (const [k, e] of Object.entries(s.entries)) {
    if (!k.startsWith("ct:") || !e.v) continue;
    out.push({ date: k.slice(3), rec: e.v as ContestRec });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

/** What Today should say about contests, or null. Shows from 24 h before a contest until 36 h after it. */
export function contestNudge(info: ContestInfo, s: State, now: Date): { at: Date; live: boolean; logged: boolean; upcoming: boolean } | null {
  const next = nextContest(info, now);
  const last = lastContest(info, now);
  const H = 3600000;
  if (next.getTime() - now.getTime() <= 24 * H) return { at: next, live: false, logged: false, upcoming: true };
  const since = now.getTime() - last.getTime();
  if (since <= 36 * H) {
    const logged = !!s.entries[`ct:${contestDay(last)}`]?.v;
    return { at: last, live: since < 1.5 * H, logged, upcoming: false };
  }
  return null;
}

export const fmtContest = (d: Date) =>
  d.toLocaleString(undefined, { weekday: "long", hour: "numeric", minute: "2-digit" });
