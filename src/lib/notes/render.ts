"use client";
// Markdown → HTML for notes: GitHub-style Markdown plus code highlighting, math, Mermaid diagrams,
// sketches, images, [[note links]], #tags, callouts and flashcards. The output is sanitised.
import markdownit, { type MarkdownIt, type Token } from "markdown-it";
import taskLists from "markdown-it-task-lists";
import footnote from "markdown-it-footnote";
import mark from "markdown-it-mark";
import hljs from "highlight.js/lib/core";
import java from "highlight.js/lib/languages/java";
import python from "highlight.js/lib/languages/python";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import sql from "highlight.js/lib/languages/sql";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import yaml from "highlight.js/lib/languages/yaml";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import go from "highlight.js/lib/languages/go";
import cpp from "highlight.js/lib/languages/cpp";
import c from "highlight.js/lib/languages/c";
import rust from "highlight.js/lib/languages/rust";
import kotlin from "highlight.js/lib/languages/kotlin";
import csharp from "highlight.js/lib/languages/csharp";
import http from "highlight.js/lib/languages/http";
import diff from "highlight.js/lib/languages/diff";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import plaintext from "highlight.js/lib/languages/plaintext";

for (const [name, lang] of Object.entries({ java, python, javascript, typescript, sql, bash, json, yaml, xml, css, go, cpp, c, rust, kotlin, csharp, http, diff, dockerfile, plaintext }))
  hljs.registerLanguage(name, lang);
import DOMPurify from "dompurify";
import { splitCardBlock, TERM_RE } from "./cards";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const headingId = (s: string) =>
  "h-" +
  s
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^\w]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

const LANG_ALIAS: Record<string, string> = { js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript", py: "python", sh: "bash", shell: "bash", zsh: "bash", yml: "yaml", html: "xml", "c++": "cpp", kt: "kotlin", rs: "rust", golang: "go", cs: "csharp", "c#": "csharp", docker: "dockerfile", text: "plaintext", txt: "plaintext" };

function highlight(code: string, lang: string): string {
  const l = LANG_ALIAS[lang] ?? lang;
  try {
    if (l && hljs.getLanguage(l)) return hljs.highlight(code, { language: l, ignoreIllegals: true }).value;
  } catch {
    /* fall back to plain */
  }
  return esc(code);
}

const CALLOUTS: Record<string, string> = { note: "Note", tip: "Tip", important: "Important", warning: "Warning", caution: "Caution", interview: "Interview", example: "Example", question: "Question", summary: "Summary" };

function build(exportMode = false): MarkdownIt {
  const md = markdownit({ html: false, linkify: true, breaks: false, typographer: false });
  md.use(taskLists, { enabled: true });
  md.use(footnote);
  md.use(mark);
  // Exports use MathML only, which browsers and Word render without extra stylesheets or fonts.
  if (katexPlugin) md.use(katexPlugin, { throwOnError: false, enableMathBlockInHtml: false, ...(exportMode ? { output: "mathml" } : {}) } as never);

  // Fenced code: highlighted with a language label and copy button. Mermaid, card and math fences are special.
  md.renderer.rules.fence = (tokens, idx, _opts, env) => {
    const t = tokens[idx];
    const lang = t.info.trim().split(/\s+/)[0].toLowerCase();
    const src = t.content;
    if (lang === "mermaid") return `<div class="nb-mermaid"><pre class="nb-pending">${esc(src)}</pre></div>`;
    if (lang === "card") {
      const { q, a } = splitCardBlock(src);
      return card(md.render(q, env), md.render(a, env));
    }
    if (lang === "math" || lang === "latex") return md.render(`$$\n${src}\n$$`, env);
    const exportMode = (env as Env)?.exportMode;
    const head = `<div class="nb-code-head"><span>${esc(lang || "code")}</span>${exportMode ? "" : `<button type="button" data-copy>Copy</button>`}</div>`;
    return `<div class="nb-code">${head}<pre><code class="hljs${lang ? " language-" + esc(lang) : ""}">${highlight(src, lang)}</code></pre></div>`;
  };

  // Images: asset:<id> are uploaded images, sketch:<id> are drawings.
  md.renderer.rules.image = (tokens, idx, _o, env, self) => {
    const t = tokens[idx];
    const src = String(t.attrGet("src") ?? "");
    const alt = self.renderInlineAsText(t.children ?? [], _o, env);
    const title = t.attrGet("title") ? String(t.attrGet("title")) : null;
    const cap = title ? `<figcaption>${esc(title)}</figcaption>` : "";
    if (src.startsWith("sketch:")) return `<figure class="nb-fig"><span class="nb-sketch" data-sketch="${esc(src.slice(7))}" role="img" aria-label="${esc(alt || "Sketch")}"></span>${cap}</figure>`;
    if (src.startsWith("asset:")) return `<img class="nb-img" data-asset="${esc(src.slice(6))}" alt="${esc(alt)}"${title ? ` title="${esc(title)}"` : ""}>`;
    return `<img class="nb-img" src="${esc(src)}" alt="${esc(alt)}" loading="lazy">`;
  };
  // asset:/sketch: aren't valid link schemes to markdown-it; allow them.
  const validate = md.validateLink.bind(md);
  md.validateLink = (url) => /^(asset|sketch):[a-z0-9]+$/.test(url) || validate(url);

  // [[Note title]] or [[Note title|label]]
  md.inline.ruler.before("link", "wikilink", (state, silent) => {
    const s = state.src;
    const p = state.pos;
    if (s.charCodeAt(p) !== 0x5b || s.charCodeAt(p + 1) !== 0x5b) return false;
    const end = s.indexOf("]]", p + 2);
    if (end < 0) return false;
    const inner = s.slice(p + 2, end);
    if (!inner.trim() || inner.includes("\n") || inner.includes("[")) return false;
    if (!silent) {
      const [target, label] = inner.split("|");
      const tok = state.push("wikilink", "", 0);
      tok.meta = { target: target.trim(), label: (label ?? target).trim() };
    }
    state.pos = end + 2;
    return true;
  });
  md.renderer.rules.wikilink = (tokens, idx) => {
    const { target, label } = tokens[idx].meta as { target: string; label: string };
    return `<a class="nb-wiki" href="#" data-note="${esc(target)}">${esc(label)}</a>`;
  };

  // #tag
  md.inline.ruler.after("wikilink", "tag", (state, silent) => {
    const s = state.src;
    const p = state.pos;
    if (s.charCodeAt(p) !== 0x23) return false;
    const prev = p > 0 ? s[p - 1] : " ";
    if (!/[\s(]/.test(prev)) return false;
    const m = s.slice(p + 1).match(/^[a-z][\w/-]{0,39}/i);
    if (!m) return false;
    if (!silent) {
      const tok = state.push("nbtag", "", 0);
      tok.content = m[0];
    }
    state.pos = p + 1 + m[0].length;
    return true;
  });
  md.renderer.rules.nbtag = (tokens, idx) => {
    const t = tokens[idx].content.toLowerCase();
    return `<a class="nb-tag" href="#" data-tag="${esc(t)}">#${esc(tokens[idx].content)}</a>`;
  };

  // Heading ids, for the outline.
  md.core.ruler.push("heading_ids", (state) => {
    const seen = new Map<string, number>();
    state.tokens.forEach((t: Token, i: number) => {
      if (t.type !== "heading_open") return;
      const text = state.tokens[i + 1]?.content ?? "";
      let id = headingId(text);
      const n = seen.get(id) ?? 0;
      seen.set(id, n + 1);
      if (n) id += `-${n}`;
      t.attrSet("id", id);
    });
  });

  // > [!NOTE] style callouts
  md.core.ruler.after("inline", "callouts", (state) => {
    const ts = state.tokens;
    for (let i = 0; i < ts.length; i++) {
      if (ts[i].type !== "blockquote_open") continue;
      const inline = ts[i + 2];
      if (ts[i + 1]?.type !== "paragraph_open" || inline?.type !== "inline") continue;
      const m = inline.content.match(/^\[!(\w+)\][ \t]*([^\n]*)/);
      if (!m) continue;
      const kind = m[1].toLowerCase();
      const label = CALLOUTS[kind] ?? m[1];
      ts[i].attrJoin("class", `nb-callout nb-callout-${CALLOUTS[kind] ? kind : "note"}`);
      ts[i].attrSet("data-title", m[2] || label);
      // Drop the marker line from the paragraph.
      const first = inline.children ?? [];
      const brk = first.findIndex((c) => c.type === "softbreak" || c.type === "hardbreak");
      if (brk >= 0) inline.children = first.slice(brk + 1);
      else {
        inline.children = [];
        ts[i + 1].hidden = true;
        ts[i + 3].hidden = true;
      }
    }
  });
  md.renderer.rules.blockquote_open = (tokens, idx, opts, _env, self) => {
    const t = tokens[idx];
    const title = t.attrGet("data-title") ? String(t.attrGet("data-title")) : null;
    if (!title) return self.renderToken(tokens, idx, opts);
    return `<blockquote class="${esc(String(t.attrGet("class") ?? ""))}"><div class="nb-callout-title">${esc(title)}</div>`;
  };

  return md;
}

function card(qHtml: string, aHtml: string) {
  return `<details class="nb-card"><summary><span class="nb-card-q">${qHtml}</span><span class="nb-card-hint">Show answer</span></summary><div class="nb-card-a">${aHtml}</div></details>`;
}

let md: MarkdownIt | null = null;
let mdExport: MarkdownIt | null = null;

// Math (KaTeX, ~260 KB) loads only once a note uses $…$.
type KatexPlugin = typeof import("@vscode/markdown-it-katex").default;
let katexPlugin: KatexPlugin | null = null;
let katexLoading: Promise<void> | null = null;
export const needsMath = (body: string) => !katexPlugin && /\$[^$\n]+\$|^\s*\$\$|```(math|latex)/m.test(body);
export function loadMath(): Promise<void> {
  katexLoading ??= import("@vscode/markdown-it-katex").then((m) => {
    katexPlugin = m.default;
    md = mdExport = null; // rebuild with math
  });
  return katexLoading;
}
interface Env {
  exportMode?: boolean;
}

/** Turns Q:/A: pairs and "term :: definition" lines into card fences, leaving code untouched. */
export function preprocess(body: string): string {
  const lines = body.split("\n");
  const out: string[] = [];
  let i = 0;
  const fenceCard = (q: string, a: string) => out.push("`````card", q, "---", a, "`````");
  while (i < lines.length) {
    const l = lines[i];
    const f = l.match(/^\s*(`{3,}|~{3,})/);
    if (f) {
      out.push(l);
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(f[1])) out.push(lines[i++]);
      if (i < lines.length) out.push(lines[i++]);
      continue;
    }
    if (/^\s*Q:\s*/i.test(l)) {
      const q: string[] = [l.replace(/^\s*Q:\s*/i, "")];
      let j = i + 1;
      while (j < lines.length && lines[j].trim() && !/^\s*A:\s*/i.test(lines[j])) q.push(lines[j++]);
      if (j < lines.length && /^\s*A:\s*/i.test(lines[j])) {
        const a: string[] = [lines[j].replace(/^\s*A:\s*/i, "")];
        j++;
        while (j < lines.length && lines[j].trim() && !/^\s*Q:\s*/i.test(lines[j])) a.push(lines[j++]);
        fenceCard(q.join("\n"), a.join("\n"));
        i = j;
        continue;
      }
    }
    const t = l.match(TERM_RE);
    if (t && !l.includes("`") && !l.includes("|")) {
      fenceCard(t[1], t[2]);
      i++;
      continue;
    }
    out.push(l);
    i++;
  }
  return out.join("\n");
}

let hooked = false;
function hook() {
  if (hooked) return;
  hooked = true;
  // Only task-list checkboxes may be inputs. Links open in a new tab.
  DOMPurify.addHook("uponSanitizeElement", (node, data) => {
    if (data.tagName === "input" && (node as Element).getAttribute?.("type") !== "checkbox") node.parentNode?.removeChild(node);
  });
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    const el = node as Element;
    if (el.tagName === "A" && /^https?:/.test(el.getAttribute("href") ?? "")) {
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    }
    if (el.tagName === "INPUT") el.removeAttribute("disabled");
  });
}

export function renderMarkdown(body: string, opts: Env = {}): string {
  const r = opts.exportMode ? (mdExport ??= build(true)) : (md ??= build());
  hook();
  const html = r.render(preprocess(body), { ...opts });
  return DOMPurify.sanitize(html, {
    ADD_ATTR: ["target", "data-copy", "open"],
    ADD_TAGS: ["details", "summary", "figure", "figcaption"],
    FORBID_TAGS: ["style", "form", "textarea", "select", "iframe"],
  });
}

/** Flips the nth "- [ ]" task in the source (code blocks skipped), for ticking boxes in the preview. */
export function toggleTask(body: string, n: number): string {
  const lines = body.split("\n");
  let fence = "";
  let k = 0;
  for (let i = 0; i < lines.length; i++) {
    const f = lines[i].match(/^\s*(`{3,}|~{3,})/);
    if (f) {
      if (!fence) fence = f[1];
      else if (lines[i].trim().startsWith(fence)) fence = "";
      continue;
    }
    if (fence) continue;
    const m = lines[i].match(/^(\s*(?:[-*+]|\d+[.)])\s+\[)([ xX])(\])/);
    if (!m) continue;
    if (k++ === n) {
      lines[i] = m[1] + (m[2] === " " ? "x" : " ") + m[3] + lines[i].slice(m[0].length);
      return lines.join("\n");
    }
  }
  return body;
}
