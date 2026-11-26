"use client";
import { useMemo } from "react";
import { useContent } from "./content";
import { useSettings, useStore, useToday } from "./store";
import { buildPlan, pace, weekStreak, type Pace, type Plan } from "./sessions";

export interface LivePlan {
  plan: Plan;
  pace: Pace;
  streak: ReturnType<typeof weekStreak>;
  today: Date;
  start: string;
  startSet: boolean;
}

/** The live, reflowed plan for today. Null until the client clock is available. */
export function usePlan(): LivePlan | null {
  const c = useContent();
  const s = useStore();
  const cfg = useSettings();
  const today = useToday();
  return useMemo(() => {
    if (!today) return null;
    const plan = buildPlan(c, s, cfg.start, today);
    return { plan, pace: pace(c, s, cfg.start, today, plan), streak: weekStreak(plan, today), today, start: cfg.start, startSet: cfg.startSet };
  }, [c, s, cfg.start, cfg.startSet, today]);
}
