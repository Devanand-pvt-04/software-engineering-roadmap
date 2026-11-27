"use client";

import Link from "next/link";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useContent } from "@/lib/content";
import { getState, useStore, useToday } from "@/lib/store";
import { dayKey } from "@/lib/schedule";
import { extractCards } from "@/lib/notes/cards";
import { history, saveImage, snapshot, type Snapshot } from "@/lib/notes/assets";
import { toggleTask, headingId } from "@/lib/notes/render";
import { SNIPPETS } from "@/lib/notes/templates";

const snippet = (id: string) => SNIPPETS.find((x) => x.id === id)!.text;
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
import type { EditorApi } from "./editor";
import dynamic from "next/dynamic";

// CodeMirror loads only when writing, so reading a note stays light.
const NoteEditor = dynamic(() => import("./editor").then((m) => m.NoteEditor), { ssr: false, loading: () => <div className="h-[60vh]" aria-busy="true" /> });
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

  const [chosen, setModeState] = useState<Mode | null>(null);
  const mode: Mode = chosen ?? "write";
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

  // Word count, outline, cards and backlinks trail the typing slightly so keystrokes stay fast.
  const lazyBody = useDeferredValue(body);
  const lazyTitle = useDeferredValue(title);
  const links = useMemo(() => (stored ? backlinks(notes, { ...stored, title: lazyTitle, body: lazyTitle ? "" : lazyBody }) : []), [notes, stored, lazyTitle, lazyBody]);

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
  const cards = extractCards(lazyBody);
  const heads = outline(lazyBody);
  const words = wordCount(lazyBody);
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
        <div className="ml-auto flex items-center gap-1.5">
          <button
            className={`grid size-8 place-items-center rounded-lg text-lg leading-none hover:bg-panel-2 ${n.interview ? "text-java" : "text-muted"}`}
            onClick={() => set({ interview: !n.interview })}
            aria-pressed={!!n.interview}
            title={n.interview ? "In your interview pack" : "Add to your interview pack"}
            aria-label="Interview pack"
          >
            {n.interview ? "★" : "☆"}
          </button>
          <ExportMenu notes={[n]} className="chip !py-1.5" />
          <MoreMenu
            items={[
              { label: n.pinned ? "Unpin" : "Pin to top", run: () => set({ pinned: !n.pinned }) },
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
      <div className="sticky top-[49px] z-10 -mx-1 flex items-center gap-1 rounded-xl border border-line bg-panel px-1 py-1 lg:top-0">
        {editorVisible ? (
          <>
            <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [scrollbar-width:none]">
              <Tool label="Heading" d="M5 4v12M15 4v12M5 10h10" onClick={() => ed()?.linePrefix("## ")} />
              <Tool label="Bold (Ctrl+B)" d="M6 4h5a3 3 0 010 6H6zM6 10h6a3 3 0 010 6H6z" onClick={() => ed()?.wrap("**")} />
              <Tool label="Italic (Ctrl+I)" d="M12 4H8M12 16H8M11 4l-2 12" onClick={() => ed()?.wrap("_")} />
              <Tool label="Inline code (Ctrl+E)" d="M7 6l-4 4 4 4M13 6l4 4-4 4" onClick={() => ed()?.wrap("`", "`", "code")} />
              <Tool label="Link (Ctrl+K)" d="M8 12l4-4M7 9l-2 2a3 3 0 004 4l2-2M13 11l2-2a3 3 0 00-4-4L9 7" onClick={() => ed()?.wrap("[", "](https://)", "link")} />
              <span className="mx-0.5 h-5 w-px shrink-0 bg-line" />
              <Tool label="Bullet list" d="M8 5h9M8 10h9M8 15h9M4 5h.01M4 10h.01M4 15h.01" onClick={() => ed()?.linePrefix("- ")} />
              <Tool label="Checklist" d="M3 5l1.5 1.5L7 4M3 13l1.5 1.5L7 12M10 5h7M10 13h7" onClick={() => ed()?.linePrefix("- [ ] ")} />
              <span className="mx-0.5 h-5 w-px shrink-0 bg-line" />
              <Tool label="Code block" d="M3 4h14v12H3zM6 8l2 2-2 2M10 12h4" onClick={() => ed()?.insert("```java\n|\n```", true)} />
              <Tool label="Table" d="M3 4h14v12H3zM3 8h14M3 12h14M9 4v12" onClick={() => ed()?.insert(snippet("table"), true)} />
              <Tool label="Image (or paste / drop one)" d="M3 4h14v12H3zM3 13l4-4 3 3 2-2 5 5M13 8h.01" onClick={() => fileInput.current?.click()} />
              <Tool label="Sketch (draw by hand)" d="M3 17c3-1 4-6 7-6s2 4 5 4M14 3l3 3-7 7H7v-3z" onClick={() => setSketch({ id: newId(), data: null, isNew: true })} />
              <Tool label="Diagram" d="M3 3h5v4H3zM12 13h5v4h-5zM5.5 7v3h9v3" onClick={() => ed()?.insert(snippet("flow"), true)} />
              <Tool label="Flashcard (Q: / A:)" d="M3 5h14v10H3zM7 9h6M7 12h3" onClick={() => ed()?.insert("Q: |\nA: ", true)} />
            </div>
            <InsertMenu
              items={[
                { label: "Highlight", hint: "==text==", run: () => ed()?.wrap("==") },
                { label: "Numbered list", hint: "1.", run: () => ed()?.linePrefix("1. ") },
                { label: "Quote", hint: ">", run: () => ed()?.linePrefix("> ") },
                { label: "Link to a note", hint: "[[ ]]", run: () => ed()?.wrap("[[", "]]", "Note title") },
                { label: "Inline math", hint: "$ … $", run: () => ed()?.wrap("$", "$", "O(n \\log n)") },
                ...SNIPPETS.filter((x) => !["table", "flow", "card", "todo", "h2", "code"].includes(x.id)).map((x) => ({ label: x.label, hint: x.hint, run: () => ed()?.insert(x.text, true) })),
              ]}
            />
          </>
        ) : (
          <span className="flex-1 px-2 text-xs text-muted">Reading view. Tick boxes and tap sketches to edit them.</span>
        )}
        <div className="flex shrink-0 rounded-lg bg-panel-2 p-0.5 text-xs" role="radiogroup" aria-label="View">
          {(["write", "split", "read"] as Mode[]).map((m) => (
            <button key={m} role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className={`rounded-md px-2 py-1 ${mode === m ? "bg-panel font-semibold text-fg shadow-sm" : "text-muted hover:text-fg"} ${m === "split" ? "hidden md:block" : ""}`}>
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
        {chosen && mode !== "read" && (
        <div className={`card min-h-[60vh] overflow-hidden ${mode === "split" ? "md:max-h-[calc(100vh-14rem)] md:overflow-auto" : ""}`}>
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
        )}
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

/** One quiet line of tags, roadmap links and status; everything editable sits behind "Details". */
function MetaRow({ n, set, allTags, onTag, today }: { n: NoteView; set: (p: Parameters<typeof updateNote>[2]) => void; allTags: string[]; onTag: (t: string) => void; today: string }) {
  const c = useContent();
  const [open, setOpen] = useState(false);
  const [tag, setTag] = useState("");
  const [picking, setPicking] = useState(false);
  const own = n.tags.map(normTag);
  const addTag = () => {
    const t = normTag(tag);
    if (t && !own.includes(t)) set({ tags: [...n.tags, t] });
    setTag("");
  };
  const since = daysSince(n.revisedAt, today);
  const refs = n.refs.map((r) => refView(c, r)).filter((v): v is NonNullable<typeof v> => !!v);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
        {n.allTags.map((t) => (
          <button key={t} onClick={() => onTag(t)} className="hover:text-accent">
            #{t}
          </button>
        ))}
        {refs.map((v) => (
          <Link key={v.ref} href={`/${v.track}/${v.n}`} className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${v.track === "main" ? "bg-main-soft text-main" : "bg-java-soft text-java"}`} title={v.topic ? `${v.label} · ${v.topic}` : v.label}>
            {v.track === "main" ? "Main" : "Java"} W{v.n}
            {v.topic ? ` · ${v.topic.length > 28 ? v.topic.slice(0, 28) + "…" : v.topic}` : ""}
          </Link>
        ))}
        {n.status && <span className={`rounded-md px-1.5 py-0.5 text-xs ${n.status === "revise" ? "bg-warn-soft text-warn" : n.status === "confident" ? "bg-ok-soft text-ok" : "bg-panel-2"}`}>{STATUS_LABEL[n.status]}</span>}
        {n.revisedAt && <span className="text-xs">{since === 0 ? "Revised today" : `Revised ${since}d ago`}</span>}
        <button className="text-xs font-medium text-accent hover:underline" onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? "Hide details" : n.allTags.length || refs.length || n.status ? "Edit details" : "+ Tags, roadmap link, status"}
        </button>
      </div>
      {open && (
        <div className="grid gap-3 rounded-xl border border-line bg-panel p-3 text-sm sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">Tags</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {own.map((t, i) => (
                <span key={t} className="chip">
                  #{t}
                  <button aria-label={`Remove tag ${t}`} className="text-muted hover:text-danger" onClick={() => set({ tags: n.tags.filter((_, j) => j !== i) })}>
                    ×
                  </button>
                </span>
              ))}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addTag();
                }}
              >
                <input className="input !w-28 !rounded-full !px-3 !py-1 text-xs" list="nb-tags" value={tag} onChange={(e) => setTag(e.target.value)} onBlur={addTag} placeholder="add tag" aria-label="Add tag" />
                <datalist id="nb-tags">
                  {allTags.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </form>
            </div>
            <p className="mt-1 text-xs text-muted">You can also type #tag anywhere in the note.</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">How well do I know it</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <select className="input !w-auto !py-1 text-xs" value={n.status ?? ""} onChange={(e) => set({ status: (e.target.value || undefined) as NoteStatus | undefined })} aria-label="How well you know it">
                <option value="">Not set</option>
                {(Object.keys(STATUS_LABEL) as NoteStatus[]).map((k) => (
                  <option key={k} value={k}>
                    {STATUS_LABEL[k]}
                  </option>
                ))}
              </select>
              <button className="chip !py-1.5" onClick={() => set({ revisedAt: today, ...(n.status === "revise" ? { status: "learning" as NoteStatus } : {}) })}>
                {since === 0 ? "✓ Revised today" : "Mark revised today"}
              </button>
            </div>
          </div>
          <div className="sm:col-span-2">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">Roadmap</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {refs.map((v) => (
                <span key={v.ref} className="chip">
                  {v.label}
                  {v.topic ? ` · ${v.topic.length > 40 ? v.topic.slice(0, 40) + "…" : v.topic}` : ""}
                  <button aria-label="Remove link" className="text-muted hover:text-danger" onClick={() => set({ refs: n.refs.filter((x) => x !== v.ref) })}>
                    ×
                  </button>
                </span>
              ))}
              {picking ? (
                <RoadmapPicker
                  onPick={(r) => {
                    if (!n.refs.includes(r)) set({ refs: [...n.refs, r] });
                    setPicking(false);
                  }}
                  onCancel={() => setPicking(false)}
                />
              ) : (
                <button className="chip !border-dashed !py-1.5 text-muted hover:text-fg" onClick={() => setPicking(true)}>
                  + Link a week or topic
                </button>
              )}
            </div>
          </div>
        </div>
      )}
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

export interface InsertItem {
  label: string;
  hint: string;
  run: () => void;
}

/** Sits outside the toolbar's scrolling strip so the menu isn't clipped. */
function InsertMenu({ items }: { items: InsertItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const off = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", off);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", off);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative shrink-0">
      <button type="button" className={`flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium hover:bg-panel-2 hover:text-fg ${open ? "bg-panel-2 text-fg" : "text-muted"}`} onMouseDown={(e) => e.preventDefault()} onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu">
        <Ico d="M10 4v12M4 10h12" className="size-4" /> Insert
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-40 mt-2 max-h-[60vh] w-64 max-w-[calc(100vw-2rem)] overflow-auto rounded-xl border border-line bg-panel p-1 shadow-xl">
          {items.map((s) => (
            <button
              key={s.label}
              role="menuitem"
              className="flex w-full items-baseline justify-between gap-3 rounded-lg px-3 py-1.5 text-left text-sm hover:bg-panel-2"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setOpen(false);
                s.run();
              }}
            >
              {s.label}
              <span className="shrink-0 text-xs text-muted">{s.hint}</span>
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
