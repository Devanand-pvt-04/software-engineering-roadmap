"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useContent } from "@/lib/content";
import { setEntries, useHydrated, useStore, useToday } from "@/lib/store";
import { dayKey } from "@/lib/schedule";
import { putImage, saveImage } from "@/lib/notes/assets";
import { STATUS_LABEL, daysSince, displayTitle, snippet, type NoteView } from "@/lib/notes/model";
import { extractCards } from "@/lib/notes/cards";
import { TEMPLATES } from "@/lib/notes/templates";
import { createNote, dueCount, purgeNote, restoreNote, useNotes } from "@/lib/notes/use-notes";
import { APP_SLUG } from "@/lib/brand";
import dynamic from "next/dynamic";
import { ExportMenu } from "./export-menu";

// The editor, renderer and flashcard player are the heavy parts; the list loads without them.
const Loading = () => <div className="h-96 animate-pulse rounded-xl bg-panel-2/60" aria-busy="true" />;
const NotePage = dynamic(() => import("./note-page").then((m) => m.NotePage), { ssr: false, loading: Loading });
const Flashcards = dynamic(() => import("./flashcards").then((m) => m.Flashcards), { ssr: false, loading: Loading });
import { JournalPanel } from "../journal-view";

type View = "all" | "pinned" | "interview" | "revise" | "cards" | "trash";
const VIEWS: { id: View; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pinned", label: "Pinned" },
  { id: "interview", label: "Interview pack" },
  { id: "revise", label: "To revise" },
  { id: "cards", label: "With flashcards" },
  { id: "trash", label: "Trash" },
];
type Sort = "updated" | "created" | "title";

type Route = { kind: "list" } | { kind: "note"; id: string } | { kind: "study"; scope: string };
function parseHash(): Route {
  const h = decodeURIComponent(window.location.hash.slice(1));
  if (h.startsWith("note=")) return { kind: "note", id: h.slice(5) };
  if (h.startsWith("study")) return { kind: "study", scope: h.slice(6) || "all" };
  return { kind: "list" };
}
function go(hash: string) {
  if (window.location.hash.slice(1) === hash) return;
  if (hash) window.location.hash = hash;
  else history.pushState(null, "", window.location.pathname + window.location.search);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

/** Too stale to trust: in the interview pack but not gone over in this many days. */
const STALE_DAYS = 30;

export function NotesApp() {
  const c = useContent();
  const s = useStore();
  const hydrated = useHydrated();
  const notes = useNotes();
  const now = useToday();
  const today = now ? dayKey(now) : "";
  const [route, setRoute] = useState<Route>({ kind: "list" });
  useEffect(() => {
    const on = () => {
      setRoute(parseHash());
      window.scrollTo(0, 0);
    };
    on();
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);

  const [q, setQ] = useState("");
  const [view, setView] = useState<View>("all");
  const [tag, setTag] = useState<string | null>(null);
  const [trackF, setTrackF] = useState<"" | "main" | "java">("");
  const [sort, setSort] = useState<Sort>("updated");
  const [msg, setMsg] = useState("");

  const open = useCallback((id: string) => go(`note=${encodeURIComponent(id)}`), []);
  const pickTag = useCallback((t: string) => {
    setTag(t);
    setView("all");
    go("");
  }, []);

  const toRevise = (n: NoteView) => n.status === "revise" || (!!n.interview && daysSince(n.revisedAt ?? new Date(n.updated).toISOString().slice(0, 10), today) > STALE_DAYS);
  const live = notes.filter((n) => !n.deleted);
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const list = (() => {
    let l = view === "trash" ? notes.filter((n) => n.deleted) : notes.filter((n) => !n.deleted);
    if (view === "pinned") l = l.filter((n) => n.pinned);
    if (view === "interview") l = l.filter((n) => n.interview);
    if (view === "revise") l = l.filter(toRevise);
    if (view === "cards") l = l.filter((n) => extractCards(n.body).length);
    if (tag) l = l.filter((n) => n.allTags.includes(tag));
    if (trackF) l = l.filter((n) => n.refs.some((r) => r.startsWith(trackF + ":")));
    if (terms.length)
      l = l.filter((n) => {
        const hay = `${displayTitle(n)}\n${n.body}\n${n.allTags.join(" ")}`.toLowerCase();
        return terms.every((t) => hay.includes(t));
      });
    const by = sort === "title" ? (a: NoteView, b: NoteView) => displayTitle(a).localeCompare(displayTitle(b)) : sort === "created" ? (a: NoteView, b: NoteView) => b.created - a.created : (a: NoteView, b: NoteView) => b.updated - a.updated;
    return [...l].sort((a, b) => (view !== "trash" && !!b.pinned !== !!a.pinned ? (b.pinned ? 1 : -1) : by(a, b)));
  })();

  const tagCounts = (() => {
    const m = new Map<string, number>();
    for (const n of live) for (const t of n.allTags) m.set(t, (m.get(t) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  })();
  const cards = today ? dueCount(live, s.entries, today) : { due: 0, fresh: 0, total: 0 };
  const reviseCount = live.filter(toRevise).length;

  // ---- import ----
  const fileRef = useRef<HTMLInputElement>(null);
  const importFiles = async (files: File[]) => {
    const [{ unzipSync, strFromU8 }, { isBackup, parseMarkdownFile }] = await Promise.all([import("fflate"), import("@/lib/notes/export")]);
    let made = 0;
    let restored = 0;
    for (const f of files) {
      if (/\.json$/i.test(f.name)) {
        const data = JSON.parse(await f.text());
        if (!isBackup(data)) throw new Error(`${f.name} isn't a notes backup`);
        setEntries(Object.entries(data.entries).map(([key, e]) => ({ key, v: e.v, t: e.t })));
        for (const [id, url] of Object.entries(data.images)) if (url) await putImage(id, url);
        restored += Object.keys(data.entries).filter((k) => k.startsWith("nb:")).length;
      } else if (/\.zip$/i.test(f.name)) {
        const zip = unzipSync(new Uint8Array(await f.arrayBuffer()));
        const imgs = new Map<string, string>();
        for (const [path, bytes] of Object.entries(zip)) {
          if (!/\.(png|jpe?g|gif|webp|svg|avif)$/i.test(path)) continue;
          const type = path.endsWith(".svg") ? "image/svg+xml" : `image/${path.split(".").pop()!.toLowerCase().replace("jpg", "jpeg")}`;
          imgs.set(path.split("/").pop()!, await saveImage(new Blob([bytes as BlobPart], { type })));
        }
        for (const [path, bytes] of Object.entries(zip)) {
          if (!/\.(md|markdown|txt)$/i.test(path) || path.includes("__MACOSX")) continue;
          const p = parseMarkdownFile(path.split("/").pop()!, strFromU8(bytes));
          const body = p.body
            .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (all, alt, src) => {
              const id = imgs.get(decodeURIComponent(src).split("/").pop()!);
              return id ? `![${alt}](asset:${id})` : all;
            })
            .replace(/!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g, (all, src) => {
              const id = imgs.get(src.split("/").pop()!);
              return id ? `![${src}](asset:${id})` : all;
            });
          createNote({ ...p, body });
          made++;
        }
      } else {
        createNote(parseMarkdownFile(f.name, await f.text()));
        made++;
      }
    }
    return [made && `${made} note${made === 1 ? "" : "s"} imported`, restored && `${restored} note${restored === 1 ? "" : "s"} restored from backup`].filter(Boolean).join(", ") || "Nothing to import.";
  };

  const studyNotes = (scope: string): { notes: NoteView[]; title: string } => {
    if (scope.startsWith("note:")) {
      const n = notes.find((x) => x.id === scope.slice(5));
      return { notes: n ? [n] : [], title: n ? displayTitle(n) : "Note" };
    }
    if (scope === "interview") return { notes: live.filter((n) => n.interview), title: "Interview pack" };
    if (scope.startsWith("tag:")) return { notes: live.filter((n) => n.allTags.includes(scope.slice(4))), title: `#${scope.slice(4)}` };
    return { notes: live, title: "All notes" };
  };

  if (!hydrated) return <div className="h-96" aria-busy="true" />;

  if (route.kind === "note") return <NotePage key={route.id} id={route.id} notes={notes} onBack={() => go("")} onOpen={open} onTag={pickTag} onStudy={(n) => go(`study=note:${n.id}`)} />;
  if (route.kind === "study") {
    const st = studyNotes(route.scope);
    return <Flashcards notes={st.notes} title={st.title} onClose={() => go("")} onOpenNote={open} />;
  }

  const newFrom = (tid: string) => {
    const t = TEMPLATES.find((x) => x.id === tid)!;
    open(createNote({ title: t.title, body: t.body, tags: t.tags, interview: t.interview, ...(trackF ? {} : {}) }));
  };

  return (
    <div className="space-y-5">
      <header>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Notes</h1>
          <div className="flex flex-wrap gap-2">
            <NewMenu onPick={newFrom} />
          </div>
        </div>
        <p className="mt-2 max-w-2xl text-[15px] text-muted">
          Code, diagrams, sketches and flashcards, linked to the roadmap and ready for interview prep.
        </p>
      </header>

      {/* study strip */}
      {(cards.total > 0 || reviseCount > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {cards.total > 0 && (
            <button className="card flex items-center justify-between gap-3 p-4 text-left hover:border-accent" onClick={() => go("study")}>
              <span>
                <span className="block text-sm font-semibold">Flashcards</span>
                <span className="block text-xs text-muted">
                  {cards.due} due · {cards.fresh} new · {cards.total} in all
                </span>
              </span>
              <span className="btn btn-primary !py-1.5 text-[13px]">Study</span>
            </button>
          )}
          {reviseCount > 0 && (
            <button className="card flex items-center justify-between gap-3 p-4 text-left hover:border-warn" onClick={() => (setView("revise"), setTag(null))}>
              <span>
                <span className="block text-sm font-semibold">To revise</span>
                <span className="block text-xs text-muted">
                  {reviseCount} note{reviseCount === 1 ? "" : "s"} marked for revision or not gone over in {STALE_DAYS}+ days
                </span>
              </span>
              <span className="btn !py-1.5 text-[13px]">Show</span>
            </button>
          )}
        </div>
      )}

      {/* search + filters */}
      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input className="input flex-1" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your notes" aria-label="Search notes" />
          <div className="flex gap-2">
            {c.tracks.length > 1 && (
              <select className="input !w-auto" value={trackF} onChange={(e) => setTrackF(e.target.value as typeof trackF)} aria-label="Track">
                <option value="">Any track</option>
                <option value="main">Main track</option>
                <option value="java">Java + DSA</option>
              </select>
            )}
            <select className="input !w-auto" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
              <option value="updated">Last edited</option>
              <option value="created">Newest</option>
              <option value="title">A–Z</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {VIEWS.map((v) => (
            <button key={v.id} onClick={() => setView(v.id)} aria-pressed={view === v.id} className={`chip !px-3 !py-1.5 ${view === v.id ? "!border-accent !text-accent" : ""}`}>
              {v.label}
            </button>
          ))}
          {tag && (
            <button className="chip !border-accent !px-3 !py-1.5 !text-accent" onClick={() => setTag(null)}>
              #{tag} ×
            </button>
          )}
        </div>
        {tagCounts.length > 0 && (
          <details className="text-sm">
            <summary className="cursor-pointer text-xs text-muted hover:text-fg">Tags ({tagCounts.length})</summary>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tagCounts.map(([t, n]) => (
                <button key={t} className={`chip ${tag === t ? "!border-accent !text-accent" : ""}`} onClick={() => setTag(tag === t ? null : t)}>
                  #{t} <b>{n}</b>
                </button>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* list */}
      <div className="flex items-center justify-between gap-2 text-xs text-muted">
        <span>
          {list.length} note{list.length === 1 ? "" : "s"}
        </span>
        <div className="flex items-center gap-1.5">
          {view === "trash" && list.length > 0 && (
            <button className="chip !py-1.5 text-danger" onClick={() => confirm(`Delete ${list.length} notes for good?`) && list.forEach((n) => purgeNote(n.id))}>
              Empty trash
            </button>
          )}
          {view !== "trash" && list.some((n) => extractCards(n.body).length) && (
            <button className="chip !py-1.5" onClick={() => go(view === "interview" ? "study=interview" : tag ? `study=tag:${tag}` : "study")}>
              Study these cards
            </button>
          )}
          {view !== "trash" && <ExportMenu notes={list} label={list.length === live.length ? "Export all" : "Export these"} title={view === "interview" ? "Interview pack" : tag ? `#${tag} notes` : undefined} className="chip !py-1.5" />}
        </div>
      </div>
      {list.length === 0 ? (
        <section className="card p-6 text-center text-[15px]">
          {live.length === 0 ? (
            <>
              <p className="font-semibold">No notes yet.</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted">Start one from a template, or open any week and write in its notes box. Notes you write on a week page show up here too.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {TEMPLATES.slice(1, 5).map((t) => (
                  <button key={t.id} className="btn" onClick={() => newFrom(t.id)}>
                    {t.name}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-muted">No notes match.</p>
          )}
        </section>
      ) : (
        <ul className="grid gap-2">
          {list.map((n) => (
            <li key={n.id}>
              <NoteCard n={n} onOpen={() => open(n.id)} onRestore={view === "trash" ? () => restoreNote(c, n.id) : undefined} />
            </li>
          ))}
        </ul>
      )}

      {/* import / backup */}
      <details className="group card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted group-hover:text-fg">Import and backup</span>
          <span className="text-xs text-muted transition-transform group-open:rotate-90">›</span>
        </summary>
        <div className="space-y-3 px-5 pb-5 text-sm">
          <p className="text-muted">
            Bring in Markdown files (.md, .txt), a folder zipped up (.zip, e.g. an Obsidian vault, images included), or a backup made here. A backup holds every note,
            sketch, image and flashcard schedule.
          </p>
          <div className="flex flex-wrap gap-2">
            <button className="btn" onClick={() => fileRef.current?.click()}>
              Import files
            </button>
            <button className="btn" onClick={async () => {
                const { download, exportBackup } = await import("@/lib/notes/export");
                download(`${APP_SLUG}-notes-backup-${today}.json`, await exportBackup(s), "application/json");
              }}>
              Download backup (.json)
            </button>
          </div>
          {msg && <p className="text-sm">{msg}</p>}
          <input
            ref={fileRef}
            type="file"
            hidden
            multiple
            accept=".md,.markdown,.txt,.json,.zip,text/markdown,text/plain,application/json,application/zip"
            onChange={async (e) => {
              const files = [...(e.target.files ?? [])];
              e.target.value = "";
              try {
                setMsg(await importFiles(files));
              } catch (err) {
                setMsg(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
              }
            }}
          />
        </div>
      </details>

      {/* the plan's long-running journals */}
      <JournalPanel />
    </div>
  );
}

function NoteCard({ n, onOpen, onRestore }: { n: NoteView; onOpen: () => void; onRestore?: () => void }) {
  const c = useContent();
  const cards = extractCards(n.body).length;
  const refs = n.refs
    .map((r) => {
      const [t, wid] = r.split(":");
      const w = c.weeks[t as "main" | "java"]?.find((x) => x.id === wid);
      return w ? `${t === "main" ? "Main" : "Java"} W${w.n}` : null;
    })
    .filter(Boolean);
  return (
    <div className="card flex gap-3 p-4 hover:border-muted">
      <button className="min-w-0 flex-1 text-left" onClick={onOpen}>
        <div className="flex items-baseline gap-2">
          {n.pinned && <span className="text-xs text-accent">Pinned</span>}
          {n.interview && <span className="text-xs text-java">★</span>}
          <h3 className="truncate font-semibold">{displayTitle(n)}</h3>
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm text-muted">{snippet(n.body) || "Empty"}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted">
          {[...new Set(refs)].map((r) => (
            <span key={r} className="rounded-md bg-panel-2 px-1.5 py-0.5">
              {r}
            </span>
          ))}
          {n.allTags.slice(0, 5).map((t) => (
            <span key={t}>#{t}</span>
          ))}
          {n.status && <span className={`rounded-md px-1.5 py-0.5 ${n.status === "revise" ? "bg-warn-soft text-warn" : n.status === "confident" ? "bg-ok-soft text-ok" : "bg-panel-2"}`}>{STATUS_LABEL[n.status]}</span>}
          {cards > 0 && (
            <span>
              {cards} card{cards === 1 ? "" : "s"}
            </span>
          )}
          <span className="ml-auto">{new Date(n.updated).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
        </div>
      </button>
      {onRestore && (
        <button className="btn self-center !py-1.5 text-[13px]" onClick={onRestore}>
          Restore
        </button>
      )}
    </div>
  );
}

function NewMenu({ onPick }: { onPick: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", off);
    return () => document.removeEventListener("mousedown", off);
  }, [open]);
  return (
    <div ref={ref} className="relative flex">
      <button className="btn btn-primary rounded-r-none" onClick={() => onPick("blank")}>
        + New note
      </button>
      <button className="btn btn-primary rounded-l-none border-l border-l-white/30 !px-2" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="New from a template">
        ▾
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-1 w-72 rounded-xl border border-line bg-panel p-1 shadow-xl" role="menu">
          <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Start from a template</p>
          {TEMPLATES.map((t) => (
            <button key={t.id} role="menuitem" className="block w-full rounded-lg px-3 py-2 text-left hover:bg-panel-2" onClick={() => (setOpen(false), onPick(t.id))}>
              <span className="block text-sm font-medium">{t.name}</span>
              <span className="block text-xs text-muted">{t.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
