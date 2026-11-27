// Notes: the learner's own study notes. Each note is one synced entry (`nb:<id>`), merged last-writer-wins
// like everything else in the store. Older week notes (`nt:<weekId>`, plain text) show up as notes too and
// become `nb:w-<weekId>` the first time they're edited, so nothing written before is lost.
import type { ClientContent } from "../content";
import type { State } from "../merge";
import { keys, type Track, type Week } from "../roadmap";

export type NoteStatus = "learning" | "revise" | "confident";
export const STATUS_LABEL: Record<NoteStatus, string> = { learning: "Learning", revise: "Needs revision", confident: "Confident" };

export interface Note {
  title: string;
  body: string;
  /** Tags set on the note. Tags written as #tag in the body are added to these when read. */
  tags: string[];
  /** Roadmap links: "<track>:<weekId>" or "<track>:<weekId>:<topicIndex>". */
  refs: string[];
  pinned?: boolean;
  /** In the interview pack. */
  interview?: boolean;
  status?: NoteStatus;
  /** yyyy-mm-dd of the last time it was revised. */
  revisedAt?: string;
  created: number;
  updated: number;
  /** In the trash since this time. */
  deleted?: number;
}

export interface NoteView extends Note {
  id: string;
  /** Every tag: the note's own plus #tags in the body, lower case, no #. */
  allTags: string[];
  /** Still only the old plain-text week note; becomes a real note on first edit. */
  legacy?: boolean;
}

export const noteKey = (id: string) => `nb:${id}`;
export const sketchKey = (id: string) => `sk:${id}`;
export const cardKey = (noteId: string, cardId: string) => `fc:${noteId}:${cardId}`;
export const weekNoteId = (weekId: string) => `w-${weekId}`;

export const noteHref = (id: string) => `/notes#note=${encodeURIComponent(id)}`;

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const TAG_RE = /(^|[\s(])#([a-z][\w/-]{0,39})/gi;
const FENCE_RE = /^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\s*$/gm;
const INLINE_CODE_RE = /`[^`\n]+`/g;

/** Body with code removed, so #include or #define inside code aren't read as tags. */
export const stripCode = (body: string) => body.replace(FENCE_RE, "").replace(INLINE_CODE_RE, "");

export function bodyTags(body: string): string[] {
  const out = new Set<string>();
  for (const m of stripCode(body).matchAll(TAG_RE)) out.add(m[2].toLowerCase());
  return [...out];
}
export const normTag = (t: string) =>
  t
    .trim()
    .replace(/^#+/, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w/-]/g, "")
    .slice(0, 40);

// Views are rebuilt only when a note's stored object changes (every write makes a new object).
const viewCache = new WeakMap<object, NoteView>();
function cachedView(id: string, n: Note): NoteView {
  const hit = viewCache.get(n);
  if (hit && hit.id === id) return hit;
  const v = view(id, n);
  viewCache.set(n, v);
  return v;
}

function view(id: string, n: Note, legacy = false): NoteView {
  const allTags = [...new Set([...(n.tags ?? []).map(normTag).filter(Boolean), ...bodyTags(n.body ?? "")])].sort();
  return { ...n, tags: n.tags ?? [], refs: n.refs ?? [], body: n.body ?? "", title: n.title ?? "", id, allTags, legacy };
}

function weekTitle(c: ClientContent, weekId: string): { track: Track; w: Week } | null {
  for (const t of c.tracks) {
    const w = (c.weeks[t] ?? []).find((x) => x.id === weekId);
    if (w) return { track: t, w };
  }
  return null;
}

/** Every note, including old week notes not yet converted, newest first. Trash is included (check `deleted`). */
export function allNotes(s: State, c: ClientContent): NoteView[] {
  const out: NoteView[] = [];
  const seen = new Set<string>();
  for (const [k, e] of Object.entries(s.entries)) {
    if (!k.startsWith("nb:") || !e.v || typeof e.v !== "object") continue;
    const id = k.slice(3);
    seen.add(id);
    out.push(cachedView(id, e.v as Note));
  }
  for (const [k, e] of Object.entries(s.entries)) {
    if (!k.startsWith("nt:") || typeof e.v !== "string" || !e.v.trim()) continue;
    const weekId = k.slice(3);
    const id = weekNoteId(weekId);
    if (seen.has(id)) continue;
    const found = weekTitle(c, weekId);
    if (!found) continue;
    out.push(view(id, legacyWeekNote(found.track, found.w, e.v, e.t), true));
  }
  return out.sort((a, b) => b.updated - a.updated);
}

export function legacyWeekNote(track: Track, w: Week, body: string, t: number): Note {
  return { title: weekNoteTitle(track, w), body, tags: [], refs: [`${track}:${w.id}`], created: t, updated: t };
}
export const weekNoteTitle = (track: Track, w: Week) => `${track === "main" ? "Main" : "Java + DSA"} week ${w.n}: ${w.title}`;

export function getNote(s: State, c: ClientContent, id: string): NoteView | null {
  const e = s.entries[noteKey(id)];
  if (e?.v && typeof e.v === "object") return cachedView(id, e.v as Note);
  if (id.startsWith("w-")) {
    const weekId = id.slice(2);
    const old = s.entries[keys.note(weekId)];
    const found = weekTitle(c, weekId);
    if (found && typeof old?.v === "string" && old.v.trim()) return view(id, legacyWeekNote(found.track, found.w, old.v, old.t), true);
  }
  return null;
}

/** Strip the view-only fields before saving. */
export function toNote(v: NoteView | Note): Note {
  const { title, body, tags, refs, pinned, interview, status, revisedAt, created, updated, deleted } = v as NoteView;
  const n: Note = { title, body, tags, refs, created, updated };
  if (pinned) n.pinned = true;
  if (interview) n.interview = true;
  if (status) n.status = status;
  if (revisedAt) n.revisedAt = revisedAt;
  if (deleted) n.deleted = deleted;
  return n;
}

export function blankNote(partial: Partial<Note> = {}): Note {
  const now = Date.now();
  return { title: "", body: "", tags: [], refs: [], created: now, updated: now, ...partial };
}

/** The first heading or line, for notes without a title. */
export function displayTitle(n: Pick<Note, "title" | "body">): string {
  if (n.title.trim()) return n.title.trim();
  const line = n.body
    .split("\n")
    .map((l) => l.replace(/^#+\s*|[*_`>]/g, "").trim())
    .find(Boolean);
  return line ? line.slice(0, 80) : "Untitled note";
}

export function snippet(body: string, len = 140): string {
  return stripCode(body)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#+\s*/gm, "")
    .replace(/[*_>|#-]{1,3}/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, len);
}

export function wordCount(body: string): number {
  const t = stripCode(body).trim();
  return t ? t.split(/\s+/).length : 0;
}

/** [[Title]] and [[Title|label]] links in a body. */
export function wikiLinks(body: string): string[] {
  const out = new Set<string>();
  for (const m of stripCode(body).matchAll(/\[\[([^\]|\n]+)(?:\|[^\]\n]+)?\]\]/g)) out.add(m[1].trim().toLowerCase());
  return [...out];
}

export function findByTitle(notes: NoteView[], title: string): NoteView | undefined {
  const t = title.trim().toLowerCase();
  return notes.find((n) => !n.deleted && displayTitle(n).toLowerCase() === t);
}

/** Notes that link to this one with [[its title]]. */
export function backlinks(notes: NoteView[], target: NoteView): NoteView[] {
  const t = displayTitle(target).toLowerCase();
  return notes.filter((n) => n.id !== target.id && !n.deleted && wikiLinks(n.body).includes(t));
}

/** Headings, for the outline. */
export function outline(body: string): { level: number; text: string; line: number }[] {
  const out: { level: number; text: string; line: number }[] = [];
  let fence = "";
  body.split("\n").forEach((l, i) => {
    const f = l.match(/^(`{3,}|~{3,})/);
    if (f) {
      if (!fence) fence = f[1];
      else if (l.startsWith(fence)) fence = "";
      return;
    }
    if (fence) return;
    const m = l.match(/^(#{1,4})\s+(.+)/);
    if (m) out.push({ level: m[1].length, text: m[2].replace(/[*_`]/g, ""), line: i });
  });
  return out;
}

export interface RefView {
  ref: string;
  track: Track;
  weekId: string;
  n: number;
  label: string;
  topic?: string;
}
export function refView(c: ClientContent, ref: string): RefView | null {
  const [t, weekId, topic] = ref.split(":");
  const track = t as Track;
  const w = (c.weeks[track] ?? []).find((x) => x.id === weekId);
  if (!w) return null;
  const tp = topic !== undefined ? w.mustKnow[Number(topic)]?.t : undefined;
  return { ref, track, weekId, n: w.n, label: `${track === "main" ? "Main" : "Java"} W${w.n}: ${w.title}`, topic: tp };
}

export function notesForWeek(notes: NoteView[], track: Track, weekId: string): NoteView[] {
  const p = `${track}:${weekId}`;
  return notes.filter((n) => !n.deleted && n.refs.some((r) => r === p || r.startsWith(p + ":")));
}

export function daysSince(day: string | undefined, today: string): number {
  if (!day) return Infinity;
  const a = new Date(day + "T00:00:00").getTime();
  const b = new Date(today + "T00:00:00").getTime();
  return Math.round((b - a) / 86_400_000);
}

/** A file-system-safe name for exports. */
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "note";
