"use client";

import Link from "next/link";
import { useContent } from "@/lib/content";
import { problemStats } from "@/lib/progress";
import { useStore } from "@/lib/store";
import { usePlan, type LivePlan } from "@/lib/use-plan";
import { currentWeek, planLength, dayHoursKey, RHYTHM_KEY, MISS_KEY, missPolicyOf, MIN_WEEK_SESSIONS, rhythmOf, rhythmTotal, weekdayIndex, type Planned } from "@/lib/sessions";
import { doToday, resetDay, skipDay, swapSessions } from "@/lib/plan-actions";
import { addDays, dayKey, fmt, parseDate } from "@/lib/schedule";
import { dueCards } from "@/lib/quiz";
import { contestNudge, fmtContest } from "@/lib/contest";
import { Ring, SectionTitle } from "./ui";
import { StartPicker } from "./start-picker";
import { MissEditor, RhythmEditor } from "./rhythm-editor";
import { setEntry } from "@/lib/store";
import { ProblemRow } from "./problem-row";
import { Heatmap } from "./heatmap";
import { SessionItem, hoursLabel } from "./session-row";
import { YouAreHere } from "./big-picture";

const dayName = (d: string, today: string) => {
  if (d === today) return "Today";
  if (d === dayKey(addDays(parseDate(today), 1))) return "Tomorrow";
  return parseDate(d).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
};

export function TodayView() {
  const live = usePlan();
  if (!live) return <div className="h-96" />;
  return <Today live={live} />;
}

function Today({ live }: { live: LivePlan }) {
  const c = useContent();
  const s = useStore();
  const { plan, pace, today: now } = live;
  const t = dayKey(now);
  const before = live.start > t;
  const finished = plan.planned.length === 0;
  const todays = before ? [] : (plan.byDate.get(t) ?? []);
  const doneToday = plan.sessions.filter((x) => plan.doneOn.get(x.key) === t);
  const upcoming = plan.planned.filter((p) => p.date > t || before);
  const nextDays = [...new Set(upcoming.map((p) => p.date))].slice(0, 3);
  const overridden = s.entries[dayHoursKey(t)]?.v !== undefined && s.entries[dayHoursKey(t)]?.v !== null;
  const rhythm = rhythmOf(s);
  const plannedHoursToday = rhythm[weekdayIndex(now)];
  const n = currentWeek(plan);
  const len = planLength(c);
  const ps = problemStats(s, now, c.problems);
  const quizDue = dueCards(s, c, t);
  const contest = c.contest && currentWeek(plan, "java") > c.contest.startAfterWeek ? contestNudge(c.contest, s, now) : null;
  const next = upcoming[0];

  const headline = before
    ? `Week 1 starts ${fmt(parseDate(live.start))}`
    : finished
      ? `You finished all ${len} weeks`
      : todays.length
        ? `Week ${n} of ${len} · ${todays.reduce((a, x) => a + x.hours, 0)} h today`
        : doneToday.length
          ? `Week ${n} of ${len} · done for today`
          : `Week ${n} of ${len} · free day`;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted">{now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{headline}</h1>
      </header>

      {!s.entries["cfg:setup"]?.v && <SetupCard start={live.start} startSet={live.startSet} />}

      {before && (
        <section className="card p-5">
          <SectionTitle>Before week 1</SectionTitle>
          <p className="text-[15px]">
            Do the setup checklist first, then read how the plan works.{" "}
            <Link href="/guide#setup" className="font-medium text-accent">
              Open setup →
            </Link>
          </p>
        </section>
      )}

      {!before && !finished && (
        <section className="card p-5">
          <SectionTitle hint={overridden ? <button className="underline hover:text-fg" onClick={() => resetDay(t)}>Undo changes to today</button> : `${hoursLabel(plannedHoursToday)} in your rhythm`}>
            Today
          </SectionTitle>
          {todays.map((x, i) => (
            <SessionItem
              key={x.key}
              x={x}
              actions={
                <>
                  {(todays[i + 1] ?? upcoming[0]) && (
                    <button className="btn !py-1 !text-[13px]" onClick={() => swapSessions(x, todays[i + 1] ?? upcoming[0])} title="Do the next session instead, and this one in its place">
                      ⇄ Swap with next
                    </button>
                  )}
                  {i === 0 && (
                    <button className="btn !py-1 !text-[13px]" onClick={() => skipDay(plan, t)} title="Everything moves back to your next study day">
                      Not today
                    </button>
                  )}
                </>
              }
            />
          ))}
          {doneToday.length > 0 && (
            <div className={todays.length ? "mt-2 border-t border-line pt-2" : ""}>
              {doneToday.map((x) => (
                <SessionItem key={x.key} x={x} detail={false} />
              ))}
            </div>
          )}
          {plan.catchUp.size > 0 && (
            <p className="mt-2 rounded-lg bg-warn-soft px-3 py-2 text-sm">
              Catching up {Math.round(plan.missed * 2) / 2} h missed in the last two weeks:{" "}
              {[...plan.catchUp].slice(0, 4).map(([d, hrs]) => `+${hrs} h ${d === t ? "today" : parseDate(d).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}`).join(", ")}
              {plan.catchUp.size > 4 ? ", …" : ""}.{" "}
              <Link href="/settings#missed" className="underline">
                Change
              </Link>
            </p>
          )}
          {todays.length === 0 && next && (
            <div className="mt-2 rounded-xl bg-panel-2 p-4">
              <p className="text-[15px]">
                {doneToday.length ? "Done for today. Nice work." : "Nothing planned today."} Next up {dayName(next.date, t).toLowerCase() === "tomorrow" ? "tomorrow" : `on ${dayName(next.date, t)}`}: <b>{next.label}</b> ({hoursLabel(next.hours)}).
              </p>
              <button className="btn btn-primary mt-3" onClick={() => doToday(plan, next, now)}>
                Do it today instead
              </button>
              <p className="mt-2 text-xs text-muted">Everything after it moves up, so you finish sooner.</p>
            </div>
          )}
        </section>
      )}

      {!finished && !!s.entries["cfg:setup"]?.v && <Momentum live={live} />}

      {!finished && <YouAreHere plan={plan} />}

      {nextDays.length > 0 && (
        <section className="card p-5">
          <SectionTitle hint={<Link href="/plan#upcoming" className="hover:text-fg">Whole schedule →</Link>}>Coming up</SectionTitle>
          <div className="divide-y divide-line">
            {nextDays.map((d) => (
              <div key={d} className="py-2">
                <div className="mb-1 text-sm font-semibold">{dayName(d, t)}</div>
                {(plan.byDate.get(d) ?? []).map((x) => (
                  <UpcomingRow key={x.key} x={x} onToday={!before ? () => doToday(plan, x, now) : undefined} />
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {contest && !contest.logged && (
        <section className="card flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <SectionTitle>Weekly contest</SectionTitle>
            <p className="text-[15px]">
              {contest.upcoming
                ? `The LeetCode weekly contest starts ${fmtContest(contest.at)}. 90 minutes, live and timed.`
                : contest.live
                  ? "The weekly contest is on now."
                  : "How did the weekly contest go? Log it, then upsolve the first problem you missed."}
            </p>
          </div>
          <Link href="/problems#contests" className="btn btn-primary">
            {contest.upcoming || contest.live ? "Contest details" : "Log result"}
          </Link>
        </section>
      )}

      {quizDue.length > 0 && (
        <section className="card flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <SectionTitle>Self-check review</SectionTitle>
            <p className="text-[15px]">
              {quizDue.length} question{quizDue.length > 1 ? "s" : ""} from earlier weeks {quizDue.length > 1 ? "are" : "is"} due. About {Math.max(1, Math.round(quizDue.length * 1.5))} minutes.
            </p>
          </div>
          <Link href="/review" className="btn btn-primary">
            Review now
          </Link>
        </section>
      )}

      {ps.due.length > 0 && (
        <section className="card p-5">
          <SectionTitle hint="Practice rule 6">Re-solves due</SectionTitle>
          {ps.due.map((d) => (
            <ProblemRow key={d.slug} slug={d.slug} name={d.name} week={d.week} showWeek hint={c.problems.find((p) => p.slug === d.slug)?.hint} difficulty={c.problems.find((p) => p.slug === d.slug)?.difficulty} />
          ))}
        </section>
      )}

      <Heatmap now={now} />

      {pace.total > 0 && c.encouragement && <p className="text-sm italic leading-relaxed text-muted">{c.encouragement}</p>}
    </div>
  );
}

function UpcomingRow({ x, onToday }: { x: Planned; onToday?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="min-w-0 text-[14px]">
        <span className={`mr-2 text-xs font-semibold ${x.track === "main" ? "text-main" : x.track === "java" ? "text-java" : "text-ok"}`}>
          {x.track === "main" ? "Main" : x.track === "java" ? "Java" : "Review"} W{x.n}
        </span>
        {x.label} <span className="text-muted">· {hoursLabel(x.hours)}</span>
      </div>
      {onToday && (
        <button className="btn shrink-0 !px-2.5 !py-1 !text-[12px]" onClick={onToday}>
          Do today
        </button>
      )}
    </div>
  );
}

/** Streak, this week's ring, pace and finish date: the numbers that keep you going. */
function Momentum({ live }: { live: LivePlan }) {
  const s = useStore();
  const { plan, pace, streak } = live;
  const target = rhythmTotal(rhythmOf(s));
  const week = streak.thisWeek;
  const ratio = target ? Math.min(1, week.hours / target) : 0;
  const finish = plan.finish;
  const baseline = pace.baselineFinish;
  const slip = finish && baseline ? Math.round((parseDate(finish).getTime() - parseDate(baseline).getTime()) / (7 * 86_400_000)) : 0;
  const minHit = week.sessions >= MIN_WEEK_SESSIONS;
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="card flex items-center gap-3 p-4">
        <Ring value={ratio} size={56}>
          <span className="text-xs">{Math.round(ratio * 100)}%</span>
        </Ring>
        <div className="min-w-0">
          <div className="text-xs text-muted">This week</div>
          <div className="text-lg font-semibold tabular-nums">
            {week.hours} / {target} h
          </div>
          <div className="text-[11px] leading-snug text-muted">{minHit ? "Minimum week hit ✓" : `${MIN_WEEK_SESSIONS - week.sessions} more session${MIN_WEEK_SESSIONS - week.sessions > 1 ? "s" : ""} keeps the streak`}</div>
        </div>
      </div>
      <Tile label="Streak" value={`${streak.current} week${streak.current === 1 ? "" : "s"}`} sub={streak.best > streak.current ? `Best: ${streak.best} weeks` : streak.current ? "Your best yet. Keep it alive." : "Two sessions this week starts one"} />
      <Tile
        label="Pace"
        value={live.start > dayKey(live.today) ? "Not started" : pace.diff >= 0 ? (pace.diff === 0 ? "On track" : `${pace.diff} ahead`) : `${-pace.diff} behind`}
        sub={`${pace.done} of ${pace.total} sessions done`}
        tone={pace.diff >= 0 ? "ok" : "warn"}
      />
      <Tile
        label="Finish"
        value={finish ? fmt(parseDate(finish)) : "Done"}
        sub={slip > 0 ? `${slip} week${slip > 1 ? "s" : ""} later than planned. That's fine: no cramming.` : slip < 0 ? `${-slip} week${slip < -1 ? "s" : ""} early` : "As planned"}
      />
    </section>
  );
}

function Tile({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "ok" | "warn" }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className={`mt-1 text-lg font-semibold tabular-nums ${tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : ""}`}>{value}</div>
      <div className="mt-1 text-[11px] leading-snug text-muted">{sub}</div>
    </div>
  );
}

/** First run: when to start, which days and hours, and what to do on a missed day. */
function SetupCard({ start, startSet }: { start: string; startSet: boolean }) {
  const s = useStore();
  const save = () => {
    if (!startSet) setEntry("cfg:start", start);
    setEntry(RHYTHM_KEY, rhythmOf(s));
    if (s.entries[MISS_KEY]?.v == null) setEntry(MISS_KEY, missPolicyOf(s));
    setEntry("cfg:setup", true);
  };
  return (
    <section className="card border-2 border-accent p-5">
      <h2 className="text-lg font-semibold">Set up your plan</h2>
      <p className="mb-5 mt-1 text-[15px] leading-relaxed text-muted">The content is fixed; your pace isn&apos;t. Pick when you start, the days and hours you can give, and what should happen when life gets in the way. You can change all of it later in Settings.</p>
      <ol className="space-y-6">
        <li>
          <div className="mb-2 text-sm font-semibold">1. When do you start?</div>
          <StartPicker />
        </li>
        <li>
          <div className="mb-2 text-sm font-semibold">2. Which days, and how many hours?</div>
          <RhythmEditor bare />
        </li>
        <li>
          <div className="mb-2 text-sm font-semibold">3. When you miss a day</div>
          <MissEditor bare />
        </li>
      </ol>
      <button className="btn btn-primary mt-6" onClick={save}>
        Save my plan
      </button>
    </section>
  );
}
