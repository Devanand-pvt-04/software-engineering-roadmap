// Types, labels and progress keys for the plan. Client-safe: no plan content here.
// The content itself is loaded on the server and filtered per person (src/server/content.ts).
import type { Day } from "./constants";

export type Track = "main" | "java";
export const TRACKS: Track[] = ["main", "java"];

export interface TopicNode {
  t: string;
  c: string[];
}
export interface LinkRef {
  label: string;
  url: string;
}
/** Exact chapters / sections for an item. */
export interface SpecView {
  detail: string;
  links?: LinkRef[];
}
export interface Resource {
  text: string;
  core: boolean;
  links: LinkRef[];
  specs: SpecView[];
  /** Rough time for a core resource. */
  time?: string;
  /** Free alternatives when the resource is a paid book. */
  free?: LinkRef[];
}
export interface QuizItem {
  q: string;
  a: string;
}
export interface Brief {
  done: string[];
  stretch?: string;
}
export interface HintLadder {
  pattern: string;
  hints: string[];
}
export interface DayItem {
  day: Day;
  text: string;
  links: LinkRef[];
  specs: SpecView[];
}
export interface Problem {
  slug: string;
  name: string;
  note: string;
  hint?: HintLadder;
}
export interface Week {
  n: number;
  title: string;
  why: string;
  mustKnow: TopicNode[];
  niche: string[];
  resources: Resource[];
  checklist: DayItem[];
  doneWhen: string;
  build: string;
  problems: Problem[];
  problemNote: string;
  after: { text: string; links: LinkRef[] }[];
  extra: string[];
  quiz: QuizItem[];
  brief?: Brief;
}
export interface Group {
  id: string;
  title: string;
  goal: string;
  milestone: string;
  weeks: number[];
}

export const TRACK_LABEL: Record<Track, string> = { main: "Main track", java: "Java + DSA" };
export const TRACK_SHORT: Record<Track, string> = { main: "M", java: "J" };

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
  quiz: (t: Track, n: number, i: number) => `qz:${wk(t, n)}:${i}`,
};

/** Keys that count toward a week's "required" progress (niche + resources are optional). */
export function requiredKeys(track: Track, w: Pick<Week, "n" | "mustKnow" | "checklist" | "doneWhen">): string[] {
  const out: string[] = [];
  w.mustKnow.forEach((m, i) => {
    if (m.c.length) m.c.forEach((_, j) => out.push(keys.must(track, w.n, i, j)));
    else out.push(keys.must(track, w.n, i));
  });
  w.checklist.forEach((c) => out.push(keys.day(track, w.n, c.day)));
  if (w.doneWhen) out.push(keys.done(track, w.n));
  return out;
}
