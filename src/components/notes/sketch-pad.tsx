"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { COLORS, blankSketch, hits, itemSvg, simplify, sketchSvg, type Item, type Sketch, type Tool } from "@/lib/notes/sketch";

type PadTool = Tool | "eraser";
const TOOLS: { id: PadTool; label: string; icon: string }[] = [
  { id: "pen", label: "Pen", icon: "M3 17l3-1 9-9-2-2-9 9-1 3zM12 5l2 2" },
  { id: "hl", label: "Highlighter", icon: "M4 16h5M6 13l7-7 3 3-7 7H6z" },
  { id: "line", label: "Line", icon: "M4 16L16 4" },
  { id: "arrow", label: "Arrow", icon: "M4 16L16 4M9 4h7v7" },
  { id: "rect", label: "Box", icon: "M4 5h12v10H4z" },
  { id: "ellipse", label: "Circle", icon: "M10 16a6 6 0 100-12 6 6 0 000 12z" },
  { id: "text", label: "Text", icon: "M5 5h10M10 5v11" },
  { id: "eraser", label: "Eraser", icon: "M8 16h8M4 12l6-6 5 5-5 5H8z" },
];
const SIZES = [1.5, 3, 5, 8];
const BGS: Sketch["bg"][] = ["grid", "dots", "lines", "plain"];

function Ico({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 20 20" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export function SketchPad({ initial, onSave, onClose }: { initial?: Sketch | null; onSave: (s: Sketch) => void; onClose: () => void }) {
  const [sk, setSk] = useState<Sketch>(() => initial ?? blankSketch());
  const [past, setPast] = useState<Item[][]>([]);
  const [future, setFuture] = useState<Item[][]>([]);
  const [tool, setTool] = useState<PadTool>("pen");
  const [color, setColor] = useState("ink");
  const [size, setSize] = useState(1);
  const [fill, setFill] = useState(false);
  const [draft, setDraft] = useState<Item | null>(null);
  const [text, setText] = useState<{ x: number; y: number; sx: number; sy: number; v: string } | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const pts = useRef<number[]>([]);
  const start = useRef<{ x: number; y: number } | null>(null);
  const sawPen = useRef(false);
  const erased = useRef(false);
  const dirty = past.length > 0;

  const commit = (items: Item[]) => {
    setPast((p) => [...p.slice(-80), sk.items]);
    setFuture([]);
    setSk((s) => ({ ...s, items }));
  };
  const undo = () => {
    if (!past.length) return;
    setFuture((f) => [sk.items, ...f]);
    setSk((s) => ({ ...s, items: past[past.length - 1] }));
    setPast((p) => p.slice(0, -1));
  };
  const redo = () => {
    if (!future.length) return;
    setPast((p) => [...p, sk.items]);
    setSk((s) => ({ ...s, items: future[0] }));
    setFuture((f) => f.slice(1));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const at = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * sk.w, y: ((e.clientY - r.top) / r.height) * sk.h };
  };
  const s = SIZES[size];

  const down = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.pointerType === "pen") sawPen.current = true;
    if (e.pointerType === "touch" && sawPen.current) return; // palm rejection once a stylus is in use
    if (e.button > 0) return;
    const p = at(e);
    if (tool === "text") {
      const r = svg.current!.getBoundingClientRect();
      setText({ x: p.x, y: p.y, sx: e.clientX - r.left, sy: e.clientY - r.top, v: "" });
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = p;
    if (tool === "eraser") {
      erased.current = false;
      erase(p);
      return;
    }
    if (tool === "pen" || tool === "hl") {
      pts.current = [p.x, p.y];
      setDraft({ k: tool, c: color, s, p: pts.current });
    } else setDraft({ k: tool, c: color, s, x1: p.x, y1: p.y, x2: p.x, y2: p.y, fill });
  };
  const erase = (p: { x: number; y: number }) => {
    const keep = sk.items.filter((it) => !hits(it, p.x, p.y, 10));
    if (keep.length !== sk.items.length) {
      if (!erased.current) {
        setPast((h) => [...h.slice(-80), sk.items]);
        setFuture([]);
        erased.current = true;
      }
      setSk((x) => ({ ...x, items: keep }));
    }
  };
  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!start.current) return;
    if (e.pointerType === "touch" && sawPen.current) return;
    const events = (e.nativeEvent as PointerEvent).getCoalescedEvents?.() ?? [e.nativeEvent];
    if (tool === "eraser") return erase(at(e));
    if (tool === "pen" || tool === "hl") {
      const r = svg.current!.getBoundingClientRect();
      for (const ev of events) pts.current.push(((ev.clientX - r.left) / r.width) * sk.w, ((ev.clientY - r.top) / r.height) * sk.h);
      setDraft({ k: tool, c: color, s, p: [...pts.current] });
    } else if (draft && "x1" in draft) {
      let p = at(e);
      if (e.shiftKey && (tool === "line" || tool === "arrow")) {
        const dx = p.x - draft.x1,
          dy = p.y - draft.y1;
        p = Math.abs(dx) > Math.abs(dy) ? { x: p.x, y: draft.y1 } : { x: draft.x1, y: p.y };
      }
      setDraft({ ...draft, x2: p.x, y2: p.y });
    }
  };
  const up = () => {
    if (!start.current) return;
    start.current = null;
    if (tool === "eraser" || !draft) return;
    if ((draft.k === "pen" || draft.k === "hl") && draft.p.length >= 2) commit([...sk.items, { ...draft, p: simplify(draft.p) }]);
    else if ("x1" in draft && Math.hypot(draft.x2 - draft.x1, draft.y2 - draft.y1) > 3) {
      const r = (n: number) => Math.round(n);
      commit([...sk.items, { ...draft, x1: r(draft.x1), y1: r(draft.y1), x2: r(draft.x2), y2: r(draft.y2) }]);
    }
    setDraft(null);
  };
  const placeText = () => {
    if (text?.v.trim()) commit([...sk.items, { k: "text", c: color, s, x: Math.round(text.x), y: Math.round(text.y), t: text.v.trim() }]);
    setText(null);
  };

  const committed = useMemo(() => sketchSvg({ ...sk, items: sk.items }).replace(/^<svg[^>]*>|<\/svg>$/g, ""), [sk]);
  const close = () => {
    if (!dirty || confirm("Discard changes to this sketch?")) onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-bg" role="dialog" aria-modal="true" aria-label="Sketch">
      <div className="flex flex-wrap items-center gap-1 border-b border-line bg-panel px-2 py-1.5">
        <div className="flex items-center gap-0.5">
          {TOOLS.map((t) => (
            <button key={t.id} type="button" title={t.label} aria-label={t.label} aria-pressed={tool === t.id} onClick={() => setTool(t.id)} className={`grid size-9 place-items-center rounded-lg ${tool === t.id ? "bg-accent-soft text-accent" : "text-muted hover:bg-panel-2 hover:text-fg"}`}>
              <Ico d={t.icon} />
            </button>
          ))}
        </div>
        <span className="mx-1 h-6 w-px bg-line" aria-hidden />
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button key={c.id} type="button" title={c.label} aria-label={c.label} aria-pressed={color === c.id} onClick={() => setColor(c.id)} className={`grid size-7 place-items-center rounded-full ${color === c.id ? "ring-2 ring-accent ring-offset-2 ring-offset-panel" : ""}`}>
              <span className="size-5 rounded-full border border-line" style={{ background: c.id === "ink" ? "var(--text)" : c.css }} />
            </button>
          ))}
        </div>
        <span className="mx-1 h-6 w-px bg-line" aria-hidden />
        <div className="flex items-center gap-0.5">
          {SIZES.map((z, i) => (
            <button key={z} type="button" title={`Size ${i + 1}`} aria-label={`Size ${i + 1}`} aria-pressed={size === i} onClick={() => setSize(i)} className={`grid size-8 place-items-center rounded-lg ${size === i ? "bg-accent-soft" : "hover:bg-panel-2"}`}>
              <span className="rounded-full bg-fg" style={{ width: 2 + z * 1.4, height: 2 + z * 1.4 }} />
            </button>
          ))}
          {(tool === "rect" || tool === "ellipse") && (
            <button type="button" onClick={() => setFill(!fill)} aria-pressed={fill} className={`chip ml-1 ${fill ? "!border-accent !text-accent" : ""}`}>
              Fill
            </button>
          )}
        </div>
        <span className="mx-1 h-6 w-px bg-line" aria-hidden />
        <button type="button" onClick={undo} disabled={!past.length} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-panel-2 hover:text-fg disabled:opacity-40" title="Undo (Ctrl+Z)" aria-label="Undo">
          <Ico d="M8 5L4 9l4 4M4 9h8a4 4 0 010 8h-2" />
        </button>
        <button type="button" onClick={redo} disabled={!future.length} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-panel-2 hover:text-fg disabled:opacity-40" title="Redo (Ctrl+Shift+Z)" aria-label="Redo">
          <Ico d="M12 5l4 4-4 4M16 9H8a4 4 0 000 8h2" />
        </button>
        <select className="input !w-auto !py-1 text-[13px]" value={sk.bg} onChange={(e) => setSk({ ...sk, bg: e.target.value as Sketch["bg"] })} aria-label="Paper">
          {BGS.map((b) => (
            <option key={b} value={b}>
              {b === "plain" ? "Plain paper" : b === "grid" ? "Grid paper" : b === "dots" ? "Dot paper" : "Lined paper"}
            </option>
          ))}
        </select>
        <button type="button" className="chip" onClick={() => setSk({ ...sk, h: sk.h + 400 })}>
          More space
        </button>
        <button type="button" className="chip" disabled={!sk.items.length} onClick={() => commit([])}>
          Clear
        </button>
        <div className="ml-auto flex gap-2">
          <button type="button" className="btn" onClick={close}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onSave({ ...sk, updated: Date.now() })}>
            Save sketch
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2 sm:p-4">
        <div className="relative mx-auto max-w-[1200px]">
          <svg
            ref={svg}
            viewBox={`0 0 ${sk.w} ${sk.h}`}
            className="block w-full touch-none select-none rounded-xl border border-line bg-panel text-fg"
            style={{ cursor: tool === "text" ? "text" : tool === "eraser" ? "cell" : "crosshair" }}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            onPointerLeave={(e) => e.buttons === 0 && up()}
          >
            <g dangerouslySetInnerHTML={{ __html: committed }} />
            {draft && <g dangerouslySetInnerHTML={{ __html: itemSvg(draft.k === "pen" || draft.k === "hl" ? { ...draft } : draft) }} />}
          </svg>
          {text && (
            <input
              autoFocus
              className="input absolute !w-56 !py-1"
              style={{ left: text.sx, top: text.sy }}
              value={text.v}
              placeholder="Type, then Enter"
              onChange={(e) => setText({ ...text, v: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") placeText();
                if (e.key === "Escape") setText(null);
              }}
              onBlur={placeText}
            />
          )}
        </div>
        <p className="mx-auto mt-2 max-w-[1200px] text-center text-xs text-muted">
          Works with a mouse, finger or stylus. With a stylus, your palm won&apos;t draw. Hold Shift for straight lines.
        </p>
      </div>
    </div>
  );
}
