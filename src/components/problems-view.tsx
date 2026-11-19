"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useContent } from "@/lib/content";
import { customProblems, problemRec, problemStats, type ProblemRec } from "@/lib/progress";
import { setEntry, useHydrated, useStore, useToday } from "@/lib/store";
import { ProblemRow } from "./problem-row";
import { Bar, SectionTitle } from "./ui";

type Filter = "all" | ProblemRec["status"] | "due";

function slugFrom(input: string): string {
  const m = input.match(/leetcode\.com\/problems\/([a-z0-9-]+)/i);
  if (m) return m[1].toLowerCase();
  return input
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/[ -]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ProblemsView() {
  const c = useContent();
  const javaWeeks = c.weeks.java ?? [];
  const s = useStore();
  const h = useHydrated();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [week, setWeek] = useState(11);
  const now = useToday();
  const st = problemStats(s, now, c.problems);
  const custom = customProblems(s);
  const dueSet = useMemo(() => new Set(st.due.map((d) => d.slug)), [st.due]);

  const keep = (slug: string, nm: string) => {
    if (q && !nm.toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === "all") return true;
    if (filter === "due") return dueSet.has(slug);
    return problemRec(s, slug).status === filter;
  };

  const weeks = javaWeeks
    .map((w) => ({
      n: w.n,
      title: w.title,
      items: [...w.problems.map((p) => ({ ...p, custom: false })), ...custom.filter((c) => c.week === w.n).map((c) => ({ ...c, custom: true }))].filter((p) => keep(p.slug, p.name)),
    }))
    .filter((w) => w.items.length);
  const unassigned = custom.filter((c) => !c.week || !javaWeeks.some((w) => w.n === c.week)).filter((p) => keep(p.slug, p.name));

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = slugFrom(name.trim());
    if (!slug) return;
    const nice = name.includes("leetcode.com") ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : name.trim();
    setEntry(`cp:${slug}`, { name: nice, week });
    setName("");
  };

  const FILTERS: { v: Filter; label: string; count?: number }[] = [
    { v: "all", label: "All", count: st.total },
    { v: "todo", label: "To do", count: st.total - st.solved - st.helped - st.stuck },
    { v: "solved", label: "Solved", count: st.solved },
    { v: "helped", label: "Needed help", count: st.helped },
    { v: "stuck", label: "Stuck", count: st.stuck },
    { v: "due", label: "Re-solve due", count: st.due.length },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Problem tracker</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-muted">
          Every LeetCode problem from weeks 11-34, linked. Mark each one Solved or Needed help; anything you needed help with comes back for a re-solve 3 days and 2 weeks later.
        </p>
      </header>

      <section className="card p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-3xl font-semibold tabular-nums">{h ? st.attempted : 0}</div>
            <div className="text-xs text-muted">problems done · track goal is roughly 180-200</div>
          </div>
          <div className="flex gap-4 text-sm">
            <span>
              <b className="text-ok">{h ? st.solved : 0}</b> solved alone
            </span>
            <span>
              <b className="text-warn">{h ? st.helped : 0}</b> with help
            </span>
            <span>
              <b className="text-danger">{h ? st.stuck : 0}</b> stuck
            </span>
          </div>
        </div>
        <Bar value={h ? Math.min(1, st.attempted / 190) : 0} track="ok" className="mt-3" />
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button key={f.v} onClick={() => setFilter(f.v)} className={`chip ${filter === f.v ? "!border-accent !text-accent" : ""}`}>
              {f.label}
              {h && f.count !== undefined && <span className="text-muted">{f.count}</span>}
            </button>
          ))}
        </div>
        <input className="input sm:ml-auto sm:max-w-56" placeholder="Search problems" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search problems" />
      </div>

      {weeks.map((w) => (
        <section key={w.n} className="card px-5 py-3">
          <div className="flex items-baseline justify-between gap-2 pt-1">
            <Link href={`/java/${w.n}`} className="font-semibold hover:text-accent">
              Week {w.n}: {w.title}
            </Link>
          </div>
          {w.items.map((p) => (
            <div key={p.slug} className="flex items-center gap-2">
              <div className="flex-1">
                <ProblemRow slug={p.slug} name={p.name} note={p.note} />
              </div>
              {p.custom && (
                <button className="text-xs text-muted hover:text-danger" onClick={() => setEntry(`cp:${p.slug}`, null)} aria-label={`Remove ${p.name}`}>
                  ✕
                </button>
              )}
            </div>
          ))}
        </section>
      ))}
      {unassigned.length > 0 && (
        <section className="card px-5 py-3">
          <div className="pt-1 font-semibold">Other problems</div>
          {unassigned.map((p) => (
            <ProblemRow key={p.slug} slug={p.slug} name={p.name} note={p.note} />
          ))}
        </section>
      )}
      {h && weeks.length === 0 && unassigned.length === 0 && <p className="text-muted">Nothing matches this filter.</p>}

      <section className="card p-5">
        <SectionTitle>Add a problem</SectionTitle>
        <p className="mb-3 text-sm text-muted">Extra practice from Striver&apos;s A2Z sheet or NeetCode counts toward your 180-200. Paste a LeetCode URL or type its exact title.</p>
        <form onSubmit={add} className="flex flex-col gap-2 sm:flex-row">
          <input className="input flex-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jump Game III or https://leetcode.com/problems/…" aria-label="Problem name or URL" />
          <select className="input sm:w-40" value={week} onChange={(e) => setWeek(Number(e.target.value))} aria-label="Week">
            {javaWeeks.map((w) => (
              <option key={w.n} value={w.n}>
                Week {w.n}
              </option>
            ))}
          </select>
          <button className="btn btn-primary justify-center">Add</button>
        </form>
      </section>

      <section className="card p-5">
        <SectionTitle>Practice rules for every problem</SectionTitle>
        <ol className="list-decimal space-y-1.5 pl-5 text-[15px] leading-relaxed">
          {c.practiceRules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
