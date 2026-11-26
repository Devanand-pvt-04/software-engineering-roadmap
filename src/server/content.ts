import "server-only";
import data from "@/data/roadmap.json";
import {
  ENCOURAGEMENT, FALLING_BEHIND, GLOSSARY, JAVA_INTRO, MAIN_INTRO, PHASE_SUMMARY, PRACTICE_RULES, SCHEDULE, SETUP_MAIN, URL_NOTE_SECTIONS, WHATS_DIFFERENT, WHY_JAVA,
} from "@/data/guide";
import { linksFor } from "@/data/links";
import { specsFor } from "@/data/specifics";
import { QUIZ_MAIN } from "@/data/quiz-main";
import { QUIZ_JAVA } from "@/data/quiz-java";
import { HINTS } from "@/data/hints";
import { BRIEFS } from "@/data/briefs";
import { CORE_TIME, FREE_ALTERNATIVES } from "@/data/estimates";
import { CONTEST_INFO, PHASE2 } from "@/data/phase2";
import { EXPLAIN } from "@/data/explain";
import type { Day } from "@/lib/constants";
import type { ClientContent, Role, ScheduleRow } from "@/lib/content";
import type { FeatureId } from "@/lib/features";
import type { Group, LinkRef, Phase2SetView, Problem, Track, Week, SpecView } from "@/lib/roadmap";

interface RawWeek extends Omit<Week, "resources" | "checklist" | "after" | "quiz" | "brief"> {
  resources: { text: string; core: boolean }[];
  checklist: { day: Day; text: string }[];
  after: string[];
}

const RAW: Record<Track, RawWeek[]> = { main: data.main as RawWeek[], java: data.java as RawWeek[] };
const GROUPS: Record<Track, Group[]> = { main: data.mainGroups as Group[], java: data.javaGroups as Group[] };

const links = (text: string): LinkRef[] => linksFor(text).map((l) => ({ label: l.label, url: l.url }));
const specs = (...a: Parameters<typeof specsFor>): SpecView[] => specsFor(...a).map((s) => ({ detail: s.detail, ...(s.links ? { links: s.links } : {}) }));

const QUIZ: Record<Track, Record<number, [string, string][]>> = { main: QUIZ_MAIN, java: QUIZ_JAVA };

function freeFor(text: string): LinkRef[] | undefined {
  const alts = linksFor(text).flatMap((l) => FREE_ALTERNATIVES[l.id] ?? []);
  return alts.length ? alts : undefined;
}

function enrich(track: Track, w: RawWeek): Week {
  const id = `${track === "main" ? "M" : "J"}${w.n}`;
  return {
    ...w,
    mustKnow: w.mustKnow.map((m, i) => (EXPLAIN[`${id}:${i}`] ? { ...m, x: EXPLAIN[`${id}:${i}`] } : m)),
    quiz: (QUIZ[track][w.n] ?? []).map(([q, a]) => ({ q, a })),
    brief: BRIEFS[id],
    problems: w.problems.map((p) => ({ ...p, hint: HINTS[p.slug] })),
    resources: w.resources.map((r) => ({
      ...r,
      links: links(r.text),
      specs: specs(track, w.n, "res", r.text),
      ...(r.core && CORE_TIME[id] ? { time: CORE_TIME[id] } : {}),
      ...(freeFor(r.text) ? { free: freeFor(r.text) } : {}),
    })),
    checklist: w.checklist.map((c) => ({ ...c, links: links(c.text), specs: specs(track, w.n, "day", c.day) })),
    after: w.after.map((a) => ({ text: a, links: links(a) })),
  };
}

const ENRICHED: Record<Track, Week[]> = { main: RAW.main.map((w) => enrich("main", w)), java: RAW.java.map((w) => enrich("java", w)) };

export function tracksFor(features: FeatureId[]): Track[] {
  return (["main", "java"] as Track[]).filter((t) => features.includes(`track:${t}`));
}

export function allWeeks(track: Track): Week[] {
  return ENRICHED[track];
}
export function weekFor(track: Track, n: number): Week | undefined {
  return ENRICHED[track][n - 1];
}

function scheduleFor(tracks: Track[]): ScheduleRow[] {
  const both = tracks.length === 2;
  const rows: ScheduleRow[] = [];
  for (const r of SCHEDULE) {
    const t: Track = r.track.startsWith("Main") ? "main" : "java";
    if (r.day === "Sun") {
      if (both) rows.push({ day: r.day, track: "java", label: r.track, time: r.time, what: r.what });
      else if (tracks[0] === "java")
        rows.push({ day: r.day, track: "java", label: r.track, time: r.time, what: "Practice problems; then 1 h: the week's Done-when test, tick boxes, plan next week." });
      else rows.push({ day: r.day, track: "review", label: "Review", time: "1 h", what: "The week's Done-when test, tick boxes, plan next week." });
      continue;
    }
    if (tracks.includes(t)) rows.push({ day: r.day, track: t, label: r.track, time: r.time, what: r.what });
  }
  return rows;
}

export function clientContent(opts: { role: Role; login: string | null; previewAs: string | null; features: FeatureId[] }): ClientContent {
  const tracks = tracksFor(opts.features);
  const weeks: ClientContent["weeks"] = {};
  const groups: ClientContent["groups"] = {};
  const phaseSummary: ClientContent["phaseSummary"] = {};
  const quizzes = opts.features.includes("quizzes");
  const hints = opts.features.includes("hints");
  const slice = (w: Week): Week => ({
    ...w,
    quiz: quizzes ? w.quiz : [],
    problems: hints ? w.problems : w.problems.map((p) => ({ slug: p.slug, name: p.name, note: p.note })),
  });
  for (const t of tracks) {
    weeks[t] = ENRICHED[t].map(slice);
    groups[t] = GROUPS[t];
    for (const g of GROUPS[t]) if (PHASE_SUMMARY[g.id]) phaseSummary[g.id] = PHASE_SUMMARY[g.id];
  }
  const java = tracks.includes("java");
  const main = tracks.includes("main");
  const problemsOn = java && opts.features.includes("problems");
  const phase2: Phase2SetView[] =
    problemsOn && opts.features.includes("phase2")
      ? PHASE2.map((set) => ({
          id: set.id,
          title: set.title,
          week: set.week,
          why: set.why,
          problems: set.problems.map((x): Problem => ({ slug: x.slug, name: x.name, note: "", difficulty: x.difficulty, phase2: true, ...(hints ? { hint: x.hint } : {}) })),
        }))
      : [];
  const isOwner = opts.role === "owner" || opts.role === "open";
  return {
    role: opts.role,
    login: opts.login,
    previewAs: opts.previewAs,
    tracks,
    features: opts.features,
    weeks,
    groups,
    phaseSummary,
    schedule: scheduleFor(tracks),
    problems: problemsOn
      ? [...(weeks.java ?? []).flatMap((w) => w.problems.map((p) => ({ ...p, week: w.n }))), ...phase2.flatMap((s) => s.problems.map((p) => ({ ...p, week: s.week })))]
      : [],
    phase2,
    contest: problemsOn && opts.features.includes("contests") ? CONTEST_INFO : null,
    practiceRules: java ? PRACTICE_RULES : [],
    urlNoteSections: main && opts.features.includes("journal") ? URL_NOTE_SECTIONS : [],
    urlNoteTitle: main ? "What happens when I type a URL" : "",
    // Written for the plan's original reader, so only they see it.
    encouragement: isOwner && !opts.previewAs ? ENCOURAGEMENT : null,
  };
}

export function glossaryFor(tracks: Track[]) {
  const ok = (w: string) => tracks.includes(w[0] === "M" ? "main" : "java");
  return GLOSSARY.map((g) => ({ ...g, weeks: g.weeks.filter(ok) })).filter((g) => g.weeks.length);
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
