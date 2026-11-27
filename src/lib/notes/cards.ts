// Flashcards written inside notes, and a small spaced-repetition schedule for them.
//
// Three ways to write a card:
//   Q: What does a hash map trade for O(1) lookups?
//   A: Memory, and worst-case O(n) when keys collide.
//
//   Big-O of binary search :: O(log n)
//
//   ```card
//   Question (any Markdown)
//   ---
//   Answer (any Markdown, code too: use ```` for the outer fence then)
//   ```
import { addDays, dayKey, parseDate } from "../schedule";

export interface Card {
  id: string;
  q: string;
  a: string;
  kind: "qa" | "term" | "block";
}

export function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

/** Splits a fenced card block into question and answer. */
export function splitCardBlock(src: string): { q: string; a: string } {
  const lines = src.replace(/\n$/, "").split("\n");
  const i = lines.findIndex((l) => /^\s*(---|\?\?\?)\s*$/.test(l));
  if (i < 0) return { q: src.trim(), a: "" };
  return { q: lines.slice(0, i).join("\n").trim(), a: lines.slice(i + 1).join("\n").trim() };
}

export const TERM_RE = /^(?![-*+>#|]|\d+\.)\s*(.{1,200}?)\s+::\s+(.+)$/;

const cardCache = new Map<string, Card[]>();
/** Cards in a note body. Cached by body text, since lists and counts ask for them on every render. */
export function extractCards(body: string): Card[] {
  const hit = cardCache.get(body);
  if (hit) return hit;
  const cards = parseCards(body);
  if (cardCache.size > 500) cardCache.clear();
  cardCache.set(body, cards);
  return cards;
}

function parseCards(body: string): Card[] {
  const out: Card[] = [];
  const lines = body.split("\n");
  let i = 0;
  const push = (q: string, a: string, kind: Card["kind"]) => {
    if (!q.trim() || !a.trim()) return;
    const id = hash(norm(q));
    if (!out.some((c) => c.id === id)) out.push({ id, q: q.trim(), a: a.trim(), kind });
  };
  while (i < lines.length) {
    const l = lines[i];
    const fence = l.match(/^\s*(`{3,}|~{3,})\s*([\w-]*)/);
    if (fence) {
      const close = fence[1];
      const start = i + 1;
      let j = start;
      while (j < lines.length && !lines[j].trim().startsWith(close)) j++;
      if (fence[2] === "card") {
        const { q, a } = splitCardBlock(lines.slice(start, j).join("\n"));
        push(q, a, "block");
      }
      i = j + 1;
      continue;
    }
    if (/^\s*Q:\s*/i.test(l)) {
      const q: string[] = [l.replace(/^\s*Q:\s*/i, "")];
      let j = i + 1;
      while (j < lines.length && lines[j].trim() && !/^\s*A:\s*/i.test(lines[j])) q.push(lines[j++]);
      if (j < lines.length && /^\s*A:\s*/i.test(lines[j])) {
        const a: string[] = [lines[j].replace(/^\s*A:\s*/i, "")];
        j++;
        while (j < lines.length && lines[j].trim() && !/^\s*Q:\s*/i.test(lines[j])) a.push(lines[j++]);
        push(q.join("\n"), a.join("\n"), "qa");
      }
      i = j;
      continue;
    }
    const t = l.match(TERM_RE);
    if (t && !l.includes("`")) push(t[1], t[2], "term");
    i++;
  }
  return out;
}

// ---------- schedule (SM-2, simplified) ----------
export type Grade = "again" | "hard" | "good" | "easy";
export interface CardRec {
  /** Days until the next review. 0 = learning, comes back today. */
  ivl: number;
  ease: number;
  reps: number;
  lapses: number;
  /** yyyy-mm-dd it's next due. */
  due: string;
  last: string;
}

export function grade(prev: CardRec | undefined, g: Grade, today: string): CardRec {
  const ease0 = prev?.ease ?? 2.5;
  const ivl0 = prev?.ivl ?? 0;
  let ivl: number;
  let ease = ease0;
  let lapses = prev?.lapses ?? 0;
  if (g === "again") {
    ivl = 0;
    ease = Math.max(1.3, ease0 - 0.2);
    if (prev && prev.ivl > 0) lapses++;
  } else if (g === "hard") {
    ivl = Math.max(1, Math.round(ivl0 * 1.2));
    ease = Math.max(1.3, ease0 - 0.15);
  } else if (g === "good") {
    ivl = ivl0 < 1 ? 1 : ivl0 < 3 ? 3 : Math.round(ivl0 * ease0);
  } else {
    ivl = ivl0 < 1 ? 4 : Math.round(ivl0 * ease0 * 1.3);
    ease = ease0 + 0.15;
  }
  ivl = Math.min(ivl, 365);
  return { ivl, ease: Math.round(ease * 100) / 100, reps: (prev?.reps ?? 0) + 1, lapses, due: dayKey(addDays(parseDate(today), ivl)), last: today };
}

/** The next interval each button would give, for the button labels. */
export function preview(prev: CardRec | undefined, today: string): Record<Grade, string> {
  const fmt = (r: CardRec) => (r.ivl === 0 ? "now" : r.ivl < 30 ? `${r.ivl}d` : r.ivl < 365 ? `${Math.round(r.ivl / 30)}mo` : "1y");
  return { again: fmt(grade(prev, "again", today)), hard: fmt(grade(prev, "hard", today)), good: fmt(grade(prev, "good", today)), easy: fmt(grade(prev, "easy", today)) };
}

export const isDue = (rec: CardRec | undefined, today: string) => !rec || rec.due <= today;
export const isNew = (rec: CardRec | undefined) => !rec;
