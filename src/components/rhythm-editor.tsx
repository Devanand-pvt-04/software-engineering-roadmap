"use client";

import { useContent } from "@/lib/content";
import { setEntry, useSettings, useStore } from "@/lib/store";
import { baselinePlan, RHYTHM_KEY, RHYTHM_PRESETS, rhythmOf, rhythmTotal, WEEKDAYS } from "@/lib/sessions";
import { fmt, parseDate } from "@/lib/schedule";
import { SectionTitle } from "./ui";

const same = (a: number[], b: number[]) => a.every((x, i) => x === b[i]);

/** Hours per weekday. The app fills each day from the session list up to these hours. */
export function RhythmEditor() {
  const s = useStore();
  const c = useContent();
  const cfg = useSettings();
  const r = rhythmOf(s);
  const set = (i: number, v: number) => {
    const next = [...r];
    next[i] = Math.max(0, Math.min(12, Math.round(v * 2) / 2));
    if (next.some((x) => x > 0)) setEntry(RHYTHM_KEY, next);
  };
  const base = baselinePlan(c, s, cfg.start);
  const end = base.length ? base[base.length - 1].date : null;
  const weeks = end ? Math.ceil((parseDate(end).getTime() - parseDate(cfg.start).getTime() + 86_400_000) / (7 * 86_400_000)) : 0;
  const weekend = r[5] + r[6];
  return (
    <section id="rhythm" className="card scroll-mt-20 p-5">
      <SectionTitle hint={`${rhythmTotal(r)} h a week · ${Math.round((weekend / Math.max(1, rhythmTotal(r))) * 100)}% on weekends`}>Weekly rhythm</SectionTitle>
      <p className="mb-4 text-sm text-muted">How many hours you have each day. The app fills your days from the session list in order, so changing this reflows the whole plan.</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {RHYTHM_PRESETS.map((p) => (
          <button key={p.id} className={`chip !px-3 !py-2 ${same(r, p.hours) ? "!border-accent !text-accent" : ""}`} onClick={() => setEntry(RHYTHM_KEY, p.hours)} title={p.note}>
            {p.name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {WEEKDAYS.map((d, i) => (
          <label key={d} className="block text-center">
            <span className={`mb-1 block text-xs font-semibold ${i >= 5 ? "text-accent" : "text-muted"}`}>{d}</span>
            <input
              type="number"
              min={0}
              max={12}
              step={0.5}
              inputMode="decimal"
              className="input !px-1 text-center tabular-nums"
              value={r[i]}
              onChange={(e) => set(i, Number(e.target.value) || 0)}
              aria-label={`Hours on ${d}`}
            />
          </label>
        ))}
      </div>
      {end && (
        <p className="mt-4 text-sm">
          With this rhythm the plan takes <b>{weeks} weeks</b> from your start date and ends on <b>{fmt(parseDate(end))}</b> if nothing slips.
        </p>
      )}
    </section>
  );
}
