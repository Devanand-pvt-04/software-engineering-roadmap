"use client";

import Link from "next/link";
import { linksFor, type CatalogLink } from "@/data/links";
import { useCheck } from "@/lib/store";
import type { Track } from "@/lib/roadmap";

export function CheckBox({ checked, onChange, label, color = "accent" }: { checked: boolean; onChange: (v: boolean) => void; label: string; color?: "accent" | "main" | "java" | "ok" }) {
  const bg = { accent: "bg-accent border-accent", main: "bg-main border-main", java: "bg-java border-java", ok: "bg-ok border-ok" }[color];
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border-2 transition-colors ${checked ? bg : "border-line bg-panel hover:border-muted"}`}
    >
      {checked && (
        <svg viewBox="0 0 16 16" className="size-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

export function CheckRow({ k, children, color, muted, links }: { k: string; children: React.ReactNode; color?: "accent" | "main" | "java" | "ok"; muted?: boolean; links?: string }) {
  const [v, set] = useCheck(k);
  const text = typeof children === "string" ? children : "";
  return (
    <div className="flex gap-3 py-1.5">
      <CheckBox checked={v} onChange={set} label={text || k} color={color} />
      <div className={`min-w-0 flex-1 text-[15px] leading-relaxed ${v ? "text-muted line-through decoration-1" : muted ? "text-muted" : ""}`}>
        <span className="cursor-pointer" onClick={() => set(!v)}>
          {children}
        </span>
        {links !== undefined && <LinkChips text={links || text} className="mt-1.5" />}
      </div>
    </div>
  );
}

export function LinkChip({ l }: { l: CatalogLink }) {
  return (
    <a href={l.url} target="_blank" rel="noopener noreferrer" className="chip">
      {l.label}
      <svg viewBox="0 0 12 12" className="size-2.5 opacity-60" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M4.5 2.5h5v5M9.5 2.5l-7 7" />
      </svg>
    </a>
  );
}

export function LinkChips({ text, className = "" }: { text: string; className?: string }) {
  const ls = linksFor(text);
  if (!ls.length) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {ls.map((l) => (
        <LinkChip key={l.id} l={l} />
      ))}
    </div>
  );
}

export function Bar({ value, track, className = "" }: { value: number; track?: Track | "ok"; className?: string }) {
  const c = track === "java" ? "bg-java" : track === "ok" ? "bg-ok" : "bg-main";
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-panel-2 ${className}`} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${c} transition-[width]`} style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}

export function Ring({ value, size = 64, track, children }: { value: number; size?: number; track?: Track; children?: React.ReactNode }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--panel-2)" strokeWidth="6" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={track === "java" ? "var(--java)" : "var(--main)"}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value)}
        />
      </svg>
      <div className="absolute text-sm font-semibold tabular-nums">{children ?? `${Math.round(value * 100)}%`}</div>
    </div>
  );
}

export function TrackTag({ track, n, link = true }: { track: Track; n?: number; link?: boolean }) {
  const cls = track === "main" ? "bg-main-soft text-main" : "bg-java-soft text-java";
  const label = `${track === "main" ? "Main" : "Java + DSA"}${n ? ` · W${n}` : ""}`;
  const inner = <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
  return link && n ? <Link href={`/${track}/${n}`}>{inner}</Link> : inner;
}

export function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{children}</h2>
      {hint && <div className="text-xs text-muted">{hint}</div>}
    </div>
  );
}
