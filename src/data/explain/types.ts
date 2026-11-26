/**
 * A ground-up explainer for one "Must know" topic. Every card answers the same five questions, in order,
 * so a learner starting from zero always gets the reason before the mechanism.
 */
export interface ExplainCard {
  /** Why it exists: the situation before it. */
  why: string;
  /** The problem it solves, as a concrete failure you can picture. */
  problem: string;
  /** How it solves it: the core idea in plain words, before jargon. */
  how: string;
  /** How it works technically: the mechanism, at the depth the step's Done-when test needs. */
  tech: string;
  /** What it costs, and when not to use it. */
  cost: string;
  /** The earlier topic this one stands on, e.g. "Main week 2: Processes". */
  buildsOn?: string;
}

/** Keyed by `<M|J><week>:<topic index>`, e.g. "M1:0" is the first Must know topic of Main week 1. */
export type ExplainMap = Record<string, ExplainCard>;
