"use client";
// The plan content, assembled on the server (src/server/content.ts) and handed to client components through context.

import { createContext, useContext } from "react";
import type { ContestInfo, Group, Phase2SetView, Problem, Track, Week } from "./roadmap";

export interface ClientContent {
  tracks: Track[];
  weeks: Partial<Record<Track, Week[]>>;
  groups: Partial<Record<Track, Group[]>>;
  phaseSummary: Record<string, { unlocks: string; milestone: string }>;
  /** Why each track runs in the order it does. */
  intros: Record<Track, string>;
  /** Core problems, then Phase 2 ones (flagged phase2) when that feature is on. */
  problems: (Problem & { week: number })[];
  phase2: Phase2SetView[];
  contest: ContestInfo | null;
  practiceRules: string[];
  urlNoteSections: { id: string; phase: string; title: string; hint: string }[];
  urlNoteTitle: string;
  encouragement: string | null;
}

const Ctx = createContext<ClientContent | null>(null);

export function ContentProvider({ value, children }: { value: ClientContent; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useContent(): ClientContent {
  const c = useContext(Ctx);
  if (!c) throw new Error("useContent outside ContentProvider");
  return c;
}

/** Number of weeks in the longest track. */
export function planLength(c: ClientContent): number {
  return Math.max(0, ...c.tracks.map((t) => c.weeks[t]?.length ?? 0));
}
export function trackLength(c: ClientContent, t: Track): number {
  return c.weeks[t]?.length ?? 0;
}

export function weeksOf(c: ClientContent, t: Track): Week[] {
  return c.weeks[t] ?? [];
}
export function getWeek(c: ClientContent, t: Track, n: number): Week | undefined {
  return c.weeks[t]?.[n - 1];
}
export function groupOf(c: ClientContent, t: Track, n: number): Group | undefined {
  return c.groups[t]?.find((g) => g.weeks.includes(n));
}
