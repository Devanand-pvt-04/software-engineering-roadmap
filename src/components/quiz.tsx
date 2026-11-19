"use client";

import { useState } from "react";
import { dueOn, quizRec, rate, type Rating } from "@/lib/quiz";
import { dayKey } from "@/lib/schedule";
import { setEntry, useStore, useToday } from "@/lib/store";

const RATINGS: { r: Rating; label: string; cls: string }[] = [
  { r: "got", label: "Got it", cls: "border-ok text-ok bg-ok-soft" },
  { r: "shaky", label: "Shaky", cls: "border-warn text-warn bg-warn-soft" },
  { r: "missed", label: "Missed it", cls: "border-danger text-danger bg-panel-2" },
];

/** One question: answer it in your head (or on paper), reveal the model answer, rate yourself. */
export function QuizCard({ k, q, a, label }: { k: string; q: string; a: string; label?: React.ReactNode }) {
  const s = useStore();
  const now = useToday();
  const [open, setOpen] = useState(false);
  const rec = quizRec(s, k);
  const today = now ? dayKey(now) : "";
  return (
    <div className="border-b border-line py-3 last:border-0">
      {label && <div className="mb-1 text-xs text-muted">{label}</div>}
      <div className="flex gap-3">
        <div className="min-w-0 flex-1 text-[15px] font-medium leading-relaxed">{q}</div>
        {rec && (
          <span className={`h-fit shrink-0 rounded-md border px-2 py-0.5 text-xs ${RATINGS.find((x) => x.r === rec.last)!.cls}`} title={`Next review ${dueOn(rec)}`}>
            {RATINGS.find((x) => x.r === rec.last)!.label}
          </span>
        )}
      </div>
      {!open ? (
        <button className="mt-2 text-sm text-accent hover:underline" onClick={() => setOpen(true)}>
          Show answer
        </button>
      ) : (
        <>
          <p className="mt-2 rounded-lg bg-panel-2 px-3 py-2 text-[15px] leading-relaxed">{a}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs text-muted">How did you do?</span>
            {RATINGS.map((x) => (
              <button
                key={x.r}
                onClick={() => {
                  setEntry(k, rate(rec, x.r, today));
                  setOpen(false);
                }}
                className={`rounded-md border px-2.5 py-1 text-xs ${rec?.last === x.r && rec.at === today ? x.cls : "border-line text-muted hover:text-fg"}`}
              >
                {x.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
