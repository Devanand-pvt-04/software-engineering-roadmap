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
import { BRIEFS } from "@/data/briefs";
import { CORE_TIME, FREE_ALTERNATIVES } from "@/data/estimates";
import { CONTEST_INFO, PHASE2 } from "@/data/phase2";
import type { Day } from "@/lib/constants";
import type { ClientContent } from "@/lib/content";
import { TRACKS, legacyId, type Group, type LinkRef, type Phase2SetView, type Problem, type Track, type Week, type SpecView } from "@/lib/roadmap";

interface RawWeek extends Omit<Week, "id" | "n" | "resources" | "checklist" | "after" | "quiz" | "brief" | "sessions"> {
  /** Stable id; defaults to M<n> / J<n> from the legacy number. */
  id?: string;
  /** Legacy week number from the original plan. Position comes from array order. */
  n?: number;
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
    for (const a of (w as { aliases?: string[] }).aliases ?? []) if (!POS[t].has(a)) POS[t].set(a, i + 1);
  });
/** A legacy number (meaning that M/J week) or an id string, to the week's current position. */
export const posOf = (t: Track, ref: number | string) => POS[t].get(typeof ref === "number" ? legacyId(t, ref) : ref);
const cleanGroup = (t: Track) => (g: Omit<Group, "weeks"> & { weeks: (number | string)[] }): Group => ({
  ...g,
  title: g.title.replace(/\s*\(Weeks.*\)$/, ""),
  goal: unday(g.goal),
  milestone: unday(g.milestone),
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

function enrich(track: Track, w: RawWeek, i: number): Week {
  const id = idOf(track, w);
  const num = Number(id.slice(1)) || 0; // per-week data files are keyed by the id's number
  return {
    ...w,
    id,
    n: i + 1,
    quiz: (QUIZ[track][num] ?? []).map(([q, a]) => ({ q, a })),
    brief: BRIEFS[id],
    problems: w.problems.map((p) => ({ ...p, hint: HINTS[p.slug] })),
    resources: w.resources.map((r) => ({
      ...r,
      links: links(r.text),
      specs: specs(track, num, "res", r.text),
      ...(r.core && CORE_TIME[id] ? { time: CORE_TIME[id] } : {}),
      ...(freeFor(r.text) ? { free: freeFor(r.text) } : {}),
    })),
    checklist: w.checklist.map((c) => ({ ...c, links: links(c.text), specs: specs(track, num, "day", c.day, c.text) })),
    after: w.after.map((a) => ({ text: a, links: links(a) })),
    sessions: w.sessions?.length ? w.sessions.map((x) => ({ ...x, links: links(x.text) })) : undefined,
  };
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
    why: set.why,
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
    contest: CONTEST_INFO,
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
    ? "Two tracks for 36 weeks: a Main track (how software actually works, from the CPU to Kubernetes) and a Java + DSA track."
    : main
      ? "36 weeks on how software actually works, from the CPU to Kubernetes."
      : "36 weeks of Java, object-oriented programming, data structures and algorithms, starting from zero.";
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
