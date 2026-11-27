"use client";
// Fills in the parts of rendered notes that need more than Markdown: images, sketches and Mermaid diagrams.
import { imageDataUrl, imageUrl } from "./assets";
import { sketchSvg, type Sketch } from "./sketch";

let mermaidP: Promise<typeof import("mermaid").default> | null = null;
let mermaidTheme = "";
let seq = 0;

async function mermaid(dark: boolean) {
  mermaidP ??= import("mermaid").then((m) => m.default);
  const m = await mermaidP;
  const theme = dark ? "dark" : "default";
  if (theme !== mermaidTheme) {
    m.initialize({ startOnLoad: false, securityLevel: "strict", theme, fontFamily: "ui-sans-serif, system-ui, sans-serif" });
    mermaidTheme = theme;
  }
  return m;
}

/** Mermaid source → SVG, or an error message. Renders run one at a time (mermaid isn't re-entrant). */
let queue: Promise<unknown> = Promise.resolve();
const cache = new Map<string, { svg?: string; error?: string }>();
export function renderMermaid(src: string, dark: boolean): Promise<{ svg?: string; error?: string }> {
  const key = (dark ? "d" : "l") + src;
  const hit = cache.get(key);
  if (hit) return Promise.resolve(hit);
  const job = queue.then(async () => {
    try {
      const m = await mermaid(dark);
      const { svg } = await m.render(`nbm${++seq}`, src);
      return { svg };
    } catch (e) {
      document.querySelectorAll(`[id^="dnbm"]`).forEach((n) => n.remove());
      return { error: e instanceof Error ? e.message.split("\n").slice(0, 3).join(" ") : "Diagram has an error" };
    }
  });
  queue = job.catch(() => {});
  return job.then((r) => {
    if (cache.size > 200) cache.clear();
    cache.set(key, r);
    return r;
  });
}

export const isDark = () =>
  typeof document !== "undefined" &&
  (document.documentElement.dataset.theme === "dark" || (!document.documentElement.dataset.theme && window.matchMedia("(prefers-color-scheme: dark)").matches));

export interface HydrateOpts {
  sketch: (id: string) => Sketch | null;
  /** Inline everything (data: URLs, light theme) so the HTML stands alone. */
  exportMode?: boolean;
  dark?: boolean;
}

export async function hydrate(root: ParentNode, o: HydrateOpts): Promise<void> {
  const jobs: Promise<unknown>[] = [];
  root.querySelectorAll<HTMLImageElement>("img[data-asset]").forEach((img) => {
    const id = img.dataset.asset!;
    jobs.push(
      (o.exportMode ? imageDataUrl(id) : imageUrl(id)).then((u) => {
        if (u) img.src = u;
        else {
          img.alt = (img.alt ? img.alt + " " : "") + "(image not on this device yet)";
          img.classList.add("nb-missing");
        }
        if (o.exportMode) img.removeAttribute("data-asset");
      }),
    );
  });
  root.querySelectorAll<HTMLElement>("[data-sketch]").forEach((el) => {
    const sk = o.sketch(el.dataset.sketch!);
    el.innerHTML = sk ? sketchSvg(sk, o.exportMode ? { bg: false, color: "#1b1b18", crop: true } : { crop: true }) : `<em class="nb-missing">Sketch not found</em>`;
  });
  const mm = [...root.querySelectorAll<HTMLElement>(".nb-mermaid")].filter((el) => el.querySelector(".nb-pending"));
  for (const el of mm)
    jobs.push(
      renderMermaid(el.querySelector(".nb-pending")!.textContent ?? "", o.exportMode ? false : (o.dark ?? isDark())).then((r) => {
        el.innerHTML = r.svg ?? `<pre class="nb-error">Diagram error: ${(r.error ?? "").replace(/</g, "&lt;")}</pre>`;
      }),
    );
  await Promise.all(jobs);
}
