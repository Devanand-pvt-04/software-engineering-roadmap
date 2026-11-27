"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { renderMarkdown } from "@/lib/notes/render";
import { hydrate } from "@/lib/notes/hydrate";
import { PROSE_CSS } from "@/lib/notes/prose-css";
import "katex/dist/katex.min.css";
import { sketchKey } from "@/lib/notes/model";
import type { Sketch } from "@/lib/notes/sketch";
import { getState, useStore } from "@/lib/store";

/** The styles for rendered notes, once per page. */
export function ProseStyles() {
  return <style href="nb-prose" precedence="default">{PROSE_CSS}</style>;
}

function useDebounced<T>(v: T, ms: number): T {
  const [d, set] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => set(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

export function NotePreview({
  body,
  onOpenNote,
  onTag,
  onToggleTask,
  onEditSketch,
  className = "",
  live = false,
}: {
  body: string;
  onOpenNote?: (title: string) => void;
  onTag?: (tag: string) => void;
  onToggleTask?: (index: number) => void;
  onEditSketch?: (id: string) => void;
  className?: string;
  /** Rendered while typing: wait for a pause. */
  live?: boolean;
}) {
  const src = useDebounced(body, live ? 250 : 0);
  const html = useMemo(() => renderMarkdown(src), [src]);
  const ref = useRef<HTMLDivElement>(null);
  const s = useStore();
  // Re-hydrate when a sketch used by this note changes.
  const sketchSig = useMemo(
    () =>
      [...src.matchAll(/\(sketch:([a-z0-9]+)\)/g)]
        .map((m) => s.entries[sketchKey(m[1])]?.t ?? 0)
        .join(","),
    [src, s],
  );
  const [theme, setTheme] = useState(0);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => setTheme((x) => x + 1);
    mq.addEventListener("change", on);
    const mo = new MutationObserver(on);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      mq.removeEventListener("change", on);
      mo.disconnect();
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = html;
    void hydrate(el, { sketch: (id) => (getState().entries[sketchKey(id)]?.v as Sketch | null) ?? null });
  }, [html, sketchSig, theme]);

  const cbs = useRef({ onOpenNote, onTag, onToggleTask, onEditSketch });
  useEffect(() => {
    cbs.current = { onOpenNote, onTag, onToggleTask, onEditSketch };
  });

  const onClick = (e: React.MouseEvent) => {
    const el = e.target as HTMLElement;
    const copy = el.closest<HTMLElement>("[data-copy]");
    if (copy) {
      const code = copy.closest(".nb-code")?.querySelector("code")?.textContent ?? "";
      void navigator.clipboard?.writeText(code);
      copy.textContent = "Copied";
      setTimeout(() => (copy.textContent = "Copy"), 1200);
      return;
    }
    const wiki = el.closest<HTMLElement>("[data-note]");
    if (wiki) {
      e.preventDefault();
      cbs.current.onOpenNote?.(wiki.dataset.note!);
      return;
    }
    const tag = el.closest<HTMLElement>("[data-tag]");
    if (tag) {
      e.preventDefault();
      cbs.current.onTag?.(tag.dataset.tag!);
      return;
    }
    const sk = el.closest<HTMLElement>("[data-sketch]");
    if (sk && cbs.current.onEditSketch) {
      cbs.current.onEditSketch(sk.dataset.sketch!);
      return;
    }
    if (el instanceof HTMLInputElement && el.type === "checkbox") {
      const boxes = [...ref.current!.querySelectorAll("li.task-list-item > input[type=checkbox], li.task-list-item > label > input[type=checkbox]")];
      const i = boxes.indexOf(el);
      if (i >= 0 && cbs.current.onToggleTask) cbs.current.onToggleTask(i);
      else e.preventDefault();
    }
  };

  return (
    <>
      <ProseStyles />
      <div ref={ref} className={`nb-prose ${className}`} onClick={onClick} />
    </>
  );
}
