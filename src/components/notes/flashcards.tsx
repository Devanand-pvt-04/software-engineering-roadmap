"use client";

import { useEffect, useMemo, useState } from "react";
import { grade, isDue, preview, type Grade } from "@/lib/notes/cards";
import { cardKey, displayTitle, type NoteView } from "@/lib/notes/model";
import { deck, type DeckCard } from "@/lib/notes/use-notes";
import { dayKey } from "@/lib/schedule";
import { getState, setEntry, useToday } from "@/lib/store";
import { NotePreview } from "./preview";

const GRADES: { g: Grade; label: string; cls: string }[] = [
  { g: "again", label: "Again", cls: "!border-danger !text-danger" },
  { g: "hard", label: "Hard", cls: "!border-warn !text-warn" },
  { g: "good", label: "Good", cls: "!border-ok !text-ok" },
  { g: "easy", label: "Easy", cls: "!border-accent !text-accent" },
];

/** A study session over the flashcards in `notes`: due cards first, then up to `newLimit` new ones. */
export function Flashcards({ notes, title, onClose, onOpenNote }: { notes: NoteView[]; title: string; onClose: () => void; onOpenNote: (id: string) => void }) {
  const now = useToday();
  const today = now ? dayKey(now) : "";
  const [newLimit, setNewLimit] = useState(20);
  const [cram, setCram] = useState(false);
  // The queue is fixed when the session starts; "Again" puts a card at the back.
  const initial = useMemo(() => {
    if (!today) return [];
    const all = deck(notes, getState().entries);
    if (cram) return shuffle(all);
    const due = all.filter((c) => c.rec && isDue(c.rec, today)).sort((a, b) => a.rec!.due.localeCompare(b.rec!.due));
    const fresh = all.filter((c) => !c.rec).slice(0, newLimit);
    return [...due, ...fresh];
  }, [notes, today, newLimit, cram]);
  const [queue, setQueue] = useState<DeckCard[] | null>(null);
  const q = queue ?? initial;
  const [shown, setShown] = useState(false);
  const [done, setDone] = useState(0);
  const card = q[0];
  const total = deck(notes, getState().entries).length;

  const answer = (g: Grade) => {
    if (!card) return;
    const rec = grade(card.rec, g, today);
    if (!cram) setEntry(cardKey(card.noteId, card.id), rec);
    const rest = q.slice(1);
    setQueue(g === "again" ? [...rest, { ...card, rec: cram ? card.rec : rec }] : rest);
    setShown(false);
    if (g !== "again") setDone((d) => d + 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea,select,[contenteditable]")) return;
      if (e.key === "Escape") onClose();
      if (!card) return;
      if (!shown && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setShown(true);
      } else if (shown && ["1", "2", "3", "4"].includes(e.key)) answer(GRADES[Number(e.key) - 1].g);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const left = q.length;
  const pv = card ? preview(card.rec, today) : null;
  const note = card ? notes.find((n) => n.id === card.noteId) : null;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <button className="text-sm text-muted hover:text-fg" onClick={onClose}>
            ← Back
          </button>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Flashcards</h1>
          <p className="text-sm text-muted">
            {title} · {total} card{total === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label className="flex items-center gap-1.5 text-muted">
            New per session
            <select className="input !w-auto !py-1" value={newLimit} onChange={(e) => (setNewLimit(Number(e.target.value)), setQueue(null))}>
              {[0, 10, 20, 50, 1000].map((n) => (
                <option key={n} value={n}>
                  {n === 1000 ? "All" : n}
                </option>
              ))}
            </select>
          </label>
          <button className={`chip !py-1.5 ${cram ? "!border-accent !text-accent" : ""}`} onClick={() => (setCram(!cram), setQueue(null), setDone(0))} title="Go through every card without changing the schedule">
            {cram ? "Practice mode on" : "Practice all"}
          </button>
        </div>
      </header>

      {card ? (
        <>
          <div className="flex items-center gap-3 text-xs text-muted">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-2">
              <div className="h-full bg-accent transition-[width]" style={{ width: `${(done / Math.max(1, done + left)) * 100}%` }} />
            </div>
            <span className="tabular-nums">
              {done} done · {left} left
            </span>
          </div>
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-line px-5 py-2 text-xs text-muted">
              <button className="truncate hover:text-accent" onClick={() => onOpenNote(card.noteId)}>
                {note ? displayTitle(note) : "Note"}
              </button>
              <span>{!card.rec ? "New" : card.rec.ivl === 0 ? "Learning" : `Every ${card.rec.ivl}d`}</span>
            </div>
            <div className="px-5 py-6">
              <NotePreview body={card.q} className="text-[17px]" />
            </div>
            {shown ? (
              <div className="border-t border-dashed border-line bg-panel-2 px-5 py-5">
                <NotePreview body={card.a} />
              </div>
            ) : null}
          </section>
          {shown ? (
            <div className="grid grid-cols-4 gap-2">
              {GRADES.map((x, i) => (
                <button key={x.g} className={`btn flex-col justify-center !gap-0 !py-2 ${x.cls}`} onClick={() => answer(x.g)}>
                  <span>{x.label}</span>
                  <span className="text-[11px] font-normal opacity-70">
                    {cram ? `key ${i + 1}` : pv![x.g]}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <button className="btn btn-primary w-full justify-center !py-3" onClick={() => setShown(true)}>
              Show answer <span className="text-xs opacity-70">(space)</span>
            </button>
          )}
          <p className="text-center text-xs text-muted">Say the answer out loud before you reveal it. Keys: space to reveal, 1–4 to grade.</p>
        </>
      ) : (
        <section className="card p-6 text-center">
          <p className="text-lg font-semibold">{done ? `Session done: ${done} card${done === 1 ? "" : "s"} reviewed.` : total ? "Nothing due right now." : "No flashcards yet."}</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            {total
              ? "Cards come back on a schedule: soon if you found them hard, weeks later once you know them. Use Practice all to go through everything anyway."
              : "Write cards inside any note: a line starting Q: followed by a line starting A:, or a line like “term :: meaning”."}
          </p>
          <button className="btn mt-4" onClick={onClose}>
            Back to notes
          </button>
        </section>
      )}
    </div>
  );
}

function shuffle<T>(a: T[]): T[] {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}
