import type { Entry } from "./merge";
import { dayKey } from "./schedule";

/** The day an entry counts for: a "yyyy-mm-dd" value (a back-dated tick) or the day it was written. */
export function entryDay(e: Entry): string {
  return typeof e.v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(e.v) ? e.v : dayKey(new Date(e.t));
}
