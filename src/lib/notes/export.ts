"use client";
// Exports and imports for notes: Markdown (single file or a ZIP vault with images), standalone HTML,
// PDF (through the browser's print dialog), Word, plain text, flashcards for Anki/Quizlet, and a full JSON backup.
import { strToU8, zipSync } from "fflate";
import { APP_NAME, APP_SLUG } from "../brand";
import type { ClientContent } from "../content";
import type { State } from "../merge";
import { assetIds, imageDataUrl, getImage } from "./assets";
import { extractCards } from "./cards";
import { hydrate } from "./hydrate";
import { EXPORT_PAGE_CSS, EXPORT_VARS, PROSE_CSS } from "./prose-css";
import { loadMath, renderMarkdown } from "./render";
import { sketchSvg, type Sketch } from "./sketch";
import { displayTitle, refView, sketchKey, slugify, STATUS_LABEL, type Note, type NoteView } from "./model";

export function download(name: string, body: BlobPart, type: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([body], { type }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

const today = () => new Date().toISOString().slice(0, 10);
const getSketch = (s: State) => (id: string) => (s.entries[sketchKey(id)]?.v as Sketch | null) ?? null;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const yamlStr = (s: string) => JSON.stringify(s);
const date = (t: number) => new Date(t).toISOString().slice(0, 10);

function frontMatter(n: NoteView, c: ClientContent): string {
  const lines = ["---", `title: ${yamlStr(displayTitle(n))}`];
  if (n.allTags.length) lines.push(`tags: [${n.allTags.map(yamlStr).join(", ")}]`);
  const refs = n.refs.map((r) => refView(c, r)).filter(Boolean);
  if (refs.length) lines.push(`roadmap: [${refs.map((r) => yamlStr(r!.label + (r!.topic ? ` / ${r!.topic}` : ""))).join(", ")}]`);
  if (n.status) lines.push(`status: ${STATUS_LABEL[n.status]}`);
  if (n.interview) lines.push(`interview: true`);
  if (n.revisedAt) lines.push(`revised: ${n.revisedAt}`);
  lines.push(`created: ${date(n.created)}`, `updated: ${date(n.updated)}`, "---", "");
  return lines.join("\n");
}

/** Body with asset:/sketch: links rewritten by `img`. */
async function rewriteMedia(body: string, s: State, img: (kind: "asset" | "sketch", id: string) => Promise<string | null>): Promise<string> {
  const re = /!\[([^\]]*)\]\((asset|sketch):([a-z0-9]+)([^)]*)\)/g;
  const found = [...body.matchAll(re)];
  const map = new Map<string, string | null>();
  for (const m of found) {
    const k = `${m[2]}:${m[3]}`;
    if (!map.has(k)) map.set(k, await img(m[2] as "asset" | "sketch", m[3]));
  }
  void s;
  return body.replace(re, (all, alt, kind, id, rest) => {
    const u = map.get(`${kind}:${id}`);
    return u ? `![${alt}](${u}${rest})` : all;
  });
}

const sketchDataUrl = (sk: Sketch) => "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(sketchSvg(sk, { bg: false, color: "#1b1b18", crop: true }))));

/** One self-contained Markdown file: images and sketches embedded as data: URLs. */
export async function exportMarkdown(notes: NoteView[], s: State, c: ClientContent, title?: string): Promise<string> {
  const parts: string[] = [];
  const single = notes.length === 1;
  if (!single) parts.push(`# ${title ?? `${APP_NAME} notes`}`, "", `Exported ${today()}. ${notes.length} notes.`, "");
  for (const n of notes) {
    const body = await rewriteMedia(n.body, s, async (kind, id) => {
      if (kind === "asset") return imageDataUrl(id);
      const sk = getSketch(s)(id);
      return sk ? sketchDataUrl(sk) : null;
    });
    if (single) parts.push(frontMatter(n, c), `# ${displayTitle(n)}`, "", body.trim(), "");
    else parts.push("---", "", `## ${displayTitle(n)}`, "", metaLine(n, c), "", demote(body.trim()), "");
  }
  return parts.join("\n");
}
function metaLine(n: NoteView, c: ClientContent) {
  const bits = [
    n.allTags.length ? n.allTags.map((t) => `#${t}`).join(" ") : "",
    ...n.refs.map((r) => refView(c, r)?.label ?? "").filter(Boolean),
    n.status ? STATUS_LABEL[n.status] : "",
    `updated ${date(n.updated)}`,
  ].filter(Boolean);
  return `_${bits.join(" · ")}_`;
}
/** Push headings down a level so each note sits under its own H2 in a combined file. */
function demote(body: string) {
  let fence = "";
  return body
    .split("\n")
    .map((l) => {
      const f = l.match(/^\s*(`{3,}|~{3,})/);
      if (f) {
        if (!fence) fence = f[1];
        else if (l.trim().startsWith(fence)) fence = "";
        return l;
      }
      return !fence && /^#{1,5}\s/.test(l) ? "#" + l : l;
    })
    .join("\n");
}

/** A ZIP of Markdown files with an assets folder: opens as a vault in Obsidian, Logseq, VS Code and most Markdown apps. */
export async function exportZip(notes: NoteView[], s: State, c: ClientContent): Promise<Uint8Array> {
  const files: Record<string, Uint8Array> = {};
  const used = new Set<string>();
  const ext = (t: string) => ({ "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg", "image/avif": "avif" })[t] ?? "bin";
  for (const n of notes) {
    let name = slugify(displayTitle(n));
    let k = 2;
    while (used.has(name)) name = `${slugify(displayTitle(n))}-${k++}`;
    used.add(name);
    const body = await rewriteMedia(n.body, s, async (kind, id) => {
      if (kind === "asset") {
        const b = await getImage(id);
        if (!b) return null;
        const path = `assets/${id}.${ext(b.type)}`;
        files[path] = new Uint8Array(await b.arrayBuffer());
        return path;
      }
      const sk = getSketch(s)(id);
      if (!sk) return null;
      const path = `assets/sketch-${id}.svg`;
      files[path] = strToU8(sketchSvg(sk, { bg: false, color: "#1b1b18", crop: true }));
      return path;
    });
    const folder = n.interview ? "interview/" : "";
    files[`${folder}${name}.md`] = strToU8(`${frontMatter(n, c)}# ${displayTitle(n)}\n\n${body.trim()}\n`);
  }
  // Assets live at the root; notes in interview/ need ../ to reach them.
  for (const [path, data] of Object.entries(files)) if (path.startsWith("interview/")) files[path] = strToU8(new TextDecoder().decode(data).replace(/\]\(assets\//g, "](../assets/"));
  return zipSync(files, { level: 6 });
}

/** Rendered HTML for the notes, with images, sketches and diagrams inlined. */
async function renderNotesHtml(notes: NoteView[], s: State, c: ClientContent): Promise<string> {
  await loadMath();
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-10000px;top:0;width:800px";
  document.body.appendChild(host);
  try {
    const parts: string[] = [];
    for (const n of notes) {
      const meta = [
        ...n.allTags.map((t) => `<span class="tag">#${esc(t)}</span>`),
        ...n.refs.map((r) => refView(c, r)).filter(Boolean).map((r) => `<span>${esc(r!.label)}${r!.topic ? ` · ${esc(r!.topic)}` : ""}</span>`),
        n.status ? `<span>${STATUS_LABEL[n.status]}</span>` : "",
        `<span>Updated ${date(n.updated)}</span>`,
      ].join("");
      const el = document.createElement("section");
      el.className = "nb-note";
      el.id = `note-${n.id}`;
      el.innerHTML = `<h1 class="nb-note-title">${esc(displayTitle(n))}</h1><div class="nb-meta">${meta}</div><div class="nb-prose">${renderMarkdown(n.body, { exportMode: true })}</div>`;
      el.querySelectorAll("details.nb-card").forEach((d) => d.setAttribute("open", ""));
      el.querySelectorAll("input[type=checkbox]").forEach((i) => i.setAttribute("disabled", ""));
      el.querySelectorAll("[data-copy]").forEach((b) => b.remove());
      host.appendChild(el);
      await hydrate(el, { sketch: getSketch(s), exportMode: true });
      el.querySelectorAll("[data-sketch]").forEach((x) => x.removeAttribute("data-sketch"));
      el.querySelectorAll("a.nb-wiki").forEach((a) => {
        const t = a.getAttribute("data-note")?.toLowerCase();
        const target = notes.find((x) => displayTitle(x).toLowerCase() === t);
        a.setAttribute("href", target ? `#note-${target.id}` : "#");
      });
      parts.push(el.outerHTML);
    }
    return parts.join("\n");
  } finally {
    host.remove();
  }
}

export async function exportHtml(notes: NoteView[], s: State, c: ClientContent, title?: string, forWord = false): Promise<string> {
  const docTitle = notes.length === 1 ? displayTitle(notes[0]) : (title ?? `${APP_NAME} notes`);
  const body = await renderNotesHtml(notes, s, c);
  const toc =
    notes.length > 1
      ? `<nav class="nb-toc"><strong>Contents</strong><ol>${notes.map((n) => `<li><a href="#note-${n.id}">${esc(displayTitle(n))}</a></li>`).join("")}</ol></nav>`
      : "";
  const head =
    notes.length > 1 ? `<header class="nb-doc-head"><h1>${esc(docTitle)}</h1><p>Exported from ${APP_NAME} on ${today()} · ${notes.length} notes</p></header>` : "";
  const wordNs = forWord ? ` xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"` : "";
  return `<!doctype html>
<html lang="en"${wordNs}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(docTitle)}</title>
<style>${EXPORT_VARS}${EXPORT_PAGE_CSS}${PROSE_CSS}</style>
</head>
<body><main class="nb-doc">${head}${toc}${body}</main></body>
</html>`;
}

/** Opens the browser's print dialog on the rendered notes, where "Save as PDF" makes a PDF with selectable text. */
export async function exportPdf(notes: NoteView[], s: State, c: ClientContent, title?: string) {
  const html = await exportHtml(notes, s, c, title);
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  frame.setAttribute("aria-hidden", "true");
  document.body.appendChild(frame);
  const doc = frame.contentDocument!;
  doc.open();
  doc.write(html);
  doc.close();
  await new Promise((r) => setTimeout(r, 50));
  await Promise.all([...doc.images].map((i) => (i.complete ? null : new Promise((r) => ((i.onload = r), (i.onerror = r))))));
  await (doc.fonts?.ready ?? Promise.resolve());
  await new Promise((r) => setTimeout(r, 300));
  frame.contentWindow!.focus();
  frame.contentWindow!.print();
  setTimeout(() => frame.remove(), 60_000);
}

/** Word opens HTML saved with a .doc name and keeps headings, lists, tables, code and images. */
export async function exportWord(notes: NoteView[], s: State, c: ClientContent, title?: string): Promise<string> {
  return exportHtml(notes, s, c, title, true);
}

export function exportText(notes: NoteView[]): string {
  return notes.map((n) => `${displayTitle(n)}\n${"=".repeat(Math.min(60, displayTitle(n).length))}\n\n${n.body.trim()}\n`).join("\n\n");
}

/** Tab-separated front / back / tags: imports into Anki (File > Import) and Quizlet. */
export async function exportCards(notes: NoteView[]): Promise<{ tsv: string; count: number }> {
  await loadMath();
  const rows: string[] = ["#separator:tab", "#html:true", "#columns:Front\tBack\tTags"];
  let count = 0;
  for (const n of notes) {
    for (const card of extractCards(n.body)) {
      const cell = (md: string) => renderMarkdown(md, { exportMode: true }).replace(/\t/g, " ").replace(/\n/g, "");
      const tags = [slugify(displayTitle(n)), ...n.allTags].map((t) => t.replace(/\s+/g, "_")).join(" ");
      rows.push(`${cell(card.q)}\t${cell(card.a)}\t${tags}`);
      count++;
    }
  }
  return { tsv: rows.join("\n") + "\n", count };
}

// ---------- backup ----------
interface Backup {
  app: string;
  kind: "notes-backup";
  version: 1;
  exported: string;
  entries: Record<string, { v: unknown; t: number }>;
  images: Record<string, string>;
}

/** Every note, sketch and flashcard record, plus image files, in one JSON file. */
export async function exportBackup(s: State): Promise<string> {
  const entries: Backup["entries"] = {};
  const images: Backup["images"] = {};
  for (const [k, e] of Object.entries(s.entries)) {
    if (!/^(nb|sk|fc|nt):/.test(k) || e.v === null || e.v === undefined) continue;
    entries[k] = e;
    if (k.startsWith("nb:")) for (const id of assetIds((e.v as Note).body ?? "")) if (!images[id]) images[id] = (await imageDataUrl(id)) ?? "";
  }
  const b: Backup = { app: APP_SLUG, kind: "notes-backup", version: 1, exported: new Date().toISOString(), entries, images };
  return JSON.stringify(b);
}

export function isBackup(x: unknown): x is Backup {
  return !!x && typeof x === "object" && (x as Backup).kind === "notes-backup" && typeof (x as Backup).entries === "object";
}

/** A Markdown file → a note. Reads a YAML title/tags header if there is one. */
export function parseMarkdownFile(name: string, text: string): Pick<Note, "title" | "body" | "tags"> {
  let body = text.replace(/\r\n/g, "\n");
  let title = "";
  let tags: string[] = [];
  const fm = body.match(/^---\n([\s\S]*?)\n---\n?/);
  if (fm) {
    body = body.slice(fm[0].length);
    const t = fm[1].match(/^title:\s*(.+)$/m);
    if (t) title = t[1].trim().replace(/^["']|["']$/g, "");
    const tg = fm[1].match(/^tags:\s*\[(.*)\]$/m);
    if (tg)
      tags = tg[1]
        .split(",")
        .map((x) => x.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
  }
  const h1 = body.match(/^\s*#\s+(.+)\n/);
  if (!title && h1) title = h1[1].trim();
  if (h1 && h1[1].trim() === title) body = body.slice(h1[0].length);
  if (!title) title = name.replace(/\.(md|markdown|txt)$/i, "");
  return { title, body: body.trim() + "\n", tags };
}

export function fileName(notes: NoteView[], ext: string) {
  return notes.length === 1 ? `${slugify(displayTitle(notes[0]))}.${ext}` : `${APP_SLUG}-notes-${today()}.${ext}`;
}
