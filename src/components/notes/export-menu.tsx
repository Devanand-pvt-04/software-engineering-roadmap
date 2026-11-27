"use client";

import { useEffect, useRef, useState } from "react";
import { useContent } from "@/lib/content";
import { getState } from "@/lib/store";
import type { NoteView } from "@/lib/notes/model";
import { download, exportCards, exportHtml, exportMarkdown, exportPdf, exportText, exportWord, exportZip, fileName } from "@/lib/notes/export";

type Fmt = "md" | "zip" | "html" | "pdf" | "doc" | "txt" | "anki";
const FORMATS: { id: Fmt; label: string; hint: string; many?: boolean }[] = [
  { id: "pdf", label: "PDF", hint: "Print-ready, through the print dialog" },
  { id: "md", label: "Markdown (.md)", hint: "One file, images embedded" },
  { id: "zip", label: "Markdown folder (.zip)", hint: "A file per note plus images; opens in Obsidian or VS Code", many: true },
  { id: "html", label: "Web page (.html)", hint: "Opens in any browser, works offline" },
  { id: "doc", label: "Word (.doc)", hint: "Opens in Word, Google Docs, LibreOffice" },
  { id: "txt", label: "Plain text (.txt)", hint: "The raw text" },
  { id: "anki", label: "Flashcards (.tsv)", hint: "Import into Anki or Quizlet" },
];

export function ExportMenu({ notes, label = "Export", title, className = "btn" }: { notes: NoteView[]; label?: string; title?: string; className?: string }) {
  const c = useContent();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<Fmt | null>(null);
  const [msg, setMsg] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", off);
    return () => document.removeEventListener("mousedown", off);
  }, [open]);

  const run = async (f: Fmt) => {
    const s = getState();
    setBusy(f);
    setMsg("");
    try {
      if (f === "md") download(fileName(notes, "md"), await exportMarkdown(notes, s, c, title), "text/markdown");
      else if (f === "zip") download(fileName(notes, "zip"), (await exportZip(notes, s, c)) as BlobPart, "application/zip");
      else if (f === "html") download(fileName(notes, "html"), await exportHtml(notes, s, c, title), "text/html");
      else if (f === "doc") download(fileName(notes, "doc"), await exportWord(notes, s, c, title), "application/msword");
      else if (f === "txt") download(fileName(notes, "txt"), exportText(notes), "text/plain");
      else if (f === "pdf") await exportPdf(notes, s, c, title);
      else {
        const { tsv, count } = exportCards(notes);
        if (!count) {
          setMsg("No flashcards in these notes yet.");
          return;
        }
        download(fileName(notes, "tsv").replace(/\.tsv$/, "-flashcards.tsv"), tsv, "text/tab-separated-values");
      }
      setOpen(false);
    } catch (e) {
      setMsg(`Export failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button type="button" className={className} onClick={() => setOpen(!open)} aria-expanded={open} disabled={!notes.length}>
        <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M10 3v10M6 9l4 4 4-4M4 15v2h12v-2" />
        </svg>
        {label}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-1 w-72 rounded-xl border border-line bg-panel p-1 shadow-xl" role="menu">
          <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
            {notes.length === 1 ? "This note as" : `${notes.length} notes as`}
          </p>
          {FORMATS.filter((f) => !f.many || notes.length > 1).map((f) => (
            <button key={f.id} role="menuitem" className="block w-full rounded-lg px-3 py-2 text-left hover:bg-panel-2 disabled:opacity-50" disabled={!!busy} onClick={() => run(f.id)}>
              <span className="block text-sm font-medium">{busy === f.id ? "Preparing…" : f.label}</span>
              <span className="block text-xs text-muted">{f.hint}</span>
            </button>
          ))}
          {msg && <p className="px-3 py-2 text-xs text-danger">{msg}</p>}
        </div>
      )}
    </div>
  );
}
