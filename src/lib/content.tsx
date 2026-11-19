"use client";
// The per-person slice of the plan, computed on the server (src/server/content.ts) and handed to client
// components through context. Nothing outside this slice ever reaches the browser.

import { createContext, useContext } from "react";
import type { Day } from "./constants";
import type { FeatureId } from "./features";
import type { Group, Problem, Track, Week } from "./roadmap";

export type Role = "open" | "owner" | "admin" | "member";

export interface ScheduleRow {
  day: Day;
  track: Track | "review";
  label: string;
  time: string;
  what: string;
}

export interface ClientContent {
  role: Role;
  login: string | null;
  /** Set when an admin is previewing the app as one of their members. */
  previewAs: string | null;
  tracks: Track[];
  features: FeatureId[];
  weeks: Partial<Record<Track, Week[]>>;
  groups: Partial<Record<Track, Group[]>>;
  phaseSummary: Record<string, { unlocks: string; milestone: string }>;
  schedule: ScheduleRow[];
  problems: (Problem & { week: number })[];
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

export function useCan() {
  const c = useContent();
  return (f: FeatureId) => c.features.includes(f);
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
