"use client";

import { useContent } from "@/lib/content";
import { setEntry, useSettings, useStore } from "@/lib/store";
import { baselinePlan, CATCH_UP_WINDOW, MISS_KEY, missPolicyOf, RHYTHM_KEY, RHYTHM_PRESETS, rhythmOf, rhythmTotal, WEEKDAYS, type MissMode, type MissPolicy } from "@/lib/sessions";
import { fmt, parseDate } from "@/lib/schedule";
import { SectionTitle } from "./ui";

const same = (a: number[], b: number[]) => a.every((x, i) => x === b[i]);

/** Which days you study and for how long. The app fills each day from the session list up to these hours. */
export function RhythmEditor({ bare = false }: { bare?: boolean }) {
  const s = useStore();
  const c = useContent();
  const cfg = useSettings();
  const r = rhythmOf(s);
  const set = (i: number, v: number) => {
    const next = [...r];
    next[i] = Math.max(0, Math.min(12, Math.round(v * 2) / 2));
    if (next.some((x) => x > 0)) setEntry(RHYTHM_KEY, next);
  };
  const toggle = (i: number) => set(i, r[i] > 0 ? 0 : i >= 5 ? 4 : 1.5);
  const base = baselinePlan(c, s, cfg.start);
  const end = base.length ? base[base.length - 1].date : null;
  const weeks = end ? Math.ceil((parseDate(end).getTime() - parseDate(cfg.start).getTime() + 86_400_000) / (7 * 86_400_000)) : 0;
  const body = (
    <>
      <p className="mb-3 text-sm text-muted">Tap a day to switch it on or off, then set its hours. Nothing in the plan is cut to fit: fewer hours just means a later finish.</p>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {WEEKDAYS.map((d, i) => (
          <div key={d} className="text-center">
            <button
              type="button"
              onClick={() => toggle(i)}
              aria-pressed={r[i] > 0}
              className={`mb-1 w-full rounded-lg border py-1.5 text-xs font-semibold ${r[i] > 0 ? "border-accent bg-accent-soft text-accent" : "border-line text-muted"}`}
            >
              {d}
            </button>
            <input
              type="number"
              min={0}
              max={12}
              step={0.5}
              inputMode="decimal"
              className={`input !px-1 text-center tabular-nums ${r[i] > 0 ? "" : "opacity-50"}`}
              value={r[i]}
              onChange={(e) => set(i, Number(e.target.value) || 0)}
              aria-label={`Hours on ${d}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs text-muted">Presets:</span>
        {RHYTHM_PRESETS.map((p) => (
          <button key={p.id} className={`chip !px-2.5 !py-1 ${same(r, p.hours) ? "!border-accent !text-accent" : ""}`} onClick={() => setEntry(RHYTHM_KEY, p.hours)} title={p.note}>
            {p.name}
          </button>
        ))}
      </div>
      <p className="mt-4 text-sm">
        <b>{rhythmTotal(r)} h a week</b>
        {end && (
          <>
            {" "}
            · the plan takes <b>{weeks} weeks</b> and ends on <b>{fmt(parseDate(end))}</b> if nothing slips.
          </>
        )}
      </p>
    </>
  );
  if (bare) return body;
  return (
    <section id="rhythm" className="card scroll-mt-20 p-5">
      <SectionTitle>Your study days and hours</SectionTitle>
      {body}
    </section>
  );
}

const MODES: { id: MissMode; title: string; text: string }[] = [
  { id: "push", title: "Push everything back", text: "Missed sessions just move to your next study day. Your days stay the same length; the finish date moves." },
  { id: "spread", title: "Spread the catch-up over the week", text: "Add a little extra to each of your coming study days until you've caught up." },
  { id: "days", title: "Catch up on chosen days", text: "Add the missed time to the days you pick, like the weekend." },
];

/** What happens when you miss: push back, spread it out, or catch up on chosen days. */
export function MissEditor({ bare = false }: { bare?: boolean }) {
  const s = useStore();
  const p = missPolicyOf(s);
  const save = (x: Partial<MissPolicy>) => setEntry(MISS_KEY, { ...p, ...x });
  const body = (
    <>
      <div className="space-y-2">
        {MODES.map((m) => (
          <label key={m.id} className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${p.mode === m.id ? "border-accent bg-accent-soft/50" : "border-line"}`}>
            <input type="radio" name="miss" className="mt-1 accent-[var(--accent)]" checked={p.mode === m.id} onChange={() => save({ mode: m.id })} />
            <span>
              <span className="block text-sm font-semibold">{m.title}</span>
              <span className="block text-sm text-muted">{m.text}</span>
            </span>
          </label>
        ))}
      </div>
      {p.mode !== "push" && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {p.mode === "days" && (
            <div>
              <span className="mb-1 block text-sm font-medium">Catch-up days</span>
              <div className="flex flex-wrap gap-1">
                {WEEKDAYS.map((d, i) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={p.days.includes(i)}
                    onClick={() => save({ days: p.days.includes(i) ? p.days.filter((x) => x !== i) : [...p.days, i].sort() })}
                    className={`chip !px-2.5 !py-1 ${p.days.includes(i) ? "!border-accent !text-accent" : ""}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}
          <label className="block">
            <span className="mb-1 block text-sm font-medium">At most this much extra a day</span>
            <div className="flex items-center gap-2">
              <input type="number" min={0.5} max={6} step={0.5} className="input w-24 tabular-nums" value={p.extra} onChange={(e) => save({ extra: Math.max(0.5, Math.min(6, Number(e.target.value) || 0.5)) })} />
              <span className="text-sm text-muted">h</span>
            </div>
          </label>
        </div>
      )}
      <p className="mt-3 text-xs text-muted">Only the last {CATCH_UP_WINDOW} days are caught up. Anything older just pushes the plan back, so you never face a mountain.</p>
    </>
  );
  if (bare) return body;
  return (
    <section id="missed" className="card scroll-mt-20 p-5">
      <SectionTitle>When you miss a day</SectionTitle>
      {body}
    </section>
  );
}
