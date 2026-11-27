"use client";

import { useEffect, useRef } from "react";
import { EditorState, EditorSelection, type Extension } from "@codemirror/state";
import { EditorView, keymap, placeholder as cmPlaceholder, drawSelection, dropCursor, highlightActiveLine, Decoration, ViewPlugin, type DecorationSet, type ViewUpdate } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap, type CompletionContext, type CompletionResult } from "@codemirror/autocomplete";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { HighlightStyle, syntaxHighlighting, indentOnInput, bracketMatching, syntaxTree } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { SNIPPETS } from "@/lib/notes/templates";

export interface EditorApi {
  /** Inserts text at the cursor. "|" in the text marks where the cursor ends up. `block` puts it on its own line. */
  insert: (text: string, block?: boolean) => void;
  /** Wraps the selection (or a placeholder word) in before/after. */
  wrap: (before: string, after?: string, fallback?: string) => void;
  /** Adds a prefix to each selected line (toggles it off if all have it). */
  linePrefix: (prefix: string) => void;
  focus: () => void;
  gotoLine: (line: number) => void;
  /** Replaces a whole range of text, e.g. a sketch link. */
  replace: (from: string, to: string) => void;
}

const theme = EditorView.theme({
  "&": { fontSize: "15px", backgroundColor: "transparent", color: "var(--text)", height: "100%" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif", lineHeight: "1.7", overflow: "auto" },
  ".cm-line.cm-codeline": { fontFamily: "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "13.5px", backgroundColor: "var(--panel-2)" },
  ".cm-content": { padding: "14px 0 40vh", caretColor: "var(--accent)", maxWidth: "100%" },
  ".cm-line": { padding: "0 16px" },
  ".cm-cursor": { borderLeftColor: "var(--accent)", borderLeftWidth: "2px" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection": { backgroundColor: "var(--accent-soft) !important" },
  ".cm-activeLine": { backgroundColor: "color-mix(in srgb, var(--panel-2) 60%, transparent)" },
  ".cm-placeholder": { color: "var(--muted)", fontStyle: "italic" },
  ".cm-tooltip": { border: "1px solid var(--border)", background: "var(--panel)", borderRadius: "10px", overflow: "hidden", boxShadow: "0 8px 24px rgb(0 0 0 / .12)" },
  ".cm-tooltip-autocomplete > ul": { fontFamily: "var(--font-geist-sans), system-ui, sans-serif", maxHeight: "16em" },
  ".cm-tooltip-autocomplete > ul > li": { padding: "4px 10px !important", lineHeight: "1.5" },
  ".cm-tooltip-autocomplete > ul > li[aria-selected]": { background: "var(--accent-soft)", color: "var(--text)" },
  ".cm-completionDetail": { color: "var(--muted)", fontStyle: "normal", marginLeft: "0.8em", fontSize: "12px" },
  ".cm-completionIcon": { display: "none" },
  ".cm-panels": { background: "var(--panel-2)", color: "var(--text)", borderColor: "var(--border)" },
  ".cm-panel.cm-search": { padding: "6px 10px", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" },
  ".cm-panel.cm-search input, .cm-panel.cm-search button": { fontSize: "13px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--panel)", color: "var(--text)", padding: "2px 8px" },
  ".cm-searchMatch": { backgroundColor: "var(--warn-soft)", outline: "1px solid var(--warn)" },
  ".cm-selectionMatch": { backgroundColor: "var(--accent-soft)" },
});

const highlight = HighlightStyle.define([
  { tag: t.heading1, fontWeight: "700", fontSize: "1.3em", color: "var(--text)" },
  { tag: t.heading2, fontWeight: "700", fontSize: "1.15em", color: "var(--text)" },
  { tag: [t.heading3, t.heading4, t.heading5, t.heading6], fontWeight: "700", color: "var(--text)" },
  { tag: t.strong, fontWeight: "700" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  { tag: t.link, color: "var(--accent)" },
  { tag: t.url, color: "var(--muted)" },
  { tag: t.monospace, color: "var(--java)" },
  { tag: [t.processingInstruction, t.contentSeparator, t.meta], color: "var(--muted)" },
  { tag: t.quote, color: "var(--muted)", fontStyle: "italic" },
  { tag: t.list, color: "var(--accent)" },
  { tag: t.keyword, color: "var(--hl-kw, #cf222e)" },
  { tag: [t.string, t.special(t.string), t.regexp], color: "var(--hl-str, #0a3069)" },
  { tag: [t.number, t.bool, t.null, t.atom], color: "var(--hl-num, #0550ae)" },
  { tag: [t.comment, t.lineComment, t.blockComment], color: "var(--hl-com, #6e7781)", fontStyle: "italic" },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.className, t.typeName], color: "var(--hl-fn, #8250df)" },
  { tag: [t.propertyName, t.attributeName], color: "var(--hl-var, #953800)" },
]);

// Lines inside fenced code blocks get a monospace font and a tinted background, like the preview.
const codeLine = Decoration.line({ class: "cm-codeline" });
function codeLines(view: EditorView): DecorationSet {
  const b = new RangeSetBuilder<Decoration>();
  for (const { from, to } of view.visibleRanges)
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (n) => {
        if (n.name !== "FencedCode") return;
        for (let pos = n.from; pos <= n.to; ) {
          const line = view.state.doc.lineAt(pos);
          b.add(line.from, line.from, codeLine);
          pos = line.to + 1;
        }
        return false;
      },
    });
  return b.finish();
}
const codeLinePlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(v: EditorView) {
      this.decorations = codeLines(v);
    }
    update(u: ViewUpdate) {
      if (u.docChanged || u.viewportChanged || syntaxTree(u.startState) !== syntaxTree(u.state)) this.decorations = codeLines(u.view);
    }
  },
  { decorations: (v) => v.decorations },
);

function wrapCmd(view: EditorView, before: string, after = before, fallback = "text") {
  view.dispatch(
    view.state.changeByRange((r) => {
      const text = view.state.sliceDoc(r.from, r.to);
      if (text.startsWith(before) && text.endsWith(after) && text.length >= before.length + after.length) {
        const inner = text.slice(before.length, text.length - after.length);
        return { changes: { from: r.from, to: r.to, insert: inner }, range: EditorSelection.range(r.from, r.from + inner.length) };
      }
      const inner = text || fallback;
      return { changes: { from: r.from, to: r.to, insert: before + inner + after }, range: EditorSelection.range(r.from + before.length, r.from + before.length + inner.length) };
    }),
  );
  view.focus();
  return true;
}

function insertCmd(view: EditorView, text: string, block = false) {
  const { state } = view;
  const r = state.selection.main;
  let ins = text;
  if (block) {
    const line = state.doc.lineAt(r.from);
    const before = state.sliceDoc(line.from, r.from);
    if (before.trim()) ins = "\n\n" + ins;
    else if (line.number > 1 && state.doc.line(line.number - 1).text.trim()) ins = "\n" + ins;
    const lineAfter = state.doc.lineAt(r.to);
    if (state.sliceDoc(r.to, lineAfter.to).trim()) ins += "\n";
  }
  const caret = ins.indexOf("|");
  ins = ins.replace("|", "");
  view.dispatch({ changes: { from: r.from, to: r.to, insert: ins }, selection: { anchor: r.from + (caret < 0 ? ins.length : caret) }, scrollIntoView: true });
  view.focus();
}

function prefixCmd(view: EditorView, prefix: string) {
  const { state } = view;
  const lines = new Set<number>();
  for (const r of state.selection.ranges) for (let l = state.doc.lineAt(r.from).number; l <= state.doc.lineAt(r.to).number; l++) lines.add(l);
  const all = [...lines].map((n) => state.doc.line(n));
  const has = all.every((l) => l.text.startsWith(prefix));
  view.dispatch({
    changes: all.map((l) => (has ? { from: l.from, to: l.from + prefix.length, insert: "" } : { from: l.from, insert: prefix })),
  });
  view.focus();
}

export function NoteEditor({
  value,
  onChange,
  apiRef,
  titles,
  tags,
  onFiles,
  placeholder = "Start writing… type / for blocks, [[ to link a note, # for a tag",
  className = "",
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  apiRef?: React.RefObject<EditorApi | null>;
  titles: () => string[];
  tags: () => string[];
  /** Pasted or dropped image files. Resolve with Markdown to insert. */
  onFiles?: (files: File[]) => Promise<string>;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const emitted = useRef(value);
  const cb = useRef({ onChange, titles, tags, onFiles });
  useEffect(() => {
    cb.current = { onChange, titles, tags, onFiles };
  });

  useEffect(() => {
    if (!host.current) return;
    const complete = (ctx: CompletionContext): CompletionResult | null => {
      const wiki = ctx.matchBefore(/\[\[[^\]\n]*/);
      if (wiki) {
        const close = ctx.state.sliceDoc(ctx.pos, ctx.pos + 2) === "]]";
        return {
          from: wiki.from + 2,
          options: cb.current.titles().map((t) => ({ label: t, apply: close ? t : t + "]]", detail: "note" })),
          validFor: /^[^\]\n]*$/,
        };
      }
      const tag = ctx.matchBefore(/(^|[\s(])#[\w/-]*/);
      if (tag && !/^#{1,6}\s/.test(ctx.state.doc.lineAt(ctx.pos).text)) {
        const start = tag.text.indexOf("#");
        const word = tag.text.slice(start + 1);
        if (!word && !ctx.explicit) return null;
        return { from: tag.from + start + 1, options: cb.current.tags().map((x) => ({ label: x, detail: "tag" })), validFor: /^[\w/-]*$/ };
      }
      const slash = ctx.matchBefore(/^\s*\/[\w-]*$/);
      if (slash) {
        const from = slash.from + slash.text.indexOf("/");
        return {
          from,
          filter: false,
          options: SNIPPETS.filter((s) => (s.label + s.id).toLowerCase().includes(slash.text.trim().slice(1).toLowerCase())).map((s) => ({
            label: "/" + s.label,
            detail: s.hint,
            apply: (v: EditorView, _c: unknown, f: number, to: number) => {
              v.dispatch({ changes: { from: f, to, insert: "" } });
              insertCmd(v, s.text);
            },
          })),
        };
      }
      return null;
    };

    const ext: Extension[] = [
      history(),
      drawSelection(),
      dropCursor(),
      indentOnInput(),
      bracketMatching(),
      closeBrackets(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      EditorView.lineWrapping,
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      syntaxHighlighting(highlight),
      codeLinePlugin,
      autocompletion({ override: [complete], icons: false, activateOnTyping: true }),
      cmPlaceholder(placeholder),
      EditorView.contentAttributes.of({ spellcheck: "true", autocorrect: "on", autocapitalize: "sentences", "aria-label": "Note text" }),
      keymap.of([
        { key: "Mod-b", run: (v) => wrapCmd(v, "**") },
        { key: "Mod-i", run: (v) => wrapCmd(v, "_") },
        { key: "Mod-e", run: (v) => wrapCmd(v, "`", "`", "code") },
        { key: "Mod-k", run: (v) => wrapCmd(v, "[", "](https://)", "link") },
        { key: "Mod-Shift-x", run: (v) => wrapCmd(v, "~~") },
        { key: "Mod-Shift-h", run: (v) => wrapCmd(v, "==") },
        ...closeBracketsKeymap,
        ...completionKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...defaultKeymap,
        indentWithTab,
      ]),
      theme,
      EditorView.updateListener.of((u) => {
        if (!u.docChanged) return;
        emitted.current = u.state.doc.toString();
        cb.current.onChange(emitted.current);
      }),
      EditorView.domEventHandlers({
        paste(e, v) {
          const files = [...(e.clipboardData?.files ?? [])].filter((f) => f.type.startsWith("image/"));
          if (!files.length || !cb.current.onFiles) return false;
          e.preventDefault();
          cb.current.onFiles(files).then((md) => md && insertCmd(v, md + "|", true));
          return true;
        },
        drop(e, v) {
          const files = [...(e.dataTransfer?.files ?? [])].filter((f) => f.type.startsWith("image/"));
          if (!files.length || !cb.current.onFiles) return false;
          e.preventDefault();
          const pos = v.posAtCoords({ x: e.clientX, y: e.clientY });
          if (pos !== null) v.dispatch({ selection: { anchor: pos } });
          cb.current.onFiles(files).then((md) => md && insertCmd(v, md + "|", true));
          return true;
        },
      }),
    ];
    const v = new EditorView({ parent: host.current, state: EditorState.create({ doc: value, extensions: ext }) });
    view.current = v;
    if (autoFocus) v.focus();
    return () => {
      v.destroy();
      view.current = null;
    };
    // The editor is created once per mount; later `value` changes are applied below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Outside changes (another device, a restored version, a ticked box in the preview).
  useEffect(() => {
    const v = view.current;
    if (!v || value === emitted.current) return;
    emitted.current = value;
    const cur = v.state.doc.toString();
    if (cur !== value) {
      const sel = v.state.selection.main;
      v.dispatch({ changes: { from: 0, to: cur.length, insert: value }, selection: { anchor: Math.min(sel.anchor, value.length) } });
    }
  }, [value]);

  useEffect(() => {
    if (!apiRef) return;
    apiRef.current = {
      insert: (text, block) => view.current && insertCmd(view.current, text, block),
      wrap: (b, a, f) => view.current && wrapCmd(view.current, b, a ?? b, f),
      linePrefix: (p) => view.current && prefixCmd(view.current, p),
      focus: () => view.current?.focus(),
      gotoLine: (n) => {
        const v = view.current;
        if (!v) return;
        const line = v.state.doc.line(Math.min(v.state.doc.lines, n + 1));
        v.dispatch({ selection: { anchor: line.from }, effects: EditorView.scrollIntoView(line.from, { y: "start", yMargin: 20 }) });
        v.focus();
      },
      replace: (from, to) => {
        const v = view.current;
        if (!v) return;
        const doc = v.state.doc.toString();
        const i = doc.indexOf(from);
        if (i >= 0) v.dispatch({ changes: { from: i, to: i + from.length, insert: to } });
      },
    };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef]);

  return <div ref={host} className={`nb-editor min-h-0 ${className}`} />;
}
