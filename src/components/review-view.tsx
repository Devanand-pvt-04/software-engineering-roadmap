"use client";

import Link from "next/link";
import { useContent } from "@/lib/content";
import { dueCards, quizRec } from "@/lib/quiz";
import { dayKey } from "@/lib/schedule";
import { keys } from "@/lib/roadmap";
import { useStore, useToday } from "@/lib/store";
import { TrackTag } from "./ui";
import { QuizCard } from "./quiz";

/** Every self-check question that's due for another go today. */
export function ReviewView() {
  const s = useStore();
  const c = useContent();
  const now = useToday();
  if (!now) return <div className="h-96" />;
  const due = dueCards(s, c, dayKey(now));
  let answered = 0;
  let total = 0;
  for (const t of c.tracks)
    for (const w of c.weeks[t] ?? [])
      w.quiz.forEach((_, i) => {
        total++;
        if (quizRec(s, keys.quiz(t, w.n, i))) answered++;
      });
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Review</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-muted">
          Self-check questions you&apos;ve answered come back on a schedule: tomorrow if you missed them, then 3, 7, 21 and 60 days as you keep getting them. Answer before you
          reveal.
        </p>
        <p className="mt-2 text-sm text-muted">
          {answered} of {total} questions answered so far. Each week&apos;s questions are at the bottom of its page.
        </p>
      </header>
      {due.length === 0 ? (
        <section className="card p-5 text-[15px]">Nothing due today. New questions are waiting on each week&apos;s page under Self-check.</section>
      ) : (
        <section className="card px-5 py-2">
          {due.map((d) => (
            <QuizCard
              key={d.key}
              k={d.key}
              q={d.q}
              a={d.a}
              label={
                <span className="flex flex-wrap items-center gap-2">
                  <TrackTag track={d.track} n={d.n} />
                  <Link href={`/${d.track}/${d.n}`} className="hover:text-fg">
                    {d.title}
                  </Link>
                </span>
              }
            />
          ))}
        </section>
      )}
    </div>
  );
}
