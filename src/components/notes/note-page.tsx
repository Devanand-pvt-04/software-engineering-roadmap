"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useContent } from "@/lib/content";
import { getState, useStore, useToday } from "@/lib/store";
import { dayKey } from "@/lib/schedule";
import { extractCards } from "@/lib/notes/cards";
import { history, saveImage, snapshot, type Snapshot } from "@/lib/notes/assets";
import { toggleTask, headingId } from "@/lib/notes/render";
import { SNIPPETS } from "@/lib/notes/templates";
import { blankSketch, type Sketch } from "@/lib/notes/sketch";
import {
  STATUS_LABEL,
  backlinks,
  daysSince,
  displayTitle,
  findByTitle,
  getNote,
  newId,
  normTag,
  outline,
  refView,
  wordCount,
  type NoteStatus,
  type NoteView,
} from "@/lib/notes/model";
import { createNote, getSketch, purgeNote, restoreNote, saveSketch, trashNote, updateNote } from "@/lib/notes/use-notes";
import { NoteEditor, type EditorApi } from "./editor";
import { NotePreview } from "./preview";
import { SketchPad } from "./sketch-pad";
import { ExportMenu } from "./export-menu";

type Mode = "write" | "split" | "read";
const MODE_KEY = "ztd:nb-mode";

function Ico({ d, className = "size-[18px]" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export function NotePage({ id, notes, onBack, onOpen, onTag, onStudy }: { id: string; notes: NoteView[]; onBack: () => void; onOpen: (id: string) => void; onTag: (t: string) => void; onStudy: (n: NoteView) => void }) {
  const c = useContent();
  const s = useStore();
  const stored = useMemo(() => getNote(s, c, id), [s, c, id]);
  const now = useToday();
  const today = now ? dayKey(now) : "";

  // Local draft of the text, saved after a short pause, so typing never waits on the store.
  const [title, setTitle] = useState(stored?.title ?? "");
  const [body, setBody] = useState(stored?.body ?? "");
  const pending = useRef<{ title?: string; body?: string }>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saved, setSaved] = useState(true);

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const p = pending.current;
    if (p.title === undefined && p.body === undefined) return;
    pending.current = {};
    updateNote(c, id, p);
    const n = getNote(getState(), c, id);
    if (n) void snapshot(id, n.title, n.body);
    setSaved(true);
  }, [c, id]);

  const queue = (p: { title?: string; body?: string }) => {
    pending.current = { ...pending.current, ...p };
    setSaved(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 600);
  };

  // Changes from elsewhere (sync, restore) when nothing is waiting to be saved.
  useEffect(() => {
    if (!stored) return;
    if (pending.current.body === undefined && stored.body !== body) setBody(stored.body);
    if (pending.current.title === undefined && stored.title !== title) setTitle(stored.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored?.body, stored?.title]);

  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [flush]);

  const [mode, setModeState] = useState<Mode>("write");
  useEffect(() => {
    let m: Mode | null = null;
    try {
      m = localStorage.getItem(MODE_KEY) as Mode | null;
    } catch {}
    if (!m) m = window.innerWidth >= 1100 ? "split" : "write";
    // A new, empty note always opens ready to type.
    if (m === "read" && !stored?.body.trim()) m = "write";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setModeState(m);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const setMode = (m: Mode) => {
    setModeState(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {}
  };

  const api = useRef<EditorApi | null>(null);
  const [sketch, setSketch] = useState<{ id: string; data: Sketch | null; isNew: boolean } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const titles = useCallback(() => notes.filter((n) => !n.deleted && n.id !== id).map(displayTitle), [notes, id]);
  const allTags = useCallback(() => [...new Set(notes.flatMap((n) => n.allTags))].sort(), [notes]);
  const onFiles = useCallback(async (files: File[]) => {
    const out: string[] = [];
    for (const f of files) {
      const aid = await saveImage(f);
      out.push(`![${f.name.replace(/\.[^.]+$/, "").replace(/[[\]]/g, "") || "image"}](asset:${aid})`);
    }
    return out.join("\n\n");
  }, []);

  if (!stored)
    return (
      <div className="card p-6 text-center">
        <p>This note doesn&apos;t exist any more.</p>
        <button className="btn mt-3" onClick={onBack}>
          Back to notes
        </button>
      </div>
    );

  const n: NoteView = { ...stored, title, body };
  const cards = extractCards(body);
  const heads = outline(body);
  const links = backlinks(notes, n);
  const words = wordCount(body);
  const set = (patch: Parameters<typeof updateNote>[2]) => {
    flush();
    updateNote(c, id, patch);
  };

  const openByTitle = (t: string) => {
    const hit = findByTitle(notes, t);
    if (hit) onOpen(hit.id);
    else if (confirm(`Create a note called “${t}”?`)) onOpen(createNote({ title: t }));
  };
  const editSketch = (sid: string) => setSketch({ id: sid, data: getSketch(sid), isNew: false });

  const ed = () => api.current;
  const editorVisible = mode !== "read";

  return (
    <div className="space-y-3">
      {/* top bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn !px-2.5" onClick={() => (flush(), onBack())}>
          <Ico d="M12 4l-6 6 6 6" className="size-4" /> Notes
        </button>
        <span className="text-xs text-muted" aria-live="polite">
          {saved ? "Saved" : "Saving…"}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <button className={`chip !py-1.5 ${n.pinned ? "!border-accent !text-accent" : ""}`} onClick={() => set({ pinned: !n.pinned })} aria-pressed={!!n.pinned} title="Pin to the top of the list">
            {n.pinned ? "Pinned" : "Pin"}
          </button>
          <button className={`chip !py-1.5 ${n.interview ? "!border-java !text-java" : ""}`} onClick={() => set({ interview: !n.interview })} aria-pressed={!!n.interview} title="Add to your interview pack">
            {n.interview ? "★ Interview pack" : "☆ Interview pack"}
          </button>
          <ExportMenu notes={[n]} className="chip !py-1.5" />
          <MoreMenu
            items={[
              { label: "Version history", run: () => (flush(), setShowHistory(true)) },
              {
                label: "Duplicate",
                run: () => {
                  flush();
                  onOpen(createNote({ title: `${displayTitle(n)} (copy)`, body: n.body, tags: n.tags, refs: n.refs, interview: n.interview }));
                },
              },
              n.deleted ? { label: "Restore from trash", run: () => restoreNote(c, id) } : { label: "Move to trash", run: () => (flush(), trashNote(c, id), onBack()), danger: true },
              ...(n.deleted ? [{ label: "Delete forever", run: () => confirm("Delete this note for good? This can't be undone.") && (purgeNote(id), onBack()), danger: true }] : []),
            ]}
          />
        </div>
      </div>

      {n.deleted && (
        <div className="rounded-lg border border-warn bg-warn-soft px-3 py-2 text-sm">
          This note is in the trash.{" "}
          <button className="font-semibold underline" onClick={() => restoreNote(c, id)}>
            Restore it
          </button>
        </div>
      )}

      {/* title */}
      <input
        className="w-full bg-transparent text-2xl font-bold tracking-tight outline-none placeholder:text-muted/60 sm:text-3xl"
        value={title}
        placeholder={displayTitle({ title: "", body }) === "Untitled note" ? "Untitled note" : displayTitle({ title: "", body })}
        onChange={(e) => {
          setTitle(e.target.value);
          queue({ title: e.target.value });
        }}
        aria-label="Title"
      />

      {/* meta */}
      <MetaRow n={n} set={set} allTags={allTags()} onTag={onTag} today={today} />

      {/* toolbar */}
      <div className="sticky top-[49px] z-10 -mx-1 flex items-center gap-1 rounded-xl border border-line bg-panel/95 px-1 py-1 backdrop-blur lg:top-0">
        <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [scrollbar-width:none]">
          {editorVisible && (
            <>
              <Tool label="Heading" d="M5 4v12M15 4v12M5 10h10" onClick={() => ed()?.linePrefix("## ")} />
              <Tool label="Bold (Ctrl+B)" d="M6 4h5a3 3 0 010 6H6zM6 10h6a3 3 0 010 6H6z" onClick={() => ed()?.wrap("**")} />
              <Tool label="Italic (Ctrl+I)" d="M12 4H8M12 16H8M11 4l-2 12" onClick={() => ed()?.wrap("_")} />
              <Tool label="Highlight" d="M4 16h12M6 12l6-8 3 3-6 7H6z" onClick={() => ed()?.wrap("==")} />
              <Tool label="Inline code (Ctrl+E)" d="M7 6l-4 4 4 4M13 6l4 4-4 4" onClick={() => ed()?.wrap("`", "`", "code")} />
              <Tool label="Link (Ctrl+K)" d="M8 12l4-4M7 9l-2 2a3 3 0 004 4l2-2M13 11l2-2a3 3 0 00-4-4L9 7" onClick={() => ed()?.wrap("[", "](https://)", "link")} />
              <Tool label="Link a note [[ ]]" d="M7 4H4v12h3M13 4h3v12h-3" onClick={() => ed()?.wrap("[[", "]]", "Note title")} />
              <span className="mx-0.5 h-5 w-px shrink-0 bg-line" />
              <Tool label="Bullet list" d="M8 5h9M8 10h9M8 15h9M4 5h.01M4 10h.01M4 15h.01" onClick={() => ed()?.linePrefix("- ")} />
              <Tool label="Numbered list" d="M8 5h9M8 10h9M8 15h9M3 4h1v3M3 14h2l-2 2h2" onClick={() => ed()?.linePrefix("1. ")} />
              <Tool label="Checklist" d="M3 5l1.5 1.5L7 4M3 13l1.5 1.5L7 12M10 5h7M10 13h7" onClick={() => ed()?.linePrefix("- [ ] ")} />
              <Tool label="Quote" d="M4 6h4v4H6l-2 4M12 6h4v4h-2l-2 4" onClick={() => ed()?.linePrefix("> ")} />
              <span className="mx-0.5 h-5 w-px shrink-0 bg-line" />
              <Tool label="Code block" d="M3 4h14v12H3zM6 8l2 2-2 2M10 12h4" onClick={() => ed()?.insert("```java\n|\n```", true)} />
              <Tool label="Table" d="M3 4h14v12H3zM3 8h14M3 12h14M9 4v12" onClick={() => ed()?.insert(SNIPPETS.find((x) => x.id === "table")!.text, true)} />
              <Tool label="Image (or paste / drop one)" d="M3 4h14v12H3zM3 13l4-4 3 3 2-2 5 5M13 8h.01" onClick={() => fileInput.current?.click()} />
              <Tool label="Sketch (draw by hand)" d="M3 17c3-1 4-6 7-6s2 4 5 4M14 3l3 3-7 7H7v-3z" onClick={() => setSketch({ id: newId(), data: null, isNew: true })} extra="!text-accent" />
              <Tool label="Diagram (Mermaid)" d="M3 3h5v4H3zM12 13h5v4h-5zM5.5 7v3h9v3" onClick={() => ed()?.insert(SNIPPETS.find((x) => x.id === "flow")!.text, true)} />
              <Tool label="Math" d="M4 5h6M7 5v10l-3-3M12 9l5 6M17 9l-5 6" onClick={() => ed()?.wrap("$", "$", "O(n \\log n)")} />
              <Tool label="Flashcard (Q: / A:)" d="M3 5h14v10H3zM7 9h6M7 12h3" onClick={() => ed()?.insert("Q: |\nA: ", true)} extra="!text-java" />
              <Tool label="Callout" d="M4 4h12v9H8l-4 3z" onClick={() => ed()?.insert("> [!TIP]\n> |", true)} />
              <InsertMenu onPick={(t) => ed()?.insert(t, true)} />
            </>
          )}
          {!editorVisible && <span className="px-2 text-xs text-muted">Reading view. Tick boxes and click sketches to edit them.</span>}
        </div>
        <div className="flex shrink-0 rounded-lg border border-line p-0.5 text-xs" role="radiogroup" aria-label="View">
          {(["write", "split", "read"] as Mode[]).map((m) => (
            <button key={m} role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className={`rounded-md px-2 py-1 ${mode === m ? "bg-accent-soft font-semibold text-accent" : "text-muted hover:text-fg"} ${m === "split" ? "hidden md:block" : ""}`}>
              {m === "write" ? "Write" : m === "split" ? "Split" : "Read"}
            </button>
          ))}
        </div>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={async (e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = "";
          if (files.length) ed()?.insert((await onFiles(files)) + "\n|", true);
        }}
      />

      {/* editor / preview */}
      <div className={`grid gap-3 ${mode === "split" ? "md:grid-cols-2" : ""}`}>
        <div className={`card min-h-[60vh] overflow-hidden ${mode === "read" ? "hidden" : ""} ${mode === "split" ? "md:max-h-[calc(100vh-14rem)] md:overflow-auto" : ""}`}>
          <NoteEditor
            key={id}
            value={body}
            onChange={(v) => {
              setBody(v);
              queue({ body: v });
            }}
            apiRef={api}
            titles={titles}
            tags={allTags}
            onFiles={onFiles}
            autoFocus={!body}
          />
        </div>
        {mode !== "write" && (
          <div className={`card min-h-[60vh] p-5 sm:p-7 ${mode === "split" ? "hidden md:block md:max-h-[calc(100vh-14rem)] md:overflow-auto" : ""}`}>
            {body.trim() ? (
              <NotePreview
                body={body}
                live
                onOpenNote={openByTitle}
                onTag={onTag}
                onEditSketch={editSketch}
                onToggleTask={(i) => {
                  const nb = toggleTask(body, i);
                  setBody(nb);
                  queue({ body: nb });
                }}
              />
            ) : (
              <p className="text-sm text-muted">Nothing to show yet.</p>
            )}
          </div>
        )}
      </div>

      {/* footer */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span>
          {words} word{words === 1 ? "" : "s"} · {Math.max(1, Math.round(words / 200))} min read
        </span>
        <span>Created {new Date(n.created).toLocaleDateString()}</span>
        <span>Edited {new Date(n.updated).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span>
        <Link href="/notes/guide" className="ml-auto hover:text-accent">
          Formatting guide
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {cards.length > 0 && (
          <section className="card p-4">
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">Flashcards</h2>
            <p className="text-sm">
              {cards.length} card{cards.length === 1 ? "" : "s"} in this note.
            </p>
            <button className="btn mt-2 !py-1.5 text-[13px]" onClick={() => (flush(), onStudy(n))}>
              Study these
            </button>
          </section>
        )}
        {heads.length > 1 && (
          <section className="card p-4">
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">Outline</h2>
            <ul className="space-y-0.5 text-sm">
              {heads.map((h, i) => (
                <li key={i} style={{ paddingLeft: (h.level - 1) * 10 }}>
                  <button
                    className="text-left hover:text-accent"
                    onClick={() => {
                      if (mode === "read") document.getElementById(headingId(h.text))?.scrollIntoView({ behavior: "smooth" });
                      else api.current?.gotoLine(h.line);
                    }}
                  >
                    {h.text}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        {links.length > 0 && (
          <section className="card p-4">
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">Linked from</h2>
            <ul className="space-y-0.5 text-sm">
              {links.map((l) => (
                <li key={l.id}>
                  <button className="text-left hover:text-accent" onClick={() => onOpen(l.id)}>
                    {displayTitle(l)}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {sketch && (
        <SketchPad
          initial={sketch.data ?? blankSketch()}
          onClose={() => setSketch(null)}
          onSave={(data) => {
            saveSketch(sketch.id, data);
            if (sketch.isNew) {
              const md = `![sketch](sketch:${sketch.id})`;
              if (api.current && mode !== "read") api.current.insert(md + "\n|", true);
              else {
                const nb = (body.trimEnd() ? body.trimEnd() + "\n\n" : "") + md + "\n";
                setBody(nb);
                queue({ body: nb });
              }
            }
            setSketch(null);
          }}
        />
      )}
      {showHistory && (
        <HistoryDialog
          noteId={id}
          onClose={() => setShowHistory(false)}
          onRestore={(snap) => {
            void snapshot(id, n.title, n.body, true);
            setTitle(snap.title);
            setBody(snap.body);
            updateNote(c, id, { title: snap.title, body: snap.body });
            setShowHistory(false);
          }}
        />
      )}
    </div>
  );
}

function Tool({ label, d, onClick, extra = "" }: { label: string; d: string; onClick: () => void; extra?: string }) {
  return (
    <button type="button" title={label} aria-label={label} onMouseDown={(e) => e.preventDefault()} onClick={onClick} className={`grid size-8 shrink-0 place-items-center rounded-md text-muted hover:bg-panel-2 hover:text-fg ${extra}`}>
      <Ico d={d} />
    </button>
  );
}

function MetaRow({ n, set, allTags, onTag, today }: { n: NoteView; set: (p: Parameters<typeof updateNote>[2]) => void; allTags: string[]; onTag: (t: string) => void; today: string }) {
  const c = useContent();
  const [tag, setTag] = useState("");
  const [picking, setPicking] = useState(false);
  const bodyOnly = n.allTags.filter((t) => !n.tags.map(normTag).includes(t));
  const addTag = () => {
    const t = normTag(tag);
    if (t && !n.tags.includes(t)) set({ tags: [...n.tags, t] });
    setTag("");
  };
  const since = daysSince(n.revisedAt, today);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {n.tags.map((t) => (
          <span key={t} className="chip">
            <button onClick={() => onTag(normTag(t))} className="hover:text-accent">
              #{normTag(t)}
            </button>
            <button aria-label={`Remove tag ${t}`} className="text-muted hover:text-danger" onClick={() => set({ tags: n.tags.filter((x) => x !== t) })}>
              ×
            </button>
          </span>
        ))}
        {bodyOnly.map((t) => (
          <button key={t} className="chip opacity-70 hover:text-accent" title="Tag written in the note" onClick={() => onTag(t)}>
            #{t}
          </button>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addTag();
          }}
        >
          <input className="input !w-32 !rounded-full !px-3 !py-1 text-xs" list="nb-tags" value={tag} onChange={(e) => setTag(e.target.value)} onBlur={addTag} placeholder="+ tag" aria-label="Add tag" />
          <datalist id="nb-tags">
            {allTags.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </form>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {n.refs.map((r) => {
          const v = refView(c, r);
          if (!v) return null;
          return (
            <span key={r} className={`chip ${v.track === "main" ? "!bg-main-soft !text-main" : "!bg-java-soft !text-java"}`}>
              <Link href={`/${v.track}/${v.n}`} className="hover:underline">
                {v.label}
                {v.topic ? ` · ${v.topic.length > 40 ? v.topic.slice(0, 40) + "…" : v.topic}` : ""}
              </Link>
              <button aria-label="Remove link" className="opacity-60 hover:opacity-100" onClick={() => set({ refs: n.refs.filter((x) => x !== r) })}>
                ×
              </button>
            </span>
          );
        })}
        {picking ? (
          <RoadmapPicker
            onPick={(r) => {
              if (!n.refs.includes(r)) set({ refs: [...n.refs, r] });
              setPicking(false);
            }}
            onCancel={() => setPicking(false)}
          />
        ) : (
          <button className="chip !border-dashed text-muted hover:text-fg" onClick={() => setPicking(true)}>
            + Link to roadmap
          </button>
        )}
        <span className="mx-1 h-4 w-px bg-line" />
        <select
          className="input !w-auto !rounded-full !px-3 !py-1 text-xs"
          value={n.status ?? ""}
          onChange={(e) => set({ status: (e.target.value || undefined) as NoteStatus | undefined })}
          aria-label="How well you know it"
        >
          <option value="">How well do I know it?</option>
          {(Object.keys(STATUS_LABEL) as NoteStatus[]).map((k) => (
            <option key={k} value={k}>
              {STATUS_LABEL[k]}
            </option>
          ))}
        </select>
        <button className="chip" onClick={() => set({ revisedAt: today, ...(n.status === "revise" ? { status: "learning" as NoteStatus } : {}) })} title="Mark that you went over this note today">
          {since === 0 ? "✓ Revised today" : n.revisedAt ? `Revised ${since}d ago · mark again` : "Mark revised"}
        </button>
      </div>
    </div>
  );
}

function RoadmapPicker({ onPick, onCancel }: { onPick: (ref: string) => void; onCancel: () => void }) {
  const c = useContent();
  const [track, setTrack] = useState(c.tracks[0]);
  const weeks = c.weeks[track] ?? [];
  const [weekId, setWeekId] = useState("");
  const w = weeks.find((x) => x.id === weekId);
  return (
    <span className="flex flex-wrap items-center gap-1.5 rounded-xl border border-line bg-panel-2 p-1.5">
      {c.tracks.length > 1 && (
        <select className="input !w-auto !py-1 text-xs" value={track} onChange={(e) => (setTrack(e.target.value as typeof track), setWeekId(""))} aria-label="Track">
          {c.tracks.map((t) => (
            <option key={t} value={t}>
              {t === "main" ? "Main track" : "Java + DSA"}
            </option>
          ))}
        </select>
      )}
      <select className="input !w-auto max-w-[16rem] !py-1 text-xs" value={weekId} onChange={(e) => setWeekId(e.target.value)} aria-label="Week">
        <option value="">Pick a week…</option>
        {weeks.map((x) => (
          <option key={x.id} value={x.id}>
            W{x.n}: {x.title}
          </option>
        ))}
      </select>
      {w && w.mustKnow.length > 0 && (
        <select className="input !w-auto max-w-[16rem] !py-1 text-xs" defaultValue="" onChange={(e) => e.target.value !== "" && onPick(`${track}:${w.id}:${e.target.value}`)} aria-label="Topic">
          <option value="">Whole week, or pick a topic…</option>
          {w.mustKnow.map((m, i) => (
            <option key={i} value={i}>
              {m.t}
            </option>
          ))}
        </select>
      )}
      <button className="btn !py-1 text-xs" disabled={!w} onClick={() => w && onPick(`${track}:${w.id}`)}>
        Link week
      </button>
      <button className="text-xs text-muted hover:text-fg" onClick={onCancel}>
        Cancel
      </button>
    </span>
  );
}

function InsertMenu({ onPick }: { onPick: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", off);
    return () => document.removeEventListener("mousedown", off);
  }, [open]);
  return (
    <div ref={ref} className="relative shrink-0">
      <button type="button" className="flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted hover:bg-panel-2 hover:text-fg" onMouseDown={(e) => e.preventDefault()} onClick={() => setOpen(!open)} aria-expanded={open}>
        <Ico d="M10 4v12M4 10h12" className="size-4" /> Insert
      </button>
      {open && (
        <div className="fixed left-2 right-2 z-40 mt-1 max-h-[60vh] overflow-auto rounded-xl border border-line bg-panel p-1 shadow-xl sm:absolute sm:left-auto sm:right-0 sm:w-64">
          {SNIPPETS.map((s) => (
            <button
              key={s.id}
              className="flex w-full items-baseline justify-between gap-3 rounded-lg px-3 py-1.5 text-left text-sm hover:bg-panel-2"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onPick(s.text);
                setOpen(false);
              }}
            >
              {s.label}
              <span className="text-xs text-muted">{s.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MoreMenu({ items }: { items: { label: string; run: () => void; danger?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", off);
    return () => document.removeEventListener("mousedown", off);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button className="chip !py-1.5" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="More actions">
        •••
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-1 w-52 rounded-xl border border-line bg-panel p-1 shadow-xl" role="menu">
          {items.map((i) => (
            <button key={i.label} role="menuitem" className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-panel-2 ${i.danger ? "text-danger" : ""}`} onClick={() => (setOpen(false), i.run())}>
              {i.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryDialog({ noteId, onClose, onRestore }: { noteId: string; onClose: () => void; onRestore: (s: Snapshot) => void }) {
  const [list, setList] = useState<Snapshot[] | null>(null);
  const [pick, setPick] = useState<Snapshot | null>(null);
  useEffect(() => {
    history(noteId).then((l) => {
      setList(l);
      setPick(l[0] ?? null);
    });
  }, [noteId]);
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/40 p-3" role="dialog" aria-modal="true" aria-label="Version history" onClick={onClose}>
      <div className="card flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="font-semibold">Version history</h2>
          <button className="text-muted hover:text-fg" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {list === null ? (
          <p className="p-4 text-sm text-muted">Loading…</p>
        ) : list.length === 0 ? (
          <p className="p-4 text-sm text-muted">No earlier versions on this device yet. A version is kept every few minutes while you write.</p>
        ) : (
          <div className="grid min-h-0 flex-1 sm:grid-cols-[14rem_1fr]">
            <ul className="max-h-40 overflow-auto border-b border-line p-1 sm:max-h-none sm:border-b-0 sm:border-r">
              {list.map((x) => (
                <li key={x.t}>
                  <button className={`w-full rounded-lg px-3 py-2 text-left text-sm ${pick?.t === x.t ? "bg-accent-soft text-accent" : "hover:bg-panel-2"}`} onClick={() => setPick(x)}>
                    {new Date(x.t).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    <span className="block text-xs text-muted">{wordCount(x.body)} words</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="min-h-0 overflow-auto p-4">
              {pick && (
                <>
                  <button className="btn btn-primary mb-3" onClick={() => onRestore(pick)}>
                    Restore this version
                  </button>
                  <h3 className="mb-2 text-lg font-bold">{pick.title || "Untitled"}</h3>
                  <NotePreview body={pick.body} />
                </>
              )}
            </div>
          </div>
        )}
        <p className="border-t border-line px-4 py-2 text-xs text-muted">Versions are kept in this browser (the last 50 per note). Restoring keeps the current text as a version too.</p>
      </div>
    </div>
  );
}
