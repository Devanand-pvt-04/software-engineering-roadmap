"use client";

import { useState } from "react";
import { contestDay, contestLog, fmtContest, lastContest, nextContest, type ContestRec } from "@/lib/contest";
import { keys, type ContestInfo } from "@/lib/roadmap";
import { setEntry, useHydrated, useStore, useToday } from "@/lib/store";
import { SectionTitle } from "./ui";

export function ContestPanel({ info }: { info: ContestInfo }) {
  const s = useStore();
  const h = useHydrated();
  const now = useToday();
  const log = contestLog(s);
  const next = now ? nextContest(info, now) : null;
  const last = now ? lastContest(info, now) : null;
  const [date, setDate] = useState("");
  const [solved, setSolved] = useState(1);
  const [note, setNote] = useState("");
  const theDate = date || (last ? contestDay(last) : "");

  const recent = log.slice(0, 4);
  const avg = recent.length ? recent.reduce((a, x) => a + x.rec.solved, 0) / recent.length : 0;
  const best = log.reduce((a, x) => Math.max(a, x.rec.solved), 0);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!theDate) return;
    const rec: ContestRec = { solved, ...(note.trim() ? { note: note.trim() } : {}) };
    setEntry(keys.contest(theDate), rec);
    setNote("");
    setDate("");
  };

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted">Next weekly contest</div>
            <div className="mt-1 text-xl font-semibold">{h && next ? fmtContest(next) : "…"}</div>
            <div className="text-xs text-muted">90 minutes, 4 problems · your local time</div>
          </div>
          <a href={info.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            Open LeetCode contests ↗
          </a>
        </div>
        {h && log.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-4 border-t border-line pt-3 text-sm">
            <span>
              <b>{log.length}</b> logged
            </span>
            <span>
              <b>{avg.toFixed(1)}</b> solved on average (last {recent.length})
            </span>
            <span>
              <b>{best}</b> best
            </span>
          </div>
        )}
      </section>

      <section className="card p-5">
        <SectionTitle>Log a contest</SectionTitle>
        <form onSubmit={save} className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 text-sm">
              Date
              <input type="date" className="input w-auto" value={theDate} onChange={(e) => setDate(e.target.value)} aria-label="Contest date" />
            </label>
            <div className="flex items-center gap-1 text-sm" role="radiogroup" aria-label="Problems solved">
              <span className="mr-1">Solved</span>
              {[0, 1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={solved === n}
                  onClick={() => setSolved(n)}
                  className={`size-8 rounded-md border text-sm ${solved === n ? "border-accent bg-panel-2 text-accent" : "border-line text-muted hover:text-fg"}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input className="input min-w-0 flex-1" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What to upsolve, what slowed you down (optional)" aria-label="Note" />
            <button className="btn btn-primary shrink-0 justify-center">Save</button>
          </div>
        </form>
        {h && log.length > 0 && (
          <ul className="mt-4 divide-y divide-line text-sm">
            {log.map(({ date: d, rec }) => (
              <li key={d} className="flex items-start gap-3 py-2">
                <span className="w-24 shrink-0 tabular-nums text-muted">{d}</span>
                <span className="w-16 shrink-0 font-medium">{rec.solved} / 4</span>
                <span className="min-w-0 flex-1 text-muted">{rec.note}</span>
                <button className="text-xs text-muted hover:text-danger" onClick={() => setEntry(keys.contest(d), null)} aria-label={`Remove contest on ${d}`}>
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5">
        <SectionTitle>How to use contests</SectionTitle>
        <ul className="list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed">
          {info.rules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
