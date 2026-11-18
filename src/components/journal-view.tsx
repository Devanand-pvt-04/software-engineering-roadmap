"use client";

import { useState } from "react";
import { URL_NOTE_SECTIONS } from "@/data/guide";
import { setEntry, useHydrated, useStore } from "@/lib/store";
import { dayKey } from "@/lib/schedule";
import { NoteBox } from "./notes";
import { SectionTitle } from "./ui";

type Kind = "mistake" | "pattern";
interface LogItem {
  kind: Kind;
  text: string;
  tag: string;
  date: string;
}

const MISTAKE_TAGS = ["off-by-one", "edge case", "wrong pattern", "complexity", "misread problem", "bug", "other"];

const TABS = [
  { id: "url", label: "What happens when I type a URL" },
  { id: "mistake", label: "Mistakes log" },
  { id: "pattern", label: "Patterns note" },
] as const;

export function JournalView() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("url");
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Journal</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-muted">The plan&apos;s long-running notes: one URL note that grows each phase, and the patterns and mistakes notes for the Java + DSA track.</p>
      </header>
      <div className="flex flex-wrap gap-1.5" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`chip !px-3 !py-2 !text-[13px] ${tab === t.id ? "!border-accent !text-accent" : ""}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "url" ? <UrlNote /> : <Log kind={tab} />}
    </div>
  );
}

function UrlNote() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Start this in week 1. Every phase adds a section. By week 36 it&apos;s a document you could teach from, and the basis of your capstone talk.</p>
      {URL_NOTE_SECTIONS.map((s) => (
        <section key={s.id} className="card p-5">
          <SectionTitle hint={s.phase}>{s.title}</SectionTitle>
          <p className="mb-2 text-xs text-muted">{s.hint}</p>
          <NoteBox k={`url:${s.id}`} rows={8} placeholder="Write it in your own words…" />
        </section>
      ))}
    </div>
  );
}

function Log({ kind }: { kind: Kind }) {
  const s = useStore();
  const h = useHydrated();
  const [text, setText] = useState("");
  const [tag, setTag] = useState(kind === "mistake" ? MISTAKE_TAGS[0] : "");
  const items = Object.entries(s.entries)
    .filter(([k, e]) => k.startsWith("log:") && e.v && (e.v as LogItem).kind === kind)
    .map(([k, e]) => ({ k, ...(e.v as LogItem) }))
    .sort((a, b) => b.date.localeCompare(a.date) || b.k.localeCompare(a.k));

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setEntry(`log:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, { kind, text: text.trim(), tag: tag.trim(), date: dayKey() } satisfies LogItem);
    setText("");
    if (kind === "pattern") setTag("");
  };

  const counts = kind === "mistake" ? MISTAKE_TAGS.map((t) => ({ t, n: items.filter((i) => i.tag === t).length })).filter((x) => x.n) : [];

  return (
    <div className="space-y-4">
      <section className="card p-5">
        <SectionTitle>{kind === "mistake" ? "Log a mistake" : "Add a pattern"}</SectionTitle>
        <p className="mb-3 text-sm text-muted">
          {kind === "mistake"
            ? "Every off-by-one, wrong edge case or wrong pattern goes here. Review it for 15 minutes every Sunday."
            : "Write which signal pointed to the pattern, e.g. “contiguous subarray + condition → sliding window”."}
        </p>
        <form onSubmit={add} className="space-y-2">
          <textarea className="input min-h-20" value={text} onChange={(e) => setText(e.target.value)} placeholder={kind === "mistake" ? "What went wrong, on which problem, and the fix" : "Signal → pattern, plus a template"} aria-label="Entry" />
          <div className="flex flex-col gap-2 sm:flex-row">
            {kind === "mistake" ? (
              <select className="input sm:w-48" value={tag} onChange={(e) => setTag(e.target.value)} aria-label="Mistake type">
                {MISTAKE_TAGS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            ) : (
              <input className="input sm:w-64" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Pattern name (e.g. two pointers)" aria-label="Pattern name" />
            )}
            <button className="btn btn-primary justify-center sm:ml-auto">Add</button>
          </div>
        </form>
      </section>

      {counts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {counts.map((c) => (
            <span key={c.t} className="chip">
              {c.t} <b>{c.n}</b>
            </span>
          ))}
        </div>
      )}

      {h && items.length === 0 && <p className="text-sm text-muted">Nothing yet.</p>}
      {items.map((i) => (
        <article key={i.k} className="card p-4">
          <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted">
            <span>
              {i.date}
              {i.tag && <span className="chip ml-2">{i.tag}</span>}
            </span>
            <button className="hover:text-danger" onClick={() => setEntry(i.k, null)} aria-label="Delete entry">
              Delete
            </button>
          </div>
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{i.text}</p>
        </article>
      ))}
    </div>
  );
}
