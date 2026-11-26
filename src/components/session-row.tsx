"use client";

import Link from "next/link";
import { useContent, getWeek } from "@/lib/content";
import { keys } from "@/lib/roadmap";
import { sessionText, type Session } from "@/lib/sessions";
import { CheckRow, TrackTag } from "./ui";
import { Specifics } from "./week-view";

export const hoursLabel = (h: number) => (h === 1 ? "1 h" : `${h} h`);

/** One session: its track and week, what to do, the box to tick, and optional actions underneath. */
export function SessionItem({ x, actions, detail = true }: { x: Session; actions?: React.ReactNode; detail?: boolean }) {
  const c = useContent();
  const text = sessionText(c, x);
  const item = x.track === "review" ? undefined : getWeek(c, x.track, x.n)?.checklist.find((d) => d.day === x.from);
  const color = x.track === "review" ? "ok" : x.track;
  return (
    <div className="py-2">
      <div className="mb-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
        {x.track === "review" ? (
          <span className="inline-flex items-center rounded-md bg-ok-soft px-2 py-0.5 text-xs font-semibold text-ok">Review · W{x.n}</span>
        ) : (
          <TrackTag track={x.track} n={x.n} />
        )}
        <span className="font-medium text-fg">{x.label}</span>
        <span>· {hoursLabel(x.hours)}</span>
      </div>
      <CheckRow k={x.key} color={color} links={detail ? item?.links : undefined}>
        {text}
      </CheckRow>
      {detail && item && <Specifics specs={item.specs} />}
      {detail && x.track === "review" && <ReviewChecks n={x.n} />}
      {actions && <div className="ml-8 mt-1 flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

function ReviewChecks({ n }: { n: number }) {
  const c = useContent();
  return (
    <div className="mb-1 ml-8 rounded-lg bg-panel-2 px-3 py-1">
      {c.tracks.map((t) => {
        const w = getWeek(c, t, n);
        if (!w?.doneWhen) return null;
        return (
          <CheckRow key={t} k={keys.done(t, n)} color="ok">
            <span className="mr-1 font-medium">{t === "main" ? "Main" : "Java"}:</span>
            {"you can " + w.doneWhen.replace(/^you can /i, "")}
          </CheckRow>
        );
      })}
      <p className="pb-1 text-xs text-muted">
        Didn&apos;t pass one? Reopen{" "}
        {c.tracks.map((t, i) => (
          <span key={t}>
            {i > 0 && " or "}
            <Link className="underline hover:text-fg" href={`/${t}/${n}`}>
              {t === "main" ? "Main" : "Java"} week {n}
            </Link>
          </span>
        ))}
        , and tick the review once you have.
      </p>
    </div>
  );
}
