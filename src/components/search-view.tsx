"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useContent } from "@/lib/content";
import { TRACK_LABEL, type Track } from "@/lib/roadmap";
import { TrackTag } from "./ui";

interface Doc {
  track: Track;
  n: number;
  kind: string;
  text: string;
  /** Extra searchable text that isn't displayed (chapter details, link labels). */
  extra: string;
  href: string;
  external?: boolean;
  weight: number;
}

/** Search across every week the person can see: titles, topics, resources, chapters, days, builds and problems. */
export function SearchView({ initial }: { initial: string }) {
  const c = useContent();
  const [q, setQ] = useState(initial);

  const docs = useMemo(() => {
    const out: Doc[] = [];
    for (const t of c.tracks) {
      for (const w of c.weeks[t] ?? []) {
        const href = `/${t}/${w.n}`;
        const add = (kind: string, text: string, weight: number, extra = "", h = href, external = false) => text && out.push({ track: t, n: w.n, kind, text, extra, href: h, external, weight });
        add("Week", w.title, 5, w.why);
        w.mustKnow.forEach((m) => {
          add("Must know", m.t, 3, m.c.join(" "));
          m.c.forEach((x) => add("Must know", x, 2));
        });
        w.niche.forEach((x) => add("Overlooked", x, 1));
        w.resources.forEach((r) => add("Resource", r.text, 3, [...r.links.map((l) => l.label), ...r.specs.flatMap((s) => [s.detail, ...(s.links ?? []).map((l) => l.label)])].join(" ")));
        w.checklist.forEach((d) => add(d.day, d.text, 2, d.specs.flatMap((s) => [s.detail, ...(s.links ?? []).map((l) => l.label)]).join(" ")));
        add("Build", w.build, 2, w.brief ? [...w.brief.done, w.brief.stretch ?? ""].join(" ") : "");
        w.quiz.forEach((q) => add("Self-check", q.q, 1, q.a));
        add("Done when", w.doneWhen, 2);
        w.problems.forEach((p) => add("Problem", p.name, 3, p.note, `https://leetcode.com/problems/${p.slug}/`, true));
      }
    }
    for (const set of c.phase2)
      for (const p of set.problems)
        out.push({ track: "java", n: set.week, kind: "Phase 2", text: p.name, extra: [set.title, p.difficulty ?? "", p.hint?.pattern ?? ""].join(" "), href: `https://leetcode.com/problems/${p.slug}/`, external: true, weight: 2 });
    return out;
  }, [c]);

  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const results = useMemo(() => {
    if (!terms.length) return [];
    const phrase = terms.join(" ");
    return docs
      .map((d) => {
        const text = d.text.toLowerCase();
        const all = text + " " + d.extra.toLowerCase();
        if (!terms.every((t) => all.includes(t))) return null;
        const score = d.weight + (text.includes(phrase) ? 4 : 0) + terms.filter((t) => text.includes(t)).length;
        return { d, score };
      })
      .filter((x): x is { d: Doc; score: number } => !!x)
      .sort((a, b) => b.score - a.score || a.d.n - b.d.n)
      .slice(0, 80)
      .map((x) => x.d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docs, q]);

  const update = (v: string) => {
    setQ(v);
    const u = new URL(window.location.href);
    if (v) u.searchParams.set("q", v);
    else u.searchParams.delete("q");
    window.history.replaceState(null, "", u);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Search</h1>
        <p className="mt-2 text-[15px] text-muted">
          Every topic, resource, chapter, build and problem{c.tracks.length > 1 ? " on both tracks" : ` on the ${TRACK_LABEL[c.tracks[0]]}`}. Press / or Ctrl K from anywhere.
        </p>
      </header>
      <input
        className="input !py-3 !text-base"
        autoFocus
        value={q}
        onChange={(e) => update(e.target.value)}
        placeholder="e.g. TCP, closures, binary search, chapter 9"
        aria-label="Search the plan"
      />
      {terms.length > 0 && (
        <p className="text-sm text-muted">
          {results.length === 0 ? "Nothing matches." : `${results.length === 80 ? "First 80" : results.length} result${results.length === 1 ? "" : "s"}`}
        </p>
      )}
      <div className="card divide-y divide-line">
        {results.map((d, i) => {
          const inner = (
            <>
              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                <TrackTag track={d.track} n={d.n} link={false} />
                <span>{d.kind}</span>
              </div>
              <div className="text-[15px] leading-relaxed">
                <Highlight text={d.text} terms={terms} />
              </div>
            </>
          );
          return d.external ? (
            <a key={i} href={d.href} target="_blank" rel="noopener noreferrer" className="block p-4 hover:bg-panel-2">
              {inner}
            </a>
          ) : (
            <Link key={i} href={d.href} className="block p-4 hover:bg-panel-2">
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <>{text}</>;
  const re = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return (
    <>
      {text.split(re).map((part, i) =>
        i % 2 ? (
          <mark key={i} className="rounded bg-accent-soft px-0.5 text-fg">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
