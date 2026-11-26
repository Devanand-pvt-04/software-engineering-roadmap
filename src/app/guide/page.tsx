import type { Metadata } from "next";
import Link from "next/link";
import { AI_TUTOR, JAVA_CORE_RESOURCES, SETUP_JAVA, STUCK_ORDER, WHY_PAST_FAILED, AFTER_JAVA_RHYTHM } from "@/data/guide";
import { linksFor } from "@/data/links";
import { CheckRow, LinkChips, SectionTitle } from "@/components/ui";
import { TRACKS } from "@/lib/roadmap";
import { guideFor } from "@/server/content";
import { RHYTHM_PRESETS, SESSION_TEMPLATE, WEEKDAYS } from "@/lib/sessions";

const links = (t: string) => linksFor(t).map((l) => ({ label: l.label, url: l.url }));

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
  const tracks = TRACKS;
  const both = tracks.length > 1;
  const hasMain = tracks.includes("main");
  const hasJava = tracks.includes("java");
  const g = guideFor(tracks);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">How the plan works</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">
          {g.lead} You never have to decide what to do next: every week has a day-by-day checklist.
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
            {g.whatsDifferent.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ol>
        </Card>
      </div>

      <Card title="How a week is laid out" hint={g.hours}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-2 pr-3 font-semibold">#</th>
                <th className="py-2 pr-3 font-semibold">Track</th>
                <th className="py-2 pr-3 font-semibold">Time</th>
                <th className="py-2 font-semibold">Session</th>
              </tr>
            </thead>
            <tbody>
              {SESSION_TEMPLATE.map((r, i) => (
                <tr key={i} className="border-t border-line align-top">
                  <td className="py-2 pr-3 text-muted">{i + 1}</td>
                  <td className={`py-2 pr-3 ${r.track === "main" ? "text-main" : r.track === "java" ? "text-java" : "text-ok"}`}>{r.track === "main" ? "Main" : r.track === "java" ? "Java + DSA" : "Review"}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{r.hours} h</td>
                  <td className="py-2">{r.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Nothing is tied to a weekday. You set how many hours you have each day, and the app fills your days from this list in order. One preset is weekend-heavy:{" "}
          {WEEKDAYS.map((d, i) => `${d} ${RHYTHM_PRESETS[0].hours[i]} h`).join(", ")}, which fits one plan week into each calendar week. Pick your own days and hours, and what happens when you miss a day, in{" "}
          <Link href="/settings#rhythm" className="underline">
            Settings
          </Link>
          .
        </p>
      </Card>

      <Card id="setup" title="Setup: do this before week 1" hint="Ticks are saved">
        <div className={`grid gap-x-8 ${both ? "sm:grid-cols-2" : ""}`}>
          {g.setupMain.length > 0 && (
            <div>
              {both && <div className="mb-1 text-sm font-semibold text-main">Main track</div>}
              {g.setupMain.map(({ x, i }) => (
                <CheckRow key={x} k={`su:m${i}`} color={hasMain ? "main" : "java"} links={links(x)}>
                  {x}
                </CheckRow>
              ))}
            </div>
          )}
          {hasJava && (
            <div>
              {both && <div className="mb-1 mt-4 text-sm font-semibold text-java sm:mt-0">Java + DSA track</div>}
              {SETUP_JAVA.map((x0, i) => {
                const x = hasMain ? x0 : x0.replace("Create java-dsa/ in your foundations repo", "Create a GitHub repo called java-dsa for your code");
                return (
                <CheckRow key={x} k={`su:j${i}`} color="java" links={links(x)}>
                  {x}
                </CheckRow>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      <Card id="behind" title="When you fall behind or get stuck">
        <ol className="space-y-3">
          {g.fallingBehind.map((r, i) => (
            <li key={r.title} className="text-[15px] leading-relaxed">
              <b>
                {i + 1}. {r.title}.
              </b>{" "}
              {r.text}
            </li>
          ))}
        </ol>
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

      <div className={`grid gap-4 ${both ? "sm:grid-cols-2" : ""}`}>
        {hasMain && (
        <Card title="Main track">
          <p className="text-[15px] leading-relaxed">{g.mainIntro}</p>
          <p className="mt-3 text-sm text-muted">
            Each week: Why this week → Must know → Overlooked / niche → Resources (⭐ = do first) → Daily checklist → Done when.
          </p>
          <Link href="/main/1" className="btn mt-4">
            Start Main week 1 →
          </Link>
        </Card>
        )}
        {hasJava && (
        <Card title="Java + DSA track">
          <p className="text-[15px] leading-relaxed">{g.javaIntro}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
            {AFTER_JAVA_RHYTHM.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <Link href="/java/1" className="btn mt-4">
            Start Java week 1 →
          </Link>
        </Card>
        )}
      </div>

      {hasJava && (
      <Card title="Why Java works well for this">
        <ul className="list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed">
          {g.whyJava.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </Card>

      )}

      {hasJava && (
      <Card title="Core resources for the Java + DSA track">
        <ul className="space-y-3">
          {JAVA_CORE_RESOURCES.map((x) => (
            <li key={x} className="text-[15px] leading-relaxed">
              {x}
              <LinkChips links={links(x)} className="mt-1.5" />
            </li>
          ))}
        </ul>
      </Card>
      )}
    </div>
  );
}
