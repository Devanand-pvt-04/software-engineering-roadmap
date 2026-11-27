"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useContent } from "@/lib/content";
import { getState, useStore } from "@/lib/store";
import type { Track, Week } from "@/lib/roadmap";
import { saveImage } from "@/lib/notes/assets";
import { displayTitle, getNote, noteHref, notesForWeek, weekNoteId, weekNoteTitle } from "@/lib/notes/model";
import { createNote, updateNote, useNotes } from "@/lib/notes/use-notes";
import { toggleTask } from "@/lib/notes/render";
import { NoteEditor } from "./editor";
import { NotePreview } from "./preview";

/** The week's own note, written in place, plus any other notes linked to this week. */
export function WeekNotes({ track, w, placeholder }: { track: Track; w: Week; placeholder: string }) {
  const c = useContent();
  const s = useStore();
  const notes = useNotes();
  const router = useRouter();
  const id = weekNoteId(w.id);
  const stored = getNote(s, c, id);
  const [body, setBody] = useState(stored?.body ?? "");
  const [mode, setMode] = useState<"write" | "read">(stored?.body.trim() ? "read" : "write");
  const pending = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    if (pending.current === null) return;
    const b = pending.current;
    pending.current = null;
    const cur = getNote(getState(), c, id);
    updateNote(c, id, cur ? { body: b } : { body: b, title: weekNoteTitle(track, w), refs: [`${track}:${w.id}`] });
  }, [c, id, track, w]);
  useEffect(() => () => flush(), [flush]);
  useEffect(() => {
    if (pending.current === null && stored && stored.body !== body) setBody(stored.body);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored?.body]);
  const change = (v: string) => {
    setBody(v);
    pending.current = v;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 600);
  };

  const others = notesForWeek(notes, track, w.id).filter((n) => n.id !== id);
  const titles = useCallback(() => notes.filter((n) => !n.deleted).map(displayTitle), [notes]);
  const tags = useCallback(() => [...new Set(notes.flatMap((n) => n.allTags))], [notes]);
  const onFiles = useCallback(async (files: File[]) => {
    const out: string[] = [];
    for (const f of files) out.push(`![image](asset:${await saveImage(f)})`);
    return out.join("\n\n");
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex rounded-lg border border-line p-0.5 text-xs" role="radiogroup" aria-label="View">
          {(["write", "read"] as const).map((m) => (
            <button key={m} role="radio" aria-checked={mode === m} onClick={() => (flush(), setMode(m))} className={`rounded-md px-2.5 py-1 ${mode === m ? "bg-accent-soft font-semibold text-accent" : "text-muted hover:text-fg"}`}>
              {m === "write" ? "Write" : "Read"}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <Link href={noteHref(id)} onClick={flush} className="chip !py-1.5">
            Open full editor
          </Link>
          <button
            className="chip !py-1.5"
            onClick={() => {
              const nid = createNote({ refs: [`${track}:${w.id}`], tags: [] });
              router.push(noteHref(nid));
            }}
          >
            + Another note for this week
          </button>
        </div>
      </div>
      {mode === "write" ? (
        <div className="max-h-[70vh] min-h-40 overflow-auto rounded-xl border border-line bg-panel">
          <NoteEditor className="nb-compact" value={body} onChange={change} titles={titles} tags={tags} onFiles={onFiles} placeholder={placeholder + "  (Markdown, code blocks, Q:/A: flashcards; paste images)"} />
        </div>
      ) : body.trim() ? (
        <div className="rounded-xl border border-line p-4">
          <NotePreview body={body} onToggleTask={(i) => change(toggleTask(body, i))} onOpenNote={(t) => {
              const hit = notes.find((n) => !n.deleted && displayTitle(n).toLowerCase() === t.toLowerCase());
              if (hit) router.push(noteHref(hit.id));
            }} />
        </div>
      ) : (
        <button className="w-full rounded-xl border border-dashed border-line p-4 text-left text-sm text-muted hover:text-fg" onClick={() => setMode("write")}>
          Nothing written yet. Tap to start.
        </button>
      )}
      {others.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">Linked notes</p>
          <ul className="flex flex-wrap gap-1.5">
            {others.map((n) => (
              <li key={n.id}>
                <Link href={noteHref(n.id)} className="chip">
                  {displayTitle(n)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
