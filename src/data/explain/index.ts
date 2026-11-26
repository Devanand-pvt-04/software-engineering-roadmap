import "server-only";
import type { ExplainMap } from "./types";
import { EXPLAIN_MAIN_PHASE1 } from "./main-phase1";
import { EXPLAIN_JAVA_PART_A } from "./java-part-a";

/** Every explainer card, keyed by `<M|J><week>:<Must know topic index>`. */
export const EXPLAIN: ExplainMap = { ...EXPLAIN_MAIN_PHASE1, ...EXPLAIN_JAVA_PART_A };
