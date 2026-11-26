"use client";
// Edits to the live plan. Each one writes a few small entries (session order, hours for a date),
// so it syncs like any tick and can be undone by writing the old value back.
import { getState, setEntry } from "./store";
import { dayHoursKey, orderKey, rhythmOf, weekdayIndex, type Plan, type Planned, type Session } from "./sessions";
import { dayKey, parseDate } from "./schedule";

const orderOf = (x: Session) => {
  const v = getState().entries[orderKey(x.key)]?.v;
  return typeof v === "number" ? v : x.base;
};

/** Hours planned for a date before any change: its override, or the rhythm. */
export function hoursFor(date: string): number {
  const s = getState();
  const v = s.entries[dayHoursKey(date)]?.v;
  return typeof v === "number" ? v : rhythmOf(s)[weekdayIndex(parseDate(date))];
}

/** Swap two sessions' places in the queue (e.g. do tomorrow's today and today's tomorrow). */
export function swapSessions(a: Session, b: Session) {
  const oa = orderOf(a);
  const ob = orderOf(b);
  setEntry(orderKey(a.key), ob === oa ? ob + 0.5 : ob);
  setEntry(orderKey(b.key), oa);
}

/** Not today: today gets no more sessions, and everything moves back to the next study day. */
export function skipDay(plan: Plan, date: string) {
  const doneHours = plan.sessions.filter((x) => plan.doneOn.get(x.key) === date).reduce((a, x) => a + x.hours, 0);
  setEntry(dayHoursKey(date), doneHours);
}

/** Pull a session into today: it moves to the front of the queue and today gets room for it. */
export function doToday(plan: Plan, x: Planned, today: Date) {
  const t = dayKey(today);
  const planned = (plan.byDate.get(t) ?? []).reduce((a, p) => a + p.hours, 0);
  const doneHours = plan.sessions.filter((s) => plan.doneOn.get(s.key) === t).reduce((a, s) => a + s.hours, 0);
  const min = Math.min(...plan.planned.map(orderOf));
  setEntry(orderKey(x.key), min - 1);
  setEntry(dayHoursKey(t), doneHours + planned + x.hours);
}

/** Put a date back on the weekly rhythm. */
export function resetDay(date: string) {
  setEntry(dayHoursKey(date), null);
}
