"use client";

import { keys } from "@/lib/roadmap";
import { problemRec, reviewDue, type ProblemRec } from "@/lib/progress";
import { setEntry, useStore, useToday } from "@/lib/store";
import { dayKey } from "@/lib/schedule";
import Link from "next/link";

const STATUS: { v: ProblemRec["status"]; label: string; cls: string }[] = [
  { v: "todo", label: "To do", cls: "" },
  { v: "solved", label: "Solved", cls: "bg-ok-soft text-ok border-ok" },
  { v: "helped", label: "Needed help", cls: "bg-warn-soft text-warn border-warn" },
  { v: "stuck", label: "Stuck", cls: "bg-panel-2 text-danger border-danger" },
];

const leetcodeUrl = (slug: string) => `https://leetcode.com/problems/${slug}/`;

export function ProblemRow({ slug, name, note, week, showWeek }: { slug: string; name: string; note?: string; week?: number; showWeek?: boolean }) {
  const s = useStore();
  const rec = problemRec(s, slug);
  const due = reviewDue(rec);
  const now = useToday();
  const today = now ? dayKey(now) : "9999-12-31";
  const set = (patch: Partial<ProblemRec>) => setEntry(keys.problem(slug), { ...rec, ...patch });
  const setStatus = (status: ProblemRec["status"]) => {
    const firstAt = status === "todo" ? undefined : rec.firstAt ?? today;
    set({ status, firstAt, reviews: status === "helped" ? rec.reviews ?? [] : rec.reviews });
  };
  return (
    <div className="flex flex-col gap-2 border-b border-line py-3 last:border-0 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <a href={leetcodeUrl(slug)} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-accent">
          {name}
          <span className="ml-1 text-xs text-muted">↗</span>
        </a>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
          {showWeek && week && (
            <Link href={`/java/${week}`} className="hover:text-fg">
              Week {week}
            </Link>
          )}
          {note && <span className="italic">{note}</span>}
          {due.due && (
            <span className={due.due <= today ? "font-semibold text-warn" : ""}>
              Re-solve {due.stage === 0 ? "#1 (3 days)" : "#2 (2 weeks)"} {due.due <= today ? "due now" : `on ${due.due}`}
            </span>
          )}
          {due.due && due.due <= today && (
            <button className="underline hover:text-fg" onClick={() => set({ reviews: [...(rec.reviews ?? []), today] })}>
              Mark re-solved
            </button>
          )}
          {rec.status === "helped" && due.stage === 2 && <span className="text-ok">Both re-solves done</span>}
        </div>
      </div>
      <div className="flex flex-wrap gap-1" role="radiogroup" aria-label={`Status for ${name}`}>
        {STATUS.map((st) => (
          <button
            key={st.v}
            role="radio"
            aria-checked={rec.status === st.v}
            onClick={() => setStatus(st.v)}
            className={`rounded-md border px-2 py-1 text-xs ${rec.status === st.v ? st.cls || "border-muted bg-panel-2" : "border-line text-muted hover:text-fg"}`}
          >
            {st.label}
          </button>
        ))}
      </div>
    </div>
  );
}
