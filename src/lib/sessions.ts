// The plan as a queue of sessions, scheduled into the person's weekly rhythm.
//
// Each plan week has 8 sessions (5 Main, 3 Java + DSA, 1 review). Nothing is tied to a weekday: the
// scheduler takes the sessions that aren't done yet, in order, and fills each coming day up to that
// day's hours. Doing a session early, missing a day, swapping two sessions or changing the rhythm
// all just reflow the queue, so the plan never piles up as "overdue".
import type { ClientContent } from "./content";
import type { State } from "./merge";
import { keys, type Track } from "./roadmap";
import { addDays, dayKey, parseDate } from "./schedule";
import type { Day } from "./constants";

export type SessionTrack = Track | "review";

export interface Session {
  /** Stable id, also the progress key that marks it done. */
  key: string;
  track: SessionTrack;
  n: number;
  /** The original checklist day this session came from (for its text), or "Review". */
  from: Day | "Review";
  label: string;
  hours: number;
  /** Default position in the queue. */
  base: number;
}

/** Order inside each plan week. Chosen so the weekend-heavy rhythm lands exactly one plan week per calendar week. */
export const SESSION_TEMPLATE: { track: SessionTrack; from: Day | "Review"; label: string; hours: number }[] = [
  { track: "main", from: "Mon", label: "Read: first core resource", hours: 1.5 },
  { track: "java", from: "Tue", label: "Learn the concept", hours: 1.5 },
  { track: "main", from: "Wed", label: "Read + experiment", hours: 1.5 },
  { track: "main", from: "Fri", label: "Start the build", hours: 1.5 },
  { track: "main", from: "Sat", label: "Finish the build + write the note", hours: 4 },
  { track: "java", from: "Thu", label: "Implement it from scratch", hours: 1.5 },
  { track: "java", from: "Sun", label: "Practice problems", hours: 3 },
  { track: "review", from: "Review", label: "Weekly review: Done-when tests", hours: 1 },
];

export const reviewKey = (n: number) => `rv:W${n}`;
export const orderKey = (k: string) => `so:${k}`;
export const dayHoursKey = (d: string) => `dh:${d}`;
export const RHYTHM_KEY = "cfg:rhythm";

export const WEEKDAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export type Rhythm = number[]; // hours, Mon..Sun

export const RHYTHM_PRESETS: { id: string; name: string; hours: Rhythm; note: string }[] = [
  { id: "weekend", name: "Weekend-heavy", hours: [1.5, 1.5, 1.5, 0, 0, 5.5, 5.5], note: "15.5 h. Three short weekday sessions, Thursday and Friday free, the deep work on the weekend." },
  { id: "even", name: "Every day (original)", hours: [1.5, 1.5, 1.5, 1.5, 1.5, 4, 4], note: "15.5 h. The plan's original rhythm, a session every day." },
  { id: "light", name: "Lighter weekend-heavy", hours: [1, 1, 1, 0, 0, 4, 4], note: "11 h. Takes about 47 weeks." },
];
export const DEFAULT_RHYTHM: Rhythm = RHYTHM_PRESETS[0].hours;

export function sessionKey(track: SessionTrack, n: number, from: Day | "Review") {
  return track === "review" ? reviewKey(n) : keys.day(track, n, from);
}

export function allSessions(c: ClientContent): Session[] {
  const out: Session[] = [];
  for (let n = 1; n <= 36; n++)
    SESSION_TEMPLATE.forEach((t, i) => {
      if (t.track !== "review" && !c.weeks[t.track]?.[n - 1]) return;
      out.push({ key: sessionKey(t.track, n, t.from), track: t.track, n, from: t.from, label: t.label, hours: t.hours, base: (n - 1) * 10 + i });
    });
  return out;
}

export function sessionText(c: ClientContent, x: Session): string {
  if (x.track === "review") return "Run this week's Done-when test on both tracks, tick what you passed, and glance at next week.";
  return c.weeks[x.track]?.[x.n - 1]?.checklist.find((d) => d.day === x.from)?.text ?? "";
}

export function rhythmOf(s: State): Rhythm {
  const v = s.entries[RHYTHM_KEY]?.v;
  if (Array.isArray(v) && v.length === 7 && v.every((x) => typeof x === "number" && x >= 0) && v.some((x) => x > 0)) return v as Rhythm;
  return DEFAULT_RHYTHM;
}
export const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7;
export const rhythmTotal = (r: Rhythm) => r.reduce((a, b) => a + b, 0);

const done = (s: State, k: string) => !!s.entries[k]?.v;
const doneDay = (s: State, k: string) => dayKey(new Date(s.entries[k]!.t));
const order = (s: State, x: Session) => {
  const v = s.entries[orderKey(x.key)]?.v;
  return typeof v === "number" ? v : x.base;
};

export interface Planned extends Session {
  date: string;
}
export interface Plan {
  sessions: Session[];
  /** Pending sessions with the day each is planned for, in order. */
  planned: Planned[];
  byDate: Map<string, Planned[]>;
  doneKeys: Set<string>;
  doneOn: Map<string, string>;
  /** First day the queue fills from. */
  from: string;
  finish: string | null;
}

interface FillOpts {
  rhythm: Rhythm;
  /** Per-date hours that replace the rhythm for that date. */
  hoursOn: (d: string) => number | undefined;
  /** Hours already used on the first day (sessions done today). */
  usedFirst: number;
}

/** Fill days with sessions in order, keeping each track's own order and every review after its week. */
function fill(pending: Session[], fromDay: string, o: FillOpts): Planned[] {
  const maxCap = Math.max(...o.rhythm);
  const left = [...pending];
  const out: Planned[] = [];
  const unplannedWeek = new Map<number, number>(); // week -> non-review sessions not yet placed
  for (const x of left) if (x.track !== "review") unplannedWeek.set(x.n, (unplannedWeek.get(x.n) ?? 0) + 1);
  let d = parseDate(fromDay);
  for (let guard = 0; left.length && guard < 3650; guard++, d = addDays(d, 1)) {
    const key = dayKey(d);
    const cap = Math.max(0, (o.hoursOn(key) ?? o.rhythm[weekdayIndex(d)]) - (guard === 0 ? o.usedFirst : 0));
    let used = 0;
    let placed = true;
    while (placed && used < cap - 0.01) {
      placed = false;
      const seen = new Set<SessionTrack>();
      for (let i = 0; i < left.length; i++) {
        const x = left[i];
        if (seen.has(x.track)) continue; // only the next session of each track is a candidate
        seen.add(x.track);
        if (x.track === "review" && (unplannedWeek.get(x.n) ?? 0) > 0) continue;
        const h = Math.min(x.hours, maxCap); // a session longer than any day goes on the longest days
        // Estimates are rough: a day with nothing in it yet takes a session up to half again its hours.
        if (used + h > cap + 0.01 && !(used === 0 && h <= cap * 1.5 + 0.01)) continue;
        used += h;
        out.push({ ...x, date: key });
        left.splice(i, 1);
        if (x.track !== "review") unplannedWeek.set(x.n, unplannedWeek.get(x.n)! - 1);
        placed = true;
        break;
      }
    }
  }
  return out;
}

/** The live plan: what's left, from today (or the start date) onward. */
export function buildPlan(c: ClientContent, s: State, start: string, today: Date): Plan {
  const sessions = allSessions(c);
  const rhythm = rhythmOf(s);
  const todayKey = dayKey(today);
  const from = start > todayKey ? start : todayKey;
  const doneKeys = new Set<string>();
  const doneOn = new Map<string, string>();
  let usedToday = 0;
  for (const x of sessions)
    if (done(s, x.key)) {
      doneKeys.add(x.key);
      const d = doneDay(s, x.key);
      doneOn.set(x.key, d);
      if (d === todayKey && from === todayKey) usedToday += x.hours;
    }
  const pending = sessions.filter((x) => !doneKeys.has(x.key)).sort((a, b) => order(s, a) - order(s, b) || a.base - b.base);
  const hoursOn = (d: string) => {
    const v = s.entries[dayHoursKey(d)]?.v;
    return typeof v === "number" ? v : undefined;
  };
  const planned = fill(pending, from, { rhythm, hoursOn, usedFirst: usedToday });
  const byDate = new Map<string, Planned[]>();
  for (const p of planned) byDate.set(p.date, [...(byDate.get(p.date) ?? []), p]);
  return { sessions, planned, byDate, doneKeys, doneOn, from, finish: planned.length ? planned[planned.length - 1].date : null };
}

/** The plan as it would run with the current rhythm and nothing missed, from the start date. */
export function baselinePlan(c: ClientContent, s: State, start: string): Planned[] {
  return fill(allSessions(c), start, { rhythm: rhythmOf(s), hoursOn: () => undefined, usedFirst: 0 });
}

export interface Pace {
  done: number;
  total: number;
  /** Sessions that should be done before today, on the baseline. */
  expected: number;
  /** Positive: ahead by this many sessions. Negative: behind. */
  diff: number;
  baselineFinish: string | null;
}
export function pace(c: ClientContent, s: State, start: string, today: Date, plan: Plan): Pace {
  const base = baselinePlan(c, s, start);
  const t = dayKey(today);
  const expected = base.filter((p) => p.date < t).length;
  const doneCount = plan.doneKeys.size;
  return { done: doneCount, total: plan.sessions.length, expected, diff: doneCount - expected, baselineFinish: base.length ? base[base.length - 1].date : null };
}

/** The plan week you're working on: the week of the first session not done yet. */
export function currentWeek(plan: Plan, track?: SessionTrack): number {
  const first = plan.planned.find((p) => !track || p.track === track);
  return first ? first.n : 36;
}

// ---------- streaks ----------

export const MIN_WEEK_SESSIONS = 2;

export interface WeekStat {
  monday: string;
  sessions: number;
  hours: number;
}
/** Sessions done per calendar week (Mon-Sun), keyed by that week's Monday. */
export function weekStats(plan: Plan): Map<string, WeekStat> {
  const out = new Map<string, WeekStat>();
  const hours = new Map(plan.sessions.map((x) => [x.key, x.hours]));
  for (const [k, d] of plan.doneOn) {
    const dt = parseDate(d);
    const mon = dayKey(addDays(dt, -weekdayIndex(dt)));
    const w = out.get(mon) ?? { monday: mon, sessions: 0, hours: 0 };
    w.sessions++;
    w.hours += hours.get(k) ?? 0;
    out.set(mon, w);
  }
  return out;
}

/**
 * Weeks in a row with at least the minimum week (two sessions). A weekend-heavy rhythm has quiet
 * weekdays, so the streak counts weeks rather than days; this week only counts once it's hit, and
 * doesn't break the streak until it's over.
 */
export function weekStreak(plan: Plan, today: Date): { current: number; best: number; thisWeek: WeekStat } {
  const stats = weekStats(plan);
  const mon = addDays(today, -weekdayIndex(today));
  const thisKey = dayKey(mon);
  const thisWeek = stats.get(thisKey) ?? { monday: thisKey, sessions: 0, hours: 0 };
  const ok = (k: string) => (stats.get(k)?.sessions ?? 0) >= MIN_WEEK_SESSIONS;
  let current = ok(thisKey) ? 1 : 0;
  for (let d = addDays(mon, -7); ok(dayKey(d)); d = addDays(d, -7)) current++;
  let best = 0;
  if (stats.size) {
    const first = [...stats.keys()].sort()[0];
    let run = 0;
    for (let d = parseDate(first); dayKey(d) <= thisKey; d = addDays(d, 7)) {
      run = ok(dayKey(d)) ? run + 1 : 0;
      best = Math.max(best, run);
    }
  }
  return { current, best: Math.max(best, current), thisWeek };
}
