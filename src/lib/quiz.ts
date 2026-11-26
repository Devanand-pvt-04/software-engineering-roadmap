// Self-check quizzes with a small Leitner schedule: answers you got come back less often, misses come back tomorrow.
import type { ClientContent } from "./content";
import type { State } from "./merge";
import { keys, type QuizItem, type Track } from "./roadmap";
import { addDays, dayKey, parseDate } from "./schedule";

export type Rating = "got" | "shaky" | "missed";
export interface QuizRec {
  box: number; // 0..4
  at: string; // yyyy-mm-dd of the last answer
  last: Rating;
}
const INTERVAL = [1, 3, 7, 21, 60];

export function rate(prev: QuizRec | undefined, r: Rating, today: string): QuizRec {
  const box = r === "got" ? Math.min(4, (prev?.box ?? 0) + 1) : r === "shaky" ? Math.max(0, (prev?.box ?? 1) - 1) : 0;
  return { box, at: today, last: r };
}
export const dueOn = (rec: QuizRec) => dayKey(addDays(parseDate(rec.at), INTERVAL[rec.box]));
export const quizRec = (s: State, k: string) => s.entries[k]?.v as QuizRec | undefined;

export interface DueCard extends QuizItem {
  key: string;
  track: Track;
  n: number;
  title: string;
  due: string;
}

/** Answered questions whose next review date has arrived, oldest first. */
export function dueCards(s: State, c: ClientContent, today: string): DueCard[] {
  const out: DueCard[] = [];
  for (const t of c.tracks)
    for (const w of c.weeks[t] ?? [])
      w.quiz.forEach((q, i) => {
        const k = keys.quiz(w.id, i);
        const rec = quizRec(s, k);
        if (!rec) return;
        const due = dueOn(rec);
        if (due <= today) out.push({ ...q, key: k, track: t, n: w.n, title: w.title, due });
      });
  return out.sort((a, b) => a.due.localeCompare(b.due));
}
