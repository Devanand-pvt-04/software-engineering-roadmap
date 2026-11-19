"use client";

import Link from "next/link";
import { GROUPS, TRACK_LABEL, keys, type Track, type Week, getWeek } from "@/lib/roadmap";
import { weekProgress } from "@/lib/progress";
import { useHydrated, useSettings, useStore, useToday } from "@/lib/store";
import { addDays, fmtShort, weekStartFor, weekday } from "@/lib/schedule";
import { PHASE_SUMMARY } from "@/data/guide";
import { CheckRow, Ring, SectionTitle } from "./ui";
import { ProblemRow } from "./problem-row";
import { NoteBox } from "./notes";
import { specsFor, type Spec } from "@/data/specifics";

const DAY_OFFSET: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

export function WeekView({ track, n }: { track: Track; n: number }) {
  const w = getWeek(track, n) as Week;
  const s = useStore();
  const hydrated = useHydrated();
  const cfg = useSettings();
  const p = weekProgress(s, track, w);
  const group = GROUPS[track].find((g) => g.weeks.includes(n));
  const isLastOfGroup = group && group.weeks[group.weeks.length - 1] === n;
  const start = weekStartFor(n, cfg.start, cfg.slide, cfg.buffers);
  const today = useToday();
  const todayName = today ? weekday(today) : "";
  const inThisWeek = !!today && today >= start && today < addDays(start, 7);
  const other: Track = track === "main" ? "java" : "main";
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
            {hydrated && (
              <span>
                · {fmtShort(start)} – {fmtShort(addDays(start, 6))}
              </span>
            )}
            {inThisWeek && <span className="rounded-md bg-accent-soft px-2 py-0.5 font-semibold text-accent">This week</span>}
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
        <Link className="text-sm text-muted hover:text-fg" href={`/${other}/${n}`}>
          Same week on {TRACK_LABEL[other]} →
        </Link>
      </nav>

      {/* daily checklist */}
      <section className="card p-5">
        <SectionTitle hint="One box per session">Daily checklist</SectionTitle>
        <div>
          {w.checklist.map((c) => (
            <div key={c.day} className={`-mx-2 flex gap-3 rounded-lg px-2 ${inThisWeek && c.day === todayName ? "bg-accent-soft/60" : ""}`}>
              <div className="w-10 shrink-0 pt-2 text-xs font-semibold text-muted">
                {c.day}
                {hydrated && <div className="font-normal">{fmtShort(addDays(start, DAY_OFFSET[c.day]))}</div>}
              </div>
              <div className="min-w-0 flex-1">
                <CheckRow k={keys.day(track, n, c.day)} color={color} links="">
                  {c.text}
                </CheckRow>
                <Specifics specs={specsFor(track, n, "day", c.day, c.text)} />
              </div>
            </div>
          ))}
        </div>
        {w.problemNote && <p className="mt-3 text-sm text-muted">{w.problemNote}</p>}
      </section>

      {/* build */}
      {w.build && (
        <section className="card p-5">
          <SectionTitle hint="Thursday">Build it yourself</SectionTitle>
          <CheckRow k={keys.build(track, n)} color={color}>
            {w.build.charAt(0).toUpperCase() + w.build.slice(1)}
          </CheckRow>
        </section>
      )}

      {/* problems */}
      {w.problems.length > 0 && (
        <section className="card p-5">
          <SectionTitle hint={<Link href="/problems" className="hover:text-fg">All problems →</Link>}>Sunday problems ({w.problems.length})</SectionTitle>
          <p className="mb-1 text-xs text-muted">Links open LeetCode. If one is locked, Striver&apos;s A2Z sheet has the same pattern. Marking “Needed help” schedules re-solves in 3 days and 2 weeks.</p>
          {w.problems.map((pr) => (
            <ProblemRow key={pr.slug} {...pr} />
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
              <CheckRow k={keys.res(track, n, i)} color="ok" links="">
                {(r.core ? "⭐ " : "") + r.text}
              </CheckRow>
              <Specifics specs={specsFor(track, n, "res", r.text)} />
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

      {/* milestone */}
      {isLastOfGroup && group && (group.milestone || PHASE_SUMMARY[group.id]) && (
        <section className="card bg-panel-2 p-5">
          <SectionTitle>{group.id} milestone</SectionTitle>
          <p className="text-[15px] leading-relaxed">{group.milestone || PHASE_SUMMARY[group.id]?.milestone}</p>
          <div className="mt-3">
            <CheckRow k={`ms:${track}:${group.id}`} color="ok">
              Milestone complete
            </CheckRow>
          </div>
        </section>
      )}

      {/* notes */}
      <section className="card p-5">
        <SectionTitle hint={track === "main" ? "Saturday" : "Sunday"}>Your notes</SectionTitle>
        <p className="mb-2 text-xs text-muted">“Today I learned X. It exists because Y. It works by Z. I&apos;m still confused about W.”</p>
        <NoteBox k={keys.note(track, n)} placeholder={track === "main" ? "Explain this week to a junior…" : "What clicked, what didn't, patterns you noticed…"} />
      </section>

      {w.after.length > 0 && (
        <section className="card p-5">
          <SectionTitle>After week 36</SectionTitle>
          {track === "main" && <p className="mb-2 text-sm text-muted">Pick 1-2 per quarter, not all at once.</p>}
          {w.after.map((a, i) => (
            <CheckRow key={i} k={`af:${track}:${i}`} color="ok" links="">
              {a}
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
export function Specifics({ specs }: { specs: Spec[] }) {
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
