// Types, labels and progress keys for the plan. Client-safe: no plan content here.
// The content itself is loaded on the server and filtered per person (src/server/content.ts).
import type { Day } from "./constants";

export type Track = "main" | "java";
export const TRACKS: Track[] = ["main", "java"];

/** Ground-up explainer: why it exists, the problem, how, the mechanism, and the cost. */
export interface ExplainView {
  why: string;
  problem?: string;
  how: string;
  tech: string[];
  cost: string;
  tryIt?: string;
  buildsOn?: string;
}
export interface TopicNode {
  t: string;
  c: string[];
  /** Optional explainer card for this topic. */
  x?: ExplainView;
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
  difficulty?: "Easy" | "Medium" | "Hard";
  /** From the optional Phase 2 set rather than a week's core list. */
  phase2?: boolean;
}
export interface Phase2SetView {
  id: string;
  title: string;
  week: number;
  why: string;
  problems: Problem[];
}
export interface ContestInfo {
  weeklyUtc: { day: number; hour: number; minute: number };
  url: string;
  startAfterWeek: number;
  rules: string[];
}
/** One sitting of study, in the order the person does them. */
export interface SessionDef {
  label: string;
  /** Estimated hours (decimal: 1.5 is 1 h 30 min). */
  hours: number;
  text: string;
  links: LinkRef[];
}
export interface Week {
  /** Stable id used in every progress key ("M15", "J3", or a new id like "M37"). Never changes when weeks are inserted or reordered. */
  id: string;
  /** Older ids whose ticks this week takes over (when two weeks were merged). */
  aliases?: string[];
  /** Position in the track, from 1. Used for URLs and labels only. */
  n: number;
  /** Sessions for this week. Weeks without them use the original weekday checklist. */
  sessions?: SessionDef[];
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

/** Default id for a week from the original 36 + 36. */
export const legacyId = (track: Track, n: number) => `${TRACK_SHORT[track]}${n}`;

// ---- Checkable keys (by stable week id) ----
export const keys = {
  must: (id: string, i: number, j?: number) => `mk:${id}:${i}${j === undefined ? "" : "." + j}`,
  niche: (id: string, i: number) => `ni:${id}:${i}`,
  res: (id: string, i: number) => `rs:${id}:${i}`,
  day: (id: string, d: string) => `cl:${id}:${d}`,
  session: (id: string, i: number) => `ss:${id}:${i}`,
  done: (id: string) => `dw:${id}`,
  build: (id: string) => `bd:${id}`,
  note: (id: string) => `nt:${id}`,
  problem: (slug: string) => `pr:${slug}`,
  quiz: (id: string, i: number) => `qz:${id}:${i}`,
  contest: (date: string) => `ct:${date}`,
};

/** Keys that count toward a week's "required" progress (niche + resources are optional). */
export function requiredKeys(w: Pick<Week, "id" | "mustKnow" | "checklist" | "doneWhen" | "sessions">): string[] {
  const out: string[] = [];
  w.mustKnow.forEach((m, i) => {
    if (m.c.length) m.c.forEach((_, j) => out.push(keys.must(w.id, i, j)));
    else out.push(keys.must(w.id, i));
  });
  if (w.sessions?.length) w.sessions.forEach((_, i) => out.push(keys.session(w.id, i)));
  else w.checklist.forEach((c) => out.push(keys.day(w.id, c.day)));
  if (w.doneWhen) out.push(keys.done(w.id));
  return out;
}
