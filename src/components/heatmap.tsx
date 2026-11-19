"use client";

import { addDays, dayKey, mondayOf, parseDate } from "@/lib/schedule";
import { useStore } from "@/lib/store";
import { SectionTitle } from "./ui";

const WEEKS = 26;
const ROWS = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

/** GitHub-style grid of the last six months: how many things were ticked or written each day. */
export function Heatmap({ now }: { now: Date }) {
  const s = useStore();
  const counts = new Map<string, number>();
  for (const [k, e] of Object.entries(s.entries)) {
    if (k.startsWith("cfg:") || !e.v) continue;
    const d = dayKey(new Date(e.t));
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  const today = dayKey(now);
  const first = addDays(parseDate(mondayOf(now)), -(WEEKS - 1) * 7);
  const cols: { key: string; n: number; future: boolean }[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const key = dayKey(addDays(first, w * 7 + d));
      col.push({ key, n: counts.get(key) ?? 0, future: key > today });
    }
    cols.push(col);
  }
  const days = cols.flat().filter((d) => !d.future);
  const active = days.filter((d) => d.n > 0).length;
  let best = 0;
  let run = 0;
  for (const d of days) {
    run = d.n > 0 ? run + 1 : 0;
    best = Math.max(best, run);
  }
  const level = (n: number) => (n === 0 ? 0 : n <= 2 ? 0.35 : n <= 5 ? 0.6 : n <= 9 ? 0.8 : 1);
  const months: { col: number; label: string }[] = [];
  cols.forEach((col, i) => {
    const d = parseDate(col[0].key);
    if (d.getDate() <= 7) months.push({ col: i, label: d.toLocaleDateString(undefined, { month: "short" }) });
  });

  return (
    <section className="card p-5">
      <SectionTitle hint={`${active} active day${active === 1 ? "" : "s"} · longest streak ${best}`}>Study days, last 6 months</SectionTitle>
      <div className="overflow-x-auto pb-1">
        <div className="inline-grid gap-[3px]" style={{ gridTemplateColumns: `24px repeat(${WEEKS}, 12px)`, gridTemplateRows: `14px repeat(7, 12px)` }}>
          <div />
          {cols.map((_, i) => (
            <div key={i} className="text-[10px] leading-none text-muted">
              {months.find((m) => m.col === i)?.label ?? ""}
            </div>
          ))}
          {ROWS.map((label, r) => (
            <Row key={r} label={label} cells={cols.map((c) => c[r])} level={level} today={today} />
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted">
        Less
        {[0, 0.35, 0.6, 0.8, 1].map((o) => (
          <span key={o} className="size-[10px] rounded-sm" style={o ? { background: "var(--ok)", opacity: o } : { background: "var(--panel-2)" }} />
        ))}
        More
      </div>
    </section>
  );
}

function Row({ label, cells, level, today }: { label: string; cells: { key: string; n: number; future: boolean }[]; level: (n: number) => number; today: string }) {
  return (
    <>
      <div className="pr-1 text-[10px] leading-[12px] text-muted">{label}</div>
      {cells.map((c) => {
        const o = level(c.n);
        return (
          <div
            key={c.key}
            title={c.future ? "" : `${c.key}: ${c.n} item${c.n === 1 ? "" : "s"}`}
            className={`size-3 rounded-sm ${c.key === today ? "ring-1 ring-accent" : ""}`}
            style={c.future ? { background: "transparent" } : o ? { background: "var(--ok)", opacity: o } : { background: "var(--panel-2)" }}
          />
        );
      })}
    </>
  );
}
