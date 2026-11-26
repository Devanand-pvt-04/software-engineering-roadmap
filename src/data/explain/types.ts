/**
 * A ground-up explainer for one "Must know" topic. Every card answers the same five questions, in order,
 * so a learner starting from zero always gets the reason before the mechanism.
 */
export interface ExplainCard {
  /** Why it exists: the situation before it. */
  why: string;
  /** The problem it solves, as a concrete failure you can picture. Left out for pure-syntax topics, where a problem would be forced. */
  problem?: string;
  /** How it solves it: the core idea in plain words, before jargon. */
  how: string;
  /** How it works technically, as short bullets (one idea each), at the depth the week's Done-when test needs. Every new term is defined in plain words where it first appears. */
  tech: string[];
  /** What it costs, and when not to use it. */
  cost: string;
  /** One thing to do right now to see it happen: a command, a snippet or a DevTools step. */
  tryIt?: string;
  /** The earlier topic this one stands on, e.g. "Main week 2: Processes". */
  buildsOn?: string;
}

/** Keyed by `<M|J><week>:<topic index>`, e.g. "M1:0" is the first Must know topic of Main week 1. */
export type ExplainMap = Record<string, ExplainCard>;
