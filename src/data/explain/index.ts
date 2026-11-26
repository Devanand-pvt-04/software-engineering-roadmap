import "server-only";
import type { ExplainMap } from "./types";
import { EXPLAIN_MAIN_PHASE1 } from "./main-phase1";
import { EXPLAIN_JAVA_PART_A } from "./java-part-a";
import { EXPLAIN_MAIN_BROWSER } from "./main-browser";
import { EXPLAIN_MAIN_JS } from "./main-js";

/** Every explainer card, keyed by `<M|J><week>:<Must know topic index>`. */
export const EXPLAIN: ExplainMap = {
  ...EXPLAIN_MAIN_PHASE1,
  ...EXPLAIN_MAIN_BROWSER,
  ...EXPLAIN_MAIN_JS,
  ...EXPLAIN_JAVA_PART_A,
};
