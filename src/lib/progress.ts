import { keys, requiredKeys, type Problem, type Track, type Week } from "./roadmap";
import { entryDay } from "@/lib/day";
import type { State } from "./merge";
import { dayKey, addDays } from "./schedule";

export interface ProblemRec {
  status: "todo" | "solved" | "helped" | "stuck";
  firstAt?: string; // yyyy-mm-dd first attempt that counted
  reviews?: string[]; // dates of re-solves
  notes?: string;
}

export function weekProgress(s: State, track: Track, w: Pick<Week, "id" | "mustKnow" | "checklist" | "doneWhen" | "sessions">) {
  const req = requiredKeys(w);
  let done = 0;
  for (const k of req) if (s.entries[k]?.v) done++;
  const passed = !!s.entries[keys.done(w.id)]?.v;
  return { done, total: req.length, ratio: req.length ? done / req.length : 0, passed };
}

export function trackProgress(s: State, track: Track, weeks: Week[]) {
  let done = 0;
  let total = 0;
  let passed = 0;
  for (const w of weeks) {
    const p = weekProgress(s, track, w);
    done += p.done;
    total += p.total;
    if (p.passed) passed++;
  }
  return { done, total, ratio: total ? done / total : 0, weeksPassed: passed };
}

export function problemRec(s: State, slug: string): ProblemRec {
  return (s.entries[keys.problem(slug)]?.v as ProblemRec) || { status: "todo" };
}

/** Per practice rule 6: re-solve problems you needed help with 3 days later and again 2 weeks later. */
export function reviewDue(rec: ProblemRec): { due: string | null; stage: number } {
  if (rec.status !== "helped" || !rec.firstAt) return { due: null, stage: 0 };
  const done = rec.reviews?.length ?? 0;
  if (done >= 2) return { due: null, stage: 2 };
  const base = new Date(rec.firstAt + "T00:00:00");
  const due = dayKey(addDays(base, done === 0 ? 3 : 14));
  return { due, stage: done };
}

export interface CustomProblem {
  slug: string;
  name: string;
  week: number;
  note: string;
}
/** Extra problems you add yourself (e.g. from Striver's sheet), stored as cp:<slug>. */
export function customProblems(s: State): CustomProblem[] {
  const out: CustomProblem[] = [];
  for (const [k, e] of Object.entries(s.entries)) {
    if (!k.startsWith("cp:") || !e.v) continue;
    const v = e.v as { name: string; week?: number };
    out.push({ slug: k.slice(3), name: v.name, week: v.week ?? 0, note: "added by you" });
  }
  return out.sort((a, b) => a.week - b.week || a.name.localeCompare(b.name));
}

export function problemStats(s: State, now: Date | null, problems: (Problem & { week: number })[]) {
  let solved = 0, helped = 0, stuck = 0;
  const due: { slug: string; name: string; week: number; due: string }[] = [];
  const today = now ? dayKey(now) : "";
  const list = [...problems, ...customProblems(s)];
  for (const p of list) {
    const r = problemRec(s, p.slug);
    if (r.status === "solved") solved++;
    if (r.status === "helped") helped++;
    if (r.status === "stuck") stuck++;
    const d = reviewDue(r);
    if (today && d.due && d.due <= today) due.push({ slug: p.slug, name: p.name, week: p.week, due: d.due });
  }
  return { solved, helped, stuck, attempted: solved + helped, total: list.length, due };
}

/** Days (local) on which anything was ticked; derived from entry timestamps. */
export function activeDays(s: State): Set<string> {
  const out = new Set<string>();
  for (const [k, e] of Object.entries(s.entries)) {
    if (k.startsWith("cfg:")) continue;
    if (e.v) out.add(entryDay(e));
  }
  return out;
}

export function streak(s: State, now: Date | null): number {
  if (!now) return 0;
  const days = activeDays(s);
  let n = 0;
  let d = new Date(now);
  if (!days.has(dayKey(d))) d = addDays(d, -1); // today not yet done doesn't break the streak
  while (days.has(dayKey(d))) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}
