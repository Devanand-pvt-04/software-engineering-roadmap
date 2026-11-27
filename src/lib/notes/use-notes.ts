"use client";

import { useMemo } from "react";
import { useContent, type ClientContent } from "../content";
import { getState, setEntry, useStore } from "../store";
import { extractCards, isDue, type CardRec } from "./cards";
import { allNotes, blankNote, cardKey, getNote, newId, noteKey, sketchKey, toNote, type Note, type NoteView } from "./model";
import type { Sketch } from "./sketch";

export function useNotes(): NoteView[] {
  const s = useStore();
  const c = useContent();
  return useMemo(() => allNotes(s, c), [s, c]);
}

export function createNote(partial: Partial<Note> = {}): string {
  const id = newId();
  setEntry(noteKey(id), blankNote(partial));
  return id;
}

/** Saves changes to a note. An old plain-text week note becomes a full note here. */
export function updateNote(c: ClientContent, id: string, patch: Partial<Note>, touch = true) {
  const cur = getNote(getState(), c, id);
  const base: Note = cur ? toNote(cur) : blankNote();
  const next: Note = { ...base, ...patch };
  if (touch) next.updated = Date.now();
  setEntry(noteKey(id), toNote(next));
}

export function trashNote(c: ClientContent, id: string) {
  updateNote(c, id, { deleted: Date.now() }, false);
}
export function restoreNote(c: ClientContent, id: string) {
  const cur = getNote(getState(), c, id);
  if (!cur) return;
  const n = toNote(cur);
  delete n.deleted;
  setEntry(noteKey(id), n);
}
/** Gone for good: the entry becomes a tombstone so other devices drop it too. */
export function purgeNote(id: string) {
  setEntry(noteKey(id), null);
  if (id.startsWith("w-")) setEntry(`nt:${id.slice(2)}`, null);
}

export function getSketch(id: string): Sketch | null {
  return (getState().entries[sketchKey(id)]?.v as Sketch | null) ?? null;
}
export function saveSketch(id: string, sk: Sketch) {
  setEntry(sketchKey(id), sk);
}

export interface DeckCard {
  noteId: string;
  noteTitle: string;
  id: string;
  q: string;
  a: string;
  rec?: CardRec;
}

export function deck(notes: NoteView[], entries: Record<string, { v: unknown }>): DeckCard[] {
  const out: DeckCard[] = [];
  for (const n of notes) {
    if (n.deleted) continue;
    for (const c of extractCards(n.body)) {
      const rec = (entries[cardKey(n.id, c.id)]?.v as CardRec | null) ?? undefined;
      out.push({ noteId: n.id, noteTitle: n.title, id: c.id, q: c.q, a: c.a, rec });
    }
  }
  return out;
}

export function dueCount(notes: NoteView[], entries: Record<string, { v: unknown }>, today: string) {
  const d = deck(notes, entries);
  return { due: d.filter((x) => x.rec && isDue(x.rec, today)).length, fresh: d.filter((x) => !x.rec).length, total: d.length };
}
