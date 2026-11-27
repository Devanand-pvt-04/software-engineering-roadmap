// Hand-drawn sketches, stored as vectors so they stay sharp, small and editable.
// Kept as synced entries (sk:<id>) and referenced from a note as ![sketch](sketch:<id>).

export type Tool = "pen" | "hl" | "line" | "arrow" | "rect" | "ellipse" | "text";
export type Item =
  | { k: "pen" | "hl"; c: string; s: number; p: number[] }
  | { k: "line" | "arrow" | "rect" | "ellipse"; c: string; s: number; x1: number; y1: number; x2: number; y2: number; fill?: boolean }
  | { k: "text"; c: string; s: number; x: number; y: number; t: string };

export interface Sketch {
  v: 1;
  w: number;
  h: number;
  bg: "plain" | "grid" | "dots" | "lines";
  items: Item[];
  updated: number;
}

/** "ink" follows the theme (dark on light, light on dark). The rest are fixed. */
export const COLORS: { id: string; label: string; css: string }[] = [
  { id: "ink", label: "Ink", css: "currentColor" },
  { id: "#e03131", label: "Red", css: "#e03131" },
  { id: "#1971c2", label: "Blue", css: "#1971c2" },
  { id: "#2f9e44", label: "Green", css: "#2f9e44" },
  { id: "#f08c00", label: "Orange", css: "#f08c00" },
  { id: "#9c36b5", label: "Purple", css: "#9c36b5" },
  { id: "#868e96", label: "Grey", css: "#868e96" },
];
const SAFE = /^(ink|#[0-9a-f]{6})$/i;
export const colorCss = (c: string) => (!SAFE.test(c) ? "currentColor" : c === "ink" ? "currentColor" : c);

export const blankSketch = (w = 1200, h = 700): Sketch => ({ v: 1, w, h, bg: "grid", items: [], updated: Date.now() });

/** Drops points that add nothing to the line (Ramer–Douglas–Peucker), so strokes stay small. */
export function simplify(p: number[], eps = 0.8): number[] {
  const n = p.length / 2;
  if (n < 3) return p;
  const keep = new Uint8Array(n);
  keep[0] = keep[n - 1] = 1;
  const stack: [number, number][] = [[0, n - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const ax = p[a * 2],
      ay = p[a * 2 + 1],
      bx = p[b * 2],
      by = p[b * 2 + 1];
    const dx = bx - ax,
      dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    let best = -1,
      idx = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * p[i * 2] - dx * p[i * 2 + 1] + bx * ay - by * ax) / len;
      if (d > best) {
        best = d;
        idx = i;
      }
    }
    if (best > eps) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  const out: number[] = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(Math.round(p[i * 2] * 10) / 10, Math.round(p[i * 2 + 1] * 10) / 10);
  return out;
}

/** A smooth SVG path through the points (quadratic curves via midpoints). */
export function penPath(p: number[]): string {
  if (p.length < 2) return "";
  if (p.length === 2) return `M${p[0]} ${p[1]}l0.01 0`;
  let d = `M${p[0]} ${p[1]}`;
  for (let i = 2; i < p.length - 2; i += 2) {
    const mx = (p[i] + p[i + 2]) / 2;
    const my = (p[i + 1] + p[i + 3]) / 2;
    d += `Q${p[i]} ${p[i + 1]} ${r(mx)} ${r(my)}`;
  }
  d += `L${p[p.length - 2]} ${p[p.length - 1]}`;
  return d;
}
const r = (x: number) => Math.round(x * 10) / 10;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function itemSvg(it: Item): string {
  const c = colorCss(it.c);
  const s = Number(it.s) || 2;
  switch (it.k) {
    case "pen":
      return `<path d="${penPath(it.p)}" fill="none" stroke="${c}" stroke-width="${s}" stroke-linecap="round" stroke-linejoin="round"/>`;
    case "hl":
      return `<path d="${penPath(it.p)}" fill="none" stroke="${c}" stroke-opacity="0.35" stroke-width="${s * 6}" stroke-linecap="round" stroke-linejoin="round"/>`;
    case "line":
      return `<line x1="${it.x1}" y1="${it.y1}" x2="${it.x2}" y2="${it.y2}" stroke="${c}" stroke-width="${s}" stroke-linecap="round"/>`;
    case "arrow": {
      const a = Math.atan2(it.y2 - it.y1, it.x2 - it.x1);
      const h = 8 + s * 3;
      const p1 = `${r(it.x2 - h * Math.cos(a - 0.45))} ${r(it.y2 - h * Math.sin(a - 0.45))}`;
      const p2 = `${r(it.x2 - h * Math.cos(a + 0.45))} ${r(it.y2 - h * Math.sin(a + 0.45))}`;
      return `<path d="M${it.x1} ${it.y1}L${it.x2} ${it.y2}M${p1}L${it.x2} ${it.y2}L${p2}" fill="none" stroke="${c}" stroke-width="${s}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    case "rect": {
      const x = Math.min(it.x1, it.x2),
        y = Math.min(it.y1, it.y2);
      return `<rect x="${x}" y="${y}" width="${Math.abs(it.x2 - it.x1)}" height="${Math.abs(it.y2 - it.y1)}" rx="6" fill="${it.fill ? c : "none"}" fill-opacity="${it.fill ? 0.15 : 1}" stroke="${c}" stroke-width="${s}"/>`;
    }
    case "ellipse":
      return `<ellipse cx="${(it.x1 + it.x2) / 2}" cy="${(it.y1 + it.y2) / 2}" rx="${Math.abs(it.x2 - it.x1) / 2}" ry="${Math.abs(it.y2 - it.y1) / 2}" fill="${it.fill ? c : "none"}" fill-opacity="${it.fill ? 0.15 : 1}" stroke="${c}" stroke-width="${s}"/>`;
    case "text":
      return `<text x="${it.x}" y="${it.y}" fill="${c}" font-size="${10 + s * 5}" font-family="ui-sans-serif, system-ui, sans-serif" dominant-baseline="hanging">${esc(it.t)}</text>`;
  }
}

function bgSvg(sk: Sketch): string {
  if (sk.bg === "plain") return "";
  const id = "g" + Math.random().toString(36).slice(2, 7);
  const body =
    sk.bg === "grid"
      ? `<path d="M24 0H0V24" fill="none" stroke="currentColor" stroke-opacity="0.1" stroke-width="1"/>`
      : sk.bg === "lines"
        ? `<path d="M0 23.5H24" stroke="currentColor" stroke-opacity="0.12" stroke-width="1"/>`
        : `<circle cx="12" cy="12" r="1" fill="currentColor" fill-opacity="0.2"/>`;
  return `<defs><pattern id="${id}" width="24" height="24" patternUnits="userSpaceOnUse">${body}</pattern></defs><rect width="100%" height="100%" fill="url(#${id})"/>`;
}

/** The whole sketch as an SVG string. `bg` false leaves the paper pattern out (for exports). */
export function sketchSvg(sk: Sketch, opts: { bg?: boolean; color?: string; crop?: boolean } = {}): string {
  let w = Number(sk.w) || 1200;
  let h = Number(sk.h) || 700;
  // Trim empty paper below the drawing (keeps the full width so the scale matches the pad).
  if (opts.crop && sk.items?.length) {
    const b = bottom(sk.items);
    if (b > 0) h = Math.min(h, Math.max(160, Math.ceil(b + 40)));
  }
  w = Math.round(w);
  const items = (sk.items ?? []).map(itemSvg).join("");
  const style = opts.color ? ` style="color:${opts.color}"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" preserveAspectRatio="xMidYMid meet"${style}>${opts.bg === false ? "" : bgSvg(sk)}${items}</svg>`;
}

function bottom(items: Item[]): number {
  let y = 0;
  for (const it of items) {
    if (it.k === "pen" || it.k === "hl") for (let i = 1; i < it.p.length; i += 2) y = Math.max(y, it.p[i] + it.s * 3);
    else if (it.k === "text") y = Math.max(y, it.y + 10 + it.s * 5);
    else y = Math.max(y, (it as Extract<Item, { y1: number }>).y1, (it as Extract<Item, { y1: number }>).y2);
  }
  return y;
}

/** Bounding box of an item, for the eraser. */
export function hits(it: Item, x: number, y: number, rad: number): boolean {
  if (it.k === "pen" || it.k === "hl") {
    for (let i = 0; i < it.p.length; i += 2) if (Math.hypot(it.p[i] - x, it.p[i + 1] - y) < rad + it.s) return true;
    return false;
  }
  if (it.k === "text") return x >= it.x - rad && x <= it.x + it.t.length * (10 + it.s * 5) * 0.6 + rad && y >= it.y - rad && y <= it.y + 10 + it.s * 5 + rad;
  if (it.k === "line" || it.k === "arrow") {
    const dx = it.x2 - it.x1,
      dy = it.y2 - it.y1;
    const len2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - it.x1) * dx + (y - it.y1) * dy) / len2));
    return Math.hypot(it.x1 + t * dx - x, it.y1 + t * dy - y) < rad + it.s;
  }
  const b = it as Extract<Item, { x1: number }>;
  const x0 = Math.min(b.x1, b.x2),
    x1 = Math.max(b.x1, b.x2),
    y0 = Math.min(b.y1, b.y2),
    y1 = Math.max(b.y1, b.y2);
  if (b.fill) return x >= x0 - rad && x <= x1 + rad && y >= y0 - rad && y <= y1 + rad;
  const near = (p: number, q: number) => Math.abs(p - q) < rad + b.s;
  const inX = x >= x0 - rad && x <= x1 + rad,
    inY = y >= y0 - rad && y <= y1 + rad;
  if (b.k === "rect") return (inX && (near(y, y0) || near(y, y1))) || (inY && (near(x, x0) || near(x, x1)));
  const cx = (x0 + x1) / 2,
    cy = (y0 + y1) / 2,
    rx = (x1 - x0) / 2 || 1,
    ry = (y1 - y0) / 2 || 1;
  const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
  return Math.abs(d - 1) * Math.min(rx, ry) < rad + b.s;
}
