"use client";

import { useState } from "react";
import { useContent } from "@/lib/content";
import { getState, setEntry, useHydrated, useStore } from "@/lib/store";
import { download, notesMarkdown } from "@/lib/notes-export";
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
  { id: "url", label: "" },
  { id: "mistake", label: "Mistakes log" },
  { id: "pattern", label: "Patterns note" },
] as const;

export function JournalView() {
  const c = useContent();
  const tabs = TABS.filter((t) => (t.id === "url" ? c.urlNoteSections.length > 0 : c.tracks.includes("java")));
  const [picked, setTab] = useState<(typeof TABS)[number]["id"] | null>(null);
  const tab = picked ?? tabs[0]?.id;
  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Journal</h1>
          {(
            <button className="btn" onClick={() => download(`zero-to-deep-notes-${dayKey()}.md`, notesMarkdown(getState(), c, dayKey()), "text/markdown")}>
              Export all notes (Markdown)
            </button>
          )}
        </div>
        <p className="mt-2 max-w-2xl text-[15px] text-muted">
          {tabs.length === 3
            ? "The plan's long-running notes: one URL note that grows each phase, and the patterns and mistakes notes for the Java + DSA track."
            : tab === "url"
              ? "The plan's long-running note: one URL explanation that grows each phase."
              : "Your long-running patterns and mistakes notes."}
        </p>
      </header>
      <div className="flex flex-wrap gap-1.5" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`chip !px-3 !py-2 !text-[13px] ${tab === t.id ? "!border-accent !text-accent" : ""}`}>
            {t.id === "url" ? c.urlNoteTitle : t.label}
          </button>
        ))}
      </div>
      {tab === "url" ? <UrlNote /> : tab ? <Log kind={tab} /> : null}
    </div>
  );
}

function UrlNote() {
  const { urlNoteSections } = useContent();
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Start this in week 1. Every phase adds a section. By week 36 it&apos;s a document you could teach from, and the basis of your capstone talk.</p>
      {urlNoteSections.map((s) => (
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
