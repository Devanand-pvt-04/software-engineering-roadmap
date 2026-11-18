import type { Metadata } from "next";
import Link from "next/link";
import {
  AI_TUTOR, FALLING_BEHIND, JAVA_CORE_RESOURCES, JAVA_INTRO, MAIN_INTRO, SCHEDULE, SESSION_TEMPLATE, SETUP_JAVA, SETUP_MAIN, STUCK_ORDER,
  WHATS_DIFFERENT, WHY_JAVA, WHY_PAST_FAILED, AFTER_JAVA_RHYTHM,
} from "@/data/guide";
import { CheckRow, LinkChips, SectionTitle } from "@/components/ui";

export const metadata: Metadata = { title: "How it works" };

function Card({ id, title, hint, children }: { id?: string; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="card scroll-mt-20 p-5">
      <SectionTitle hint={hint}>{title}</SectionTitle>
      {children}
    </section>
  );
}

export default function Page() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">How the plan works</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">
          Two tracks for 36 weeks: a Main track (how software actually works, from the CPU to Kubernetes) and a Java + DSA track. You never have to decide what to do next:
          every week has a day-by-day checklist.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="Why past roadmaps didn't stick">
          <ul className="list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed">
            {WHY_PAST_FAILED.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </Card>
        <Card title="What's different here">
          <ol className="list-decimal space-y-1.5 pl-5 text-[15px] leading-relaxed">
            {WHATS_DIFFERENT.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ol>
        </Card>
      </div>

      <Card title="Your week, hour by hour" hint="About 15-16 h a week">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-2 pr-3 font-semibold">Day</th>
                <th className="py-2 pr-3 font-semibold">Track</th>
                <th className="py-2 pr-3 font-semibold">Time</th>
                <th className="py-2 font-semibold">What happens</th>
              </tr>
            </thead>
            <tbody>
              {SCHEDULE.map((r) => (
                <tr key={r.day} className="border-t border-line align-top">
                  <td className="py-2 pr-3 font-medium">{r.day}</td>
                  <td className={`py-2 pr-3 ${r.track.startsWith("Main") ? "text-main" : "text-java"}`}>{r.track}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{r.time}</td>
                  <td className="py-2">{r.what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted">A weekday checklist item is sized for one 1.5-hour session. If it takes two sessions, that&apos;s fine: see the falling-behind rules.</p>
      </Card>

      <Card title="The template for every session" hint="Use the timer on the Today page">
        <ol className="space-y-2">
          {SESSION_TEMPLATE.map((s, i) => (
            <li key={s.name} className="flex gap-3 text-[15px] leading-relaxed">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent">{i + 1}</span>
              <span>
                <b>{s.name}</b> <span className="text-muted">({s.minutes} min)</span>: {s.text}
              </span>
            </li>
          ))}
        </ol>
      </Card>

      <Card id="setup" title="Setup: do this before week 1" hint="Ticks are saved">
        <div className="grid gap-x-8 sm:grid-cols-2">
          <div>
            <div className="mb-1 text-sm font-semibold text-main">Main track</div>
            {SETUP_MAIN.map((x, i) => (
              <CheckRow key={x} k={`su:m${i}`} color="main" links="">
                {x}
              </CheckRow>
            ))}
          </div>
          <div>
            <div className="mb-1 mt-4 text-sm font-semibold text-java sm:mt-0">Java + DSA track</div>
            {SETUP_JAVA.map((x, i) => (
              <CheckRow key={x} k={`su:j${i}`} color="java" links="">
                {x}
              </CheckRow>
            ))}
          </div>
        </div>
      </Card>

      <Card id="behind" title="When you fall behind or get stuck">
        <ol className="space-y-3">
          {FALLING_BEHIND.map((r, i) => (
            <li key={r.title} className="text-[15px] leading-relaxed">
              <b>
                {i + 1}. {r.title}.
              </b>{" "}
              {r.text}
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-muted">
          The slide button and buffer weeks live in <Link href="/settings" className="underline">Settings</Link>.
        </p>
        <div className="mt-4 border-t border-line pt-4">
          <div className="mb-2 text-sm font-semibold">When stuck on a concept, ask in this order</div>
          <ol className="flex flex-wrap items-center gap-2 text-sm">
            {STUCK_ORDER.map((x, i) => (
              <li key={x} className="chip !whitespace-normal">
                {i + 1}. {x}
              </li>
            ))}
          </ol>
        </div>
      </Card>

      <Card title="Using AI as a tutor, not a crutch">
        <div className="grid gap-4 text-[15px] sm:grid-cols-2">
          <div>
            <div className="mb-1 text-sm font-semibold text-ok">Good uses</div>
            <ul className="list-disc space-y-1 pl-5">{AI_TUTOR.good.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
          <div>
            <div className="mb-1 text-sm font-semibold text-danger">Bad uses</div>
            <ul className="list-disc space-y-1 pl-5">{AI_TUTOR.bad.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        </div>
        <p className="mt-3 font-medium">{AI_TUTOR.rule}</p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="Main track">
          <p className="text-[15px] leading-relaxed">{MAIN_INTRO}</p>
          <p className="mt-3 text-sm text-muted">
            Each week: Why this week → Must know → Overlooked / niche → Resources (⭐ = do first) → Daily checklist → Done when.
          </p>
          <Link href="/main/1" className="btn mt-4">
            Start Main week 1 →
          </Link>
        </Card>
        <Card title="Java + DSA track">
          <p className="text-[15px] leading-relaxed">{JAVA_INTRO}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
            {AFTER_JAVA_RHYTHM.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <Link href="/java/1" className="btn mt-4">
            Start Java week 1 →
          </Link>
        </Card>
      </div>

      <Card title="Why Java works well for this">
        <ul className="list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed">
          {WHY_JAVA.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </Card>

      <Card title="Core resources for the Java + DSA track">
        <ul className="space-y-3">
          {JAVA_CORE_RESOURCES.map((x) => (
            <li key={x} className="text-[15px] leading-relaxed">
              {x}
              <LinkChips text={x} className="mt-1.5" />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
