"use client";

import Link from "next/link";
import { TRACK_LABEL, keys, type Brief, type SpecView, type Track } from "@/lib/roadmap";
import { getWeek, groupOf, useContent } from "@/lib/content";
import { weekProgress } from "@/lib/progress";
import { useHydrated, useStore } from "@/lib/store";
import { dayKey, fmtShort, parseDate } from "@/lib/schedule";
import { usePlan } from "@/lib/use-plan";
import { SessionItem } from "./session-row";
import { CheckRow, Ring, SectionTitle } from "./ui";
import { ProblemRow } from "./problem-row";
import { NoteBox } from "./notes";
import { QuizCard } from "./quiz";

export function WeekView({ track, n }: { track: Track; n: number }) {
  const c = useContent();
  const w = getWeek(c, track, n)!;
  const s = useStore();
  const hydrated = useHydrated();
  const p = weekProgress(s, track, w);
  const group = groupOf(c, track, n);
  const isLastOfGroup = group && group.weeks[group.weeks.length - 1] === n;
  const live = usePlan();
  const planned = new Map(live?.plan.planned.map((x) => [x.key, x.date]) ?? []);
  const mine = live ? live.plan.sessions.filter((x) => x.n === n && (x.track === track || x.track === "review")) : [];
  const dates = mine.map((x) => live!.plan.doneOn.get(x.key) ?? planned.get(x.key)).filter(Boolean).sort() as string[];
  const todayKey = live ? dayKey(live.today) : "";
  const inThisWeek = live?.plan.planned.find((x) => x.track === track)?.n === n;
  const other: Track | undefined = c.tracks.find((t) => t !== track);
  const color = track;

  return (
    <article className="space-y-6">
      {/* header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className={`rounded-md px-2 py-0.5 font-semibold ${track === "main" ? "bg-main-soft text-main" : "bg-java-soft text-java"}`}>{TRACK_LABEL[track]}</span>
            {group && (
              <span>
                {group.id}: {group.title.replace(/\s*\(Weeks.*\)$/, "")}
              </span>
            )}
            {hydrated && dates.length > 0 && (
              <span>
                · {fmtShort(parseDate(dates[0]))} – {fmtShort(parseDate(dates[dates.length - 1]))}
              </span>
            )}
            {inThisWeek && <span className="rounded-md bg-accent-soft px-2 py-0.5 font-semibold text-accent">You are here</span>}
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            <span className="text-muted">Week {n}.</span> {w.title}
          </h1>
          {w.why && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">{w.why.charAt(0).toUpperCase() + w.why.slice(1)}</p>}
        </div>
        <div className="flex items-center gap-3 sm:flex-col sm:items-end">
          <Ring value={hydrated ? p.ratio : 0} track={track} size={72} />
          <div className="text-xs text-muted">
            {hydrated ? `${p.done}/${p.total} required` : " "}
            {hydrated && p.passed && <span className="ml-1 font-semibold text-ok">· passed</span>}
          </div>
        </div>
      </header>

      <nav className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          {n > 1 && (
            <Link className="btn" href={`/${track}/${n - 1}`}>
              ← Week {n - 1}
            </Link>
          )}
          {n < 36 && (
            <Link className="btn" href={`/${track}/${n + 1}`}>
              Week {n + 1} →
            </Link>
          )}
        </div>
        {other && (
          <Link className="text-sm text-muted hover:text-fg" href={`/${other}/${n}`}>
            Same week on {TRACK_LABEL[other]} →
          </Link>
        )}
      </nav>

      {/* sessions */}
      <section className="card p-5">
        <SectionTitle hint="Planned from your weekly rhythm">Sessions</SectionTitle>
        <div className="divide-y divide-line">
          {mine.map((x) => {
            const doneOn = live?.plan.doneOn.get(x.key);
            const on = planned.get(x.key);
            return (
              <div key={x.key} className={`-mx-2 flex gap-3 rounded-lg px-2 ${on === todayKey ? "bg-accent-soft/60" : ""}`}>
                <div className="w-14 shrink-0 pt-3 text-xs text-muted">
                  {hydrated && (doneOn ? <span className="font-semibold text-ok">Done {fmtShort(parseDate(doneOn))}</span> : on ? (on === todayKey ? <span className="font-semibold text-accent">Today</span> : fmtShort(parseDate(on))) : null)}
                </div>
                <div className="min-w-0 flex-1">
                  <SessionItem x={x} />
                </div>
              </div>
            );
          })}
        </div>
        {w.problemNote && <p className="mt-3 text-sm text-muted">{w.problemNote}</p>}
      </section>

      {/* build */}
      {w.build && (
        <section className="card p-5">
          <SectionTitle hint="Build session">Build it yourself</SectionTitle>
          <CheckRow k={keys.build(track, n)} color={color}>
            {w.build.charAt(0).toUpperCase() + w.build.slice(1)}
          </CheckRow>
          {w.brief && <BriefView brief={w.brief} />}
        </section>
      )}

      {/* Main-track builds live in the build sessions; their brief gets its own card. */}
      {!w.build && w.brief && (
        <section className="card p-5">
          <SectionTitle hint="Build sessions">Build brief</SectionTitle>
          <p className="text-[15px] leading-relaxed">{w.checklist.find((d) => d.day === "Sat")?.text}</p>
          <BriefView brief={w.brief} />
        </section>
      )}

      {/* problems */}
      {w.problems.length > 0 && (
        <section className="card p-5">
          <SectionTitle hint={<Link href="/problems" className="hover:text-fg">All problems →</Link>}>Practice problems ({w.problems.length})</SectionTitle>
          <p className="mb-1 text-xs text-muted">Links open LeetCode. If one is locked, Striver&apos;s A2Z sheet has the same pattern. Marking “Needed help” schedules re-solves in 3 days and 2 weeks.</p>
          {w.problems.map((pr) => (
            <ProblemRow key={pr.slug} {...pr} />
          ))}
          {track === "java" &&
            c.phase2
              .filter((set) => set.week === w.n)
              .map((set) => (
                <Link key={set.id} href={`/problems#p2-${set.id}`} className="mt-3 block text-sm text-muted hover:text-fg">
                  Phase 2: {set.problems.length} harder problems on this topic, for later →
                </Link>
              ))}
        </section>
      )}

      {/* must know */}
      {w.mustKnow.length > 0 && (
        <section className="card p-5">
          <SectionTitle hint="Learn all of it">Must know</SectionTitle>
          <div className="space-y-1">
            {w.mustKnow.map((m, i) =>
              m.c.length ? (
                <div key={i} className="pt-2">
                  <div className="text-[15px] font-semibold">{m.t}</div>
                  <div className="ml-1 border-l border-line pl-4">
                    {m.c.map((c, j) => (
                      <CheckRow key={j} k={keys.must(track, n, i, j)} color={color}>
                        {c}
                      </CheckRow>
                    ))}
                  </div>
                </div>
              ) : (
                <CheckRow key={i} k={keys.must(track, n, i)} color={color}>
                  {m.t}
                </CheckRow>
              ),
            )}
          </div>
        </section>
      )}

      {/* niche */}
      {w.niche.length > 0 && (
        <section className="card p-5">
          <SectionTitle hint="Read, note, come back later. Optional now.">Overlooked / niche</SectionTitle>
          {w.niche.map((t, i) => (
            <CheckRow key={i} k={keys.niche(track, n, i)} color="ok" muted>
              {t}
            </CheckRow>
          ))}
        </section>
      )}

      {/* resources */}
      {w.resources.length > 0 && (
        <section className="card p-5">
          <SectionTitle hint="⭐ = do this one first">Resources</SectionTitle>
          {w.resources.map((r, i) => (
            <div key={i}>
              <CheckRow k={keys.res(track, n, i)} color="ok" links={r.links}>
                {(r.core ? "⭐ " : "") + r.text}
              </CheckRow>
              <Specifics specs={r.specs} />
              {(r.time || r.free) && (
                <div className="mb-2 ml-8 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                  {r.time && <span className="chip">⏱ {r.time}</span>}
                  {r.free && (
                    <>
                      <span>Paid book. Free alternative:</span>
                      {r.free.map((l) => (
                        <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="chip">
                          {l.label} <span className="opacity-60">↗</span>
                        </a>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* done when */}
      {w.doneWhen && (
        <section className="card border-2 p-5" style={{ borderColor: p.passed ? "var(--ok)" : undefined }}>
          <SectionTitle hint="Pass it and move on">Done when</SectionTitle>
          <CheckRow k={keys.done(track, n)} color="ok">
            {"You can " + w.doneWhen.replace(/^you can /i, "")}
          </CheckRow>
        </section>
      )}

      {/* self-check */}
      {w.quiz.length > 0 && (
        <section className="card px-5 pb-2 pt-5">
          <SectionTitle hint={<Link href="/review" className="hover:text-fg">Review due questions →</Link>}>Self-check ({w.quiz.length})</SectionTitle>
          <p className="text-xs text-muted">Answer from memory first, out loud or on paper. Then reveal and rate yourself; anything shaky comes back for review.</p>
          {w.quiz.map((q, i) => (
            <QuizCard key={i} k={keys.quiz(track, n, i)} q={q.q} a={q.a} />
          ))}
        </section>
      )}

      {/* milestone */}
      {isLastOfGroup && group && (group.milestone || c.phaseSummary[group.id]) && (
        <section className="card bg-panel-2 p-5">
          <SectionTitle>{group.id} milestone</SectionTitle>
          <p className="text-[15px] leading-relaxed">{group.milestone || c.phaseSummary[group.id]?.milestone}</p>
          <div className="mt-3">
            <CheckRow k={`ms:${track}:${group.id}`} color="ok">
              Milestone complete
            </CheckRow>
          </div>
        </section>
      )}

      {/* notes */}
      <section className="card p-5">
        <SectionTitle hint="Write it after the week's last session">Your notes</SectionTitle>
        <p className="mb-2 text-xs text-muted">“Today I learned X. It exists because Y. It works by Z. I&apos;m still confused about W.”</p>
        <NoteBox k={keys.note(track, n)} placeholder={track === "main" ? "Explain this week to a junior…" : "What clicked, what didn't, patterns you noticed…"} />
      </section>

      {w.after.length > 0 && (
        <section className="card p-5">
          <SectionTitle>After week 36</SectionTitle>
          {track === "main" && <p className="mb-2 text-sm text-muted">Pick 1-2 per quarter, not all at once.</p>}
          {w.after.map((a, i) => (
            <CheckRow key={i} k={`af:${track}:${i}`} color="ok" links={a.links}>
              {a.text}
            </CheckRow>
          ))}
        </section>
      )}

      {w.extra.length > 0 && (
        <section className="card p-5 text-sm text-muted">
          {w.extra.map((e, i) => (
            <p key={i}>{e}</p>
          ))}
        </section>
      )}

    </article>
  );
}

/** Exact chapters/sections for a resource or day, shown under the item. */
export function Specifics({ specs }: { specs: SpecView[] }) {
  if (!specs.length) return null;
  return (
    <div className="mb-2 ml-8 rounded-lg bg-panel-2 px-3 py-2 text-[13px] leading-relaxed">
      {specs.map((s, i) => (
        <div key={i}>
          {s.detail && (
            <p>
              <span className="mr-1" aria-hidden>
                📖
              </span>
              {s.detail}
            </p>
          )}
          {s.links && s.links.length > 0 && (
            <div className={`flex flex-wrap gap-1.5 ${s.detail ? "mt-1.5" : ""}`}>
              {!s.detail && (
                <span className="mr-0.5 self-center" aria-hidden>
                  📖
                </span>
              )}
              {s.links.map((l) => (
                <a key={l.url + l.label} href={l.url} target="_blank" rel="noopener noreferrer" className="chip !bg-panel">
                  {l.label} <span className="opacity-60">↗</span>
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/** What "done" means for a build, plus one stretch goal. */
function BriefView({ brief }: { brief: Brief }) {
  return (
    <div className="mt-3 rounded-lg bg-panel-2 px-4 py-3 text-[14px] leading-relaxed">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">Done means</div>
      <ul className="list-disc space-y-1 pl-5">
        {brief.done.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
      {brief.stretch && (
        <p className="mt-2">
          <span className="font-semibold">Stretch:</span> {brief.stretch}
        </p>
      )}
    </div>
  );
}
