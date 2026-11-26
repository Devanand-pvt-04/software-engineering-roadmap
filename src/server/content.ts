import "server-only";
import data from "@/data/roadmap.json";
import {
  ENCOURAGEMENT, FALLING_BEHIND, JAVA_INTRO, MAIN_INTRO, PHASE_SUMMARY, PRACTICE_RULES, SETUP_MAIN, URL_NOTE_SECTIONS, WHATS_DIFFERENT, WHY_JAVA,
} from "@/data/guide";
import { linksFor } from "@/data/links";
import { specsFor } from "@/data/specifics";
import { QUIZ_MAIN } from "@/data/quiz-main";
import { QUIZ_JAVA } from "@/data/quiz-java";
import { HINTS } from "@/data/hints";
import { BRIEFS, type Brief } from "@/data/briefs";
import { CORE_TIME, FREE_ALTERNATIVES } from "@/data/estimates";
import { CONTEST_INFO, PHASE2 } from "@/data/phase2";
import { EXPLAIN } from "@/data/explain";
import type { Day } from "@/lib/constants";
import type { ClientContent } from "@/lib/content";
import { TRACKS, legacyId, type Group, type LinkRef, type Phase2SetView, type Problem, type Track, type Week, type SpecView } from "@/lib/roadmap";

interface RawWeek extends Omit<Week, "id" | "n" | "resources" | "checklist" | "after" | "quiz" | "brief" | "sessions"> {
  /** Stable id; defaults to M<n> / J<n> from the legacy number. */
  id?: string;
  /** Legacy week number from the original plan. Position comes from array order. */
  n?: number;
  aliases?: string[];
  sessions?: { label: string; hours: number; text: string }[];
  resources: { text: string; core: boolean }[];
  checklist: { day: Day; text: string }[];
  after: string[];
}

const RAW: Record<Track, RawWeek[]> = { main: data.main as RawWeek[], java: data.java as RawWeek[] };
// Phase texts were written for fixed weekdays and buffer weeks; the app schedules sessions instead.
const unday = (x: string) =>
  x
    .replace(/\s*Optional buffer week[^.]*\./g, "")
    .replace(/Each week: Tuesday learn, Thursday build it yourself, Sunday solve problems\./, "Each week: learn it, build it yourself, then solve problems.")
    .replace(/Same weekly rhythm: Tuesday learn, Thursday build, Sunday solve\./, "Same rhythm each week: learn, build, solve.")
    .trim();
const idOf = (track: Track, w: RawWeek) => w.id ?? legacyId(track, w.n!);
/** Position (from 1) of every week id, aliases included. */
const POS: Record<Track, Map<string, number>> = { main: new Map(), java: new Map() };
for (const t of TRACKS)
  RAW[t].forEach((w, i) => {
    POS[t].set(idOf(t, w), i + 1);
    for (const a of w.aliases ?? []) if (!POS[t].has(a)) POS[t].set(a, i + 1);
  });
/** A legacy number (meaning that M/J week) or an id string, to the week's current position. */
export const posOf = (t: Track, ref: number | string) => POS[t].get(typeof ref === "number" ? legacyId(t, ref) : ref);
const cleanGroup = (t: Track) => (g: Omit<Group, "weeks"> & { weeks: (number | string)[] }): Group => ({
  ...g,
  title: g.title.replace(/\s*\(Weeks.*\)$/, ""),
  goal: renumber(t, unday(g.goal)),
  milestone: renumber(t, unday(g.milestone)),
  weeks: [...new Set(g.weeks.map((x) => posOf(t, x)).filter((x): x is number => !!x))].sort((a, b) => a - b),
});
const GROUPS: Record<Track, Group[]> = { main: data.mainGroups.map(cleanGroup("main")), java: data.javaGroups.map(cleanGroup("java")) };

const links = (text: string): LinkRef[] => linksFor(text).map((l) => ({ label: l.label, url: l.url }));
const specs = (...a: Parameters<typeof specsFor>): SpecView[] => specsFor(...a).map((s) => ({ detail: s.detail, ...(s.links ? { links: s.links } : {}) }));

const QUIZ: Record<Track, Record<number, [string, string][]>> = { main: QUIZ_MAIN, java: QUIZ_JAVA };

function freeFor(text: string): LinkRef[] | undefined {
  const alts = linksFor(text).flatMap((l) => FREE_ALTERNATIVES[l.id] ?? []);
  return alts.length ? alts : undefined;
}

/**
 * Content refers to other weeks by their original number ("Week 7", "Main track week 13"). Weeks were
 * inserted and merged since, so each reference is rewritten to that week's current position.
 */
function renumber(track: Track, text: string): string {
  return text.replace(
    /\b(Main(?: track)? |Java(?: track)? |DSA track,? )?(Weeks?|weeks?) (\d+)(?:(-|–)(\d+))?\b/g,
    (all, pre: string | undefined, word: string, a: string, dash: string | undefined, b: string | undefined) => {
      const t: Track = pre?.startsWith("Main") ? "main" : pre?.startsWith("Java") || pre?.startsWith("DSA") ? "java" : track;
      const pa = posOf(t, Number(a));
      const pb = b ? posOf(t, Number(b)) : undefined;
      if (!pa || (b && !pb)) return all;
      return `${pre ?? ""}${word} ${pa}${b ? `${dash}${pb}` : ""}`;
    },
  );
}
/** Apply renumber to every string in a value, leaving ids, slugs, keys and URLs alone. */
function renumberAll<T>(track: Track, v: T): T {
  if (typeof v === "string") return renumber(track, v) as T;
  if (Array.isArray(v)) return v.map((x) => renumberAll(track, x)) as T;
  if (v && typeof v === "object")
    return Object.fromEntries(
      Object.entries(v).map(([k, x]) => [k, ["id", "aliases", "slug", "url", "day", "key"].includes(k) ? x : renumberAll(track, x)]),
    ) as T;
  return v;
}

/** Merge the briefs of a week and the weeks merged into it. */
function briefFor(ids: string[]): Brief | undefined {
  const all = ids.map((x) => BRIEFS[x]).filter((x): x is Brief => !!x);
  if (!all.length) return undefined;
  return { done: all.flatMap((x) => x.done), ...(all[0].stretch ? { stretch: all[0].stretch } : {}) };
}

function enrich(track: Track, w: RawWeek, i: number): Week {
  const id = idOf(track, w);
  const ids = [id, ...(w.aliases ?? [])];
  // Per-week data files are keyed by the id's number; a merged week also takes its old weeks' entries.
  const nums = ids.map((x) => Number(x.slice(1)) || 0);
  const specsAll = (where: "res" | "day", text: string) => nums.flatMap((num) => specs(track, num, where, text));
  const out: Week = {
    ...w,
    id,
    n: i + 1,
    mustKnow: w.mustKnow.map((m, j) => (EXPLAIN[`${id}:${j}`] ? { ...m, x: EXPLAIN[`${id}:${j}`] } : m)),
    quiz: nums.flatMap((num) => QUIZ[track][num] ?? []).map(([q, a]) => ({ q, a })),
    brief: briefFor(ids),
    problems: w.problems.map((p) => ({ ...p, hint: HINTS[p.slug] })),
    resources: w.resources.map((r) => ({
      ...r,
      links: links(r.text),
      specs: specsAll("res", r.text),
      ...(r.core && CORE_TIME[id] ? { time: CORE_TIME[id] } : {}),
      ...(freeFor(r.text) ? { free: freeFor(r.text) } : {}),
    })),
    checklist: w.checklist.map((c) => ({ ...c, links: links(c.text), specs: specsAll("day", c.day) })),
    after: w.after.map((a) => ({ text: a, links: links(a) })),
    sessions: w.sessions?.length ? w.sessions.map((x) => ({ ...x, links: links(x.text) })) : undefined,
  };
  return renumberAll(track, out);
}

const ENRICHED: Record<Track, Week[]> = { main: RAW.main.map((w, i) => enrich("main", w, i)), java: RAW.java.map((w, i) => enrich("java", w, i)) };

export function allWeeks(track: Track): Week[] {
  return ENRICHED[track];
}
export function weekFor(track: Track, n: number): Week | undefined {
  return ENRICHED[track][n - 1];
}

export function clientContent(): ClientContent {
  const tracks = TRACKS;
  const phaseSummary: ClientContent["phaseSummary"] = {};
  for (const t of tracks) for (const g of GROUPS[t]) if (PHASE_SUMMARY[g.id]) phaseSummary[g.id] = PHASE_SUMMARY[g.id];
  const phase2: Phase2SetView[] = PHASE2.map((set) => ({
    id: set.id,
    title: set.title,
    week: posOf("java", set.week) ?? 0,
    why: renumber("java", set.why),
    problems: set.problems.map((x): Problem => ({ slug: x.slug, name: x.name, note: "", difficulty: x.difficulty, phase2: true, hint: x.hint })),
  }));
  return {
    tracks,
    weeks: { main: ENRICHED.main, java: ENRICHED.java },
    groups: { main: GROUPS.main, java: GROUPS.java },
    phaseSummary,
    intros: { main: MAIN_INTRO, java: JAVA_INTRO },
    problems: [...ENRICHED.java.flatMap((w) => w.problems.map((p) => ({ ...p, week: w.n }))), ...phase2.flatMap((s) => s.problems.map((p) => ({ ...p, week: s.week })))],
    phase2,
    contest: renumberAll("java", { ...CONTEST_INFO, startAfterWeek: posOf("java", CONTEST_INFO.startAfterWeek) ?? CONTEST_INFO.startAfterWeek }),
    practiceRules: PRACTICE_RULES,
    urlNoteSections: URL_NOTE_SECTIONS,
    urlNoteTitle: "What happens when I type a URL",
    encouragement: ENCOURAGEMENT,
  };
}

/** "How it works" text, rewritten where it assumes both tracks. */
export function guideFor(tracks: Track[]) {
  const both = tracks.length > 1;
  const main = tracks.includes("main");
  const java = tracks.includes("java");
  const lead = both
    ? `Two tracks: a Main track of ${RAW.main.length} weeks (how software actually works, from your first program to the cloud) and a Java + DSA track of ${RAW.java.length} weeks.`
    : main
      ? `${RAW.main.length} weeks on how software actually works, from your first program to the cloud.`
      : `${RAW.java.length} weeks of Java, object-oriented design, Spring Boot, data structures and algorithms, starting from zero.`;
  const whatsDifferent = WHATS_DIFFERENT.map((x) =>
    !both && x.includes("Java week 1 assumes zero") ? "Nothing assumes knowledge you haven't built yet. Week 1 assumes zero." : x,
  );
  const hours = both ? "About 15-16 h a week" : main ? "About 9-10 h a week" : "About 7 h a week";
  const setupMain = SETUP_MAIN.map((x, i) => ({ x, i }))
    .filter(({ i }) => main || ![0, 2].includes(i))
    .map(({ x, i }) => ({
      i,
      x: !both && i === 0 ? "Create a GitHub repo called foundations for your builds and notes" : !both && i === 2 ? "Install VS Code" : x,
    }));
  const fallingBehind = FALLING_BEHIND.map((r) =>
    !both && r.title === "The minimum week"
      ? { ...r, text: "In a terrible week (illness, deadline at work), do just one session. A minimum week still counts. Zero weeks are the only thing to avoid." }
      : r,
  );
  return {
    lead,
    whatsDifferent,
    hours,
    setupMain,
    fallingBehind,
    mainIntro: MAIN_INTRO,
    javaIntro: main ? JAVA_INTRO : JAVA_INTRO.replace(" (about 6 hours a week), in parallel with the Main track", " (about 6 hours a week)"),
    whyJava: main ? WHY_JAVA : WHY_JAVA.filter((x) => !x.includes("Main track")),
    java,
  };
}
