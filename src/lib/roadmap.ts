import data from "@/data/roadmap.json";
import type { Day } from "@/data/guide";

export type Track = "main" | "java";

export interface TopicNode {
  t: string;
  c: string[];
}
export interface Resource {
  text: string;
  core: boolean;
}
export interface Problem {
  slug: string;
  name: string;
  note: string;
}
export interface Week {
  n: number;
  title: string;
  why: string;
  mustKnow: TopicNode[];
  niche: string[];
  resources: Resource[];
  checklist: { day: Day; text: string }[];
  doneWhen: string;
  build: string;
  problems: Problem[];
  problemNote: string;
  after: string[];
  extra: string[];
}
export interface Group {
  id: string;
  title: string;
  goal: string;
  milestone: string;
  weeks: number[];
}

export const WEEKS: Record<Track, Week[]> = {
  main: data.main as Week[],
  java: data.java as Week[],
};
export const GROUPS: Record<Track, Group[]> = {
  main: data.mainGroups as Group[],
  java: data.javaGroups as Group[],
};

export const TRACK_LABEL: Record<Track, string> = { main: "Main track", java: "Java + DSA" };
export const TRACK_SHORT: Record<Track, string> = { main: "M", java: "J" };

export function getWeek(track: Track, n: number): Week | undefined {
  return WEEKS[track].find((w) => w.n === n);
}
export function groupOf(track: Track, n: number): Group | undefined {
  return GROUPS[track].find((g) => g.weeks.includes(n));
}

export const ALL_PROBLEMS = WEEKS.java.flatMap((w) => w.problems.map((p) => ({ ...p, week: w.n })));

// ---- Checkable keys ----
export const wk = (track: Track, n: number) => `${TRACK_SHORT[track]}${n}`;
export const keys = {
  must: (t: Track, n: number, i: number, j?: number) => `mk:${wk(t, n)}:${i}${j === undefined ? "" : "." + j}`,
  niche: (t: Track, n: number, i: number) => `ni:${wk(t, n)}:${i}`,
  res: (t: Track, n: number, i: number) => `rs:${wk(t, n)}:${i}`,
  day: (t: Track, n: number, d: string) => `cl:${wk(t, n)}:${d}`,
  done: (t: Track, n: number) => `dw:${wk(t, n)}`,
  build: (t: Track, n: number) => `bd:${wk(t, n)}`,
  note: (t: Track, n: number) => `nt:${wk(t, n)}`,
  problem: (slug: string) => `pr:${slug}`,
};

/** Keys that count toward a week's "required" progress (niche + resources are optional). */
export function requiredKeys(track: Track, w: Week): string[] {
  const out: string[] = [];
  w.mustKnow.forEach((m, i) => {
    if (m.c.length) m.c.forEach((_, j) => out.push(keys.must(track, w.n, i, j)));
    else out.push(keys.must(track, w.n, i));
  });
  w.checklist.forEach((c) => out.push(keys.day(track, w.n, c.day)));
  if (w.doneWhen) out.push(keys.done(track, w.n));
  return out;
}
