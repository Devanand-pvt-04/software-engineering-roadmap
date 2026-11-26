import "server-only";
import type { ExplainMap } from "./types";
import { EXPLAIN_MAIN_START } from "./main-start";
import { EXPLAIN_MAIN_PHASE1 } from "./main-phase1";
import { EXPLAIN_JAVA_PART_A } from "./java-part-a";
import { EXPLAIN_JAVA_PART_B } from "./java-part-b";
import { EXPLAIN_JAVA_PART_C1 } from "./java-part-c1";
import { EXPLAIN_JAVA_PART_C2 } from "./java-part-c2";
import { EXPLAIN_JAVA_PART_D } from "./java-part-d";
import { EXPLAIN_JAVA_PART_E1 } from "./java-part-e1";
import { EXPLAIN_JAVA_PART_E2 } from "./java-part-e2";
import { EXPLAIN_MAIN_BROWSER } from "./main-browser";
import { EXPLAIN_MAIN_JS } from "./main-js";
import { EXPLAIN_MAIN_BACKEND } from "./main-backend";
import { EXPLAIN_MAIN_CRAFT } from "./main-craft";
import { EXPLAIN_MAIN_PYTHON_AI } from "./main-python-ai";
import { EXPLAIN_MAIN_FRONTEND } from "./main-frontend";
import { EXPLAIN_MAIN_INFRA } from "./main-infra";
import { EXPLAIN_MAIN_DESIGN } from "./main-design";

/** Every explainer card, keyed by `<M|J><week>:<Must know topic index>`. */
export const EXPLAIN: ExplainMap = {
  ...EXPLAIN_MAIN_START,
  ...EXPLAIN_MAIN_PHASE1,
  ...EXPLAIN_MAIN_BROWSER,
  ...EXPLAIN_MAIN_JS,
  ...EXPLAIN_MAIN_BACKEND,
  ...EXPLAIN_MAIN_CRAFT,
  ...EXPLAIN_MAIN_PYTHON_AI,
  ...EXPLAIN_MAIN_FRONTEND,
  ...EXPLAIN_MAIN_INFRA,
  ...EXPLAIN_MAIN_DESIGN,
  ...EXPLAIN_JAVA_PART_A,
  ...EXPLAIN_JAVA_PART_B,
  ...EXPLAIN_JAVA_PART_C1,
  ...EXPLAIN_JAVA_PART_C2,
  ...EXPLAIN_JAVA_PART_D,
  ...EXPLAIN_JAVA_PART_E1,
  ...EXPLAIN_JAVA_PART_E2,
};
