// The plan as a queue of sessions, scheduled into the person's weekly rhythm.
//
// Each plan week is a list of sessions with hour estimates, plus a review. Nothing is tied to a weekday: the
// scheduler takes the sessions that aren't done yet, in order, and fills each coming day up to that
// day's hours. Doing a session early, missing a day, swapping two sessions or changing the rhythm
// all just reflow the queue, so the plan never piles up as "overdue".
import type { ClientContent } from "./content";
import type { State } from "./merge";
import { keys, type LinkRef, type Track } from "./roadmap";
import { addDays, dayKey, parseDate } from "./schedule";
import type { Day } from "./constants";

export type SessionTrack = Track | "review";

export interface Session {
  /** Stable progress key that marks it done. */
  key: string;
  track: SessionTrack;
  /** Week position (from 1). */
  n: number;
  /** Stable id of the week it belongs to. */
  weekId: string;
  /** For weeks still on the original weekday checklist: which day's item this is. */
  from?: Day;
  label: string;
  hours: number;
  text?: string;
  links?: LinkRef[];
  /** Default position in the queue. */
  base: number;
}

/**
 * For weeks without their own session list: the original weekday checklist as sessions. The order is
 * chosen so the weekend-heavy preset fits exactly one week into each calendar week.
 */
export const SESSION_TEMPLATE: { track: SessionTrack; from?: Day; label: string; hours: number }[] = [
  { track: "main", from: "Mon", label: "Read: first core resource", hours: 1.5 },
  { track: "java", from: "Tue", label: "Learn the concept", hours: 1.5 },
  { track: "main", from: "Wed", label: "Read + experiment", hours: 1.5 },
  { track: "main", from: "Fri", label: "Start the build", hours: 1.5 },
  { track: "main", from: "Sat", label: "Finish the build + write the note", hours: 4 },
  { track: "java", from: "Thu", label: "Implement it from scratch", hours: 1.5 },
  { track: "java", from: "Sun", label: "Practice problems", hours: 3 },
  { track: "review", label: "Weekly review: Done-when tests", hours: 1 },
];
const REVIEW = SESSION_TEMPLATE[SESSION_TEMPLATE.length - 1];

export const reviewKey = (weekId: string) => `rv:${weekId}`;
export const orderKey = (k: string) => `so:${k}`;
export const dayHoursKey = (d: string) => `dh:${d}`;
export const RHYTHM_KEY = "cfg:rhythm";
export const MISS_KEY = "cfg:miss";

export const WEEKDAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export type Rhythm = number[]; // hours, Mon..Sun

export const RHYTHM_PRESETS: { id: string; name: string; hours: Rhythm; note: string }[] = [
  { id: "weekend", name: "Weekend-heavy", hours: [1.5, 1.5, 1.5, 0, 0, 5.5, 5.5], note: "15.5 h. Three short weekday sessions, Thursday and Friday free, the deep work on the weekend." },
  { id: "even", name: "Every day", hours: [1.5, 1.5, 1.5, 1.5, 1.5, 4, 4], note: "15.5 h. The plan's original rhythm, a session every day." },
  { id: "weekdays", name: "Weekdays only", hours: [2, 2, 2, 2, 2, 0, 0], note: "10 h. Weekends free." },
  { id: "weekends", name: "Weekends only", hours: [0, 0, 0, 0, 0, 5, 5], note: "10 h. Weekdays free." },
  { id: "light", name: "Light", hours: [1, 1, 1, 0, 0, 4, 4], note: "11 h." },
];
export const DEFAULT_RHYTHM: Rhythm = RHYTHM_PRESETS[0].hours;

// ---------- what happens when you miss ----------

export type MissMode = "push" | "spread" | "days";
export interface MissPolicy {
  mode: MissMode;
  /** Weekday indexes (0 = Mon) that take catch-up time, for mode "days". */
  days: number[];
  /** Most extra hours a day takes for catching up. */
  extra: number;
}
export const DEFAULT_MISS: MissPolicy = { mode: "push", days: [5, 6], extra: 1.5 };
/** Misses older than this stop being caught up and just push the plan back. */
export const CATCH_UP_WINDOW = 14;

export function missPolicyOf(s: State): MissPolicy {
  const v = s.entries[MISS_KEY]?.v as Partial<MissPolicy> | null | undefined;
  if (!v || typeof v !== "object") return DEFAULT_MISS;
  return {
    mode: v.mode === "spread" || v.mode === "days" ? v.mode : "push",
    days: Array.isArray(v.days) ? v.days.filter((d) => Number.isInteger(d) && d >= 0 && d < 7) : DEFAULT_MISS.days,
    extra: typeof v.extra === "number" && v.extra > 0 ? Math.min(6, v.extra) : DEFAULT_MISS.extra,
  };
}

/** Number of weeks in the longest track. */
export function planLength(c: ClientContent): number {
  return Math.max(0, ...c.tracks.map((t) => c.weeks[t]?.length ?? 0));
}

export function allSessions(c: ClientContent): Session[] {
  const out: Session[] = [];
  const len = planLength(c);
  for (let n = 1; n <= len; n++) {
    // Each session gets a slot in [0, 1) within its week; tracks interleave by slot.
    const week: (Session & { slot: number })[] = [];
    let firstId = "";
    for (const t of c.tracks) {
      const w = c.weeks[t]?.[n - 1];
      if (!w) continue;
      firstId ||= w.id;
      if (w.sessions?.length) {
        const total = w.sessions.reduce((a, x) => a + x.hours, 0) || 1;
        let cum = 0;
        w.sessions.forEach((d, i) => {
          week.push({ key: keys.session(w.id, i), track: t, n, weekId: w.id, label: d.label, hours: d.hours, text: d.text, links: d.links, base: 0, slot: ((cum + d.hours / 2) / total) * 0.99 });
          cum += d.hours;
        });
      } else
        SESSION_TEMPLATE.forEach((d, i) => {
          if (d.track !== t || !d.from) return;
          week.push({ key: keys.day(w.id, d.from), track: t, n, weekId: w.id, from: d.from, label: d.label, hours: d.hours, base: 0, slot: i / SESSION_TEMPLATE.length });
        });
    }
    if (!firstId) continue;
    week.sort((a, b) => a.slot - b.slot || (a.track === "main" ? -1 : 1));
    week.forEach((x, i) => {
      const { slot, ...rest } = x;
      void slot;
      out.push({ ...rest, base: n * 1000 + i });
    });
    out.push({ key: reviewKey(firstId), track: "review", n, weekId: firstId, label: REVIEW.label, hours: REVIEW.hours, base: n * 1000 + 999 });
  }
  return out;
}

export function sessionText(c: ClientContent, x: Session): string {
  if (x.track === "review") return "Run this week's Done-when test on both tracks, tick what you passed, and glance at next week.";
  if (x.text !== undefined) return x.text;
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
  /** Hours missed in the last two weeks, and the extra time given to each coming day to catch up. */
  missed: number;
  catchUp: Map<string, number>;
}

interface FillOpts {
  rhythm: Rhythm;
  /** Per-date hours that replace the rhythm for that date. */
  hoursOn: (d: string) => number | undefined;
  /** Hours already used on the first day (sessions done today). */
  usedFirst: number;
  /** Extra catch-up hours to hand out, and the rule for which days take them. */
  catchUp?: { hours: number; policy: MissPolicy; given: Map<string, number> };
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
    const wd = weekdayIndex(d);
    const set = o.hoursOn(key);
    let extra = 0;
    const cu = o.catchUp;
    if (cu && cu.hours > 0.01 && set === undefined) {
      const ok = cu.policy.mode === "spread" ? o.rhythm[wd] > 0 : cu.policy.mode === "days" && cu.policy.days.includes(wd);
      if (ok) {
        extra = Math.min(cu.hours, cu.policy.extra);
        cu.hours -= extra;
        cu.given.set(key, extra);
      }
    }
    const cap = Math.max(0, (set ?? o.rhythm[wd]) + extra - (guard === 0 ? o.usedFirst : 0));
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
  // Missed hours: what the rhythm asked for over the last two weeks, minus what got done in them.
  let missed = 0;
  if (from === todayKey) {
    const winStart = dayKey(addDays(today, -CATCH_UP_WINDOW));
    let d = parseDate(start > winStart ? start : winStart);
    for (; dayKey(d) < todayKey; d = addDays(d, 1)) missed += hoursOn(dayKey(d)) ?? rhythm[weekdayIndex(d)];
    for (const x of sessions) {
      const on = doneOn.get(x.key);
      if (on && on >= winStart && on < todayKey) missed -= x.hours;
    }
    missed = Math.max(0, missed);
  }
  const policy = missPolicyOf(s);
  const catchUp = new Map<string, number>();
  const planned = fill(pending, from, {
    rhythm,
    hoursOn,
    usedFirst: usedToday,
    catchUp: policy.mode === "push" ? undefined : { hours: missed, policy, given: catchUp },
  });
  const byDate = new Map<string, Planned[]>();
  for (const p of planned) byDate.set(p.date, [...(byDate.get(p.date) ?? []), p]);
  return { sessions, planned, byDate, doneKeys, doneOn, from, finish: planned.length ? planned[planned.length - 1].date : null, missed, catchUp };
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
  if (first) return first.n;
  return Math.max(1, ...plan.sessions.filter((x) => !track || x.track === track).map((x) => x.n));
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
