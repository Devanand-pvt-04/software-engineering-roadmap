"use client";

import Link from "next/link";
import { useHydrated } from "@/lib/store";
import { NotePreview } from "./preview";

const F = "```";
const SECTIONS: { title: string; text: string; src: string }[] = [
  {
    title: "Text",
    text: "Headings, bold, italic, highlight, strikethrough, links and lists. Ctrl+B, Ctrl+I, Ctrl+E (code) and Ctrl+K (link) work in the editor.",
    src: `## Heading
**bold**, _italic_, ==highlight==, ~~struck out~~, \`inline code\`, [a link](https://example.com)

- a bullet
  - nested
1. numbered
- [ ] a task you can tick in Read view
- [x] a done task`,
  },
  {
    title: "Code",
    text: "Fenced code blocks are highlighted for Java, Python, JavaScript, TypeScript, SQL, Go, C, C++, Rust, Kotlin, Bash, YAML, JSON and more. Each has a copy button.",
    src: `${F}java
int binarySearch(int[] a, int target) {
    int lo = 0, hi = a.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;   // avoids overflow
        if (a[mid] == target) return mid;
        if (a[mid] < target) lo = mid + 1; else hi = mid - 1;
    }
    return -1;
}
${F}`,
  },
  {
    title: "Tables",
    text: "Pipes make columns; the second row of dashes marks the header. Use Insert → Table for a ready one.",
    src: `| Structure | Lookup | Insert |
| --- | --- | --- |
| Array | O(1) by index | O(n) |
| Hash map | O(1) average | O(1) average |
| Balanced BST | O(log n) | O(log n) |`,
  },
  {
    title: "Diagrams",
    text: "Mermaid diagrams are drawn from text: flowcharts, sequence, class, ER and state diagrams. Good for system design.",
    src: `${F}mermaid
sequenceDiagram
  participant B as Browser
  participant S as Server
  B->>S: GET /index.html
  S-->>B: 200 OK
${F}`,
  },
  {
    title: "Sketches",
    text: "The pen button opens a drawing pad: pen, highlighter, lines, arrows, boxes, circles, text and an eraser, on grid, dot or lined paper. Works with a stylus. Click a sketch in Read view to edit it.",
    src: `![sketch](sketch:abc123)   ← added for you by the Sketch button`,
  },
  {
    title: "Images",
    text: "Paste a screenshot, drop a file onto the editor, or use the image button. Big images are shrunk so notes stay fast. When you're signed in they sync to your other devices.",
    src: `![my screenshot](asset:...)   ← added for you`,
  },
  {
    title: "Math",
    text: "LaTeX between dollar signs, for complexity and formulas.",
    src: `Merge sort runs in $O(n \\log n)$.

$$
T(n) = 2T\\left(\\frac{n}{2}\\right) + O(n)
$$`,
  },
  {
    title: "Callouts",
    text: "Start a quote with [!NOTE], [!TIP], [!WARNING], [!IMPORTANT], [!EXAMPLE], [!SUMMARY] or [!INTERVIEW].",
    src: `> [!INTERVIEW] How I'd explain it
> A hash map turns a key into an array index with a hash function, so lookups skip the search.

> [!WARNING]
> Mutable keys break hash maps.`,
  },
  {
    title: "Flashcards",
    text: "Write cards anywhere in a note; they show as cards you can flip here and come back on a schedule in Study. Three ways:",
    src: `Q: Why is HashMap lookup O(1) on average?
A: The hash picks the bucket directly; only collisions in that bucket are scanned.

Big-O of binary search :: O(log n)

${F}card
What does this print?
${"`"}System.out.println(0.1 + 0.2 == 0.3);${"`"}
---
**false**: floating-point can't represent 0.1 exactly.
${F}`,
  },
  {
    title: "Links and tags",
    text: "[[Note title]] links to another note (type [[ for suggestions); the other note lists it under Linked from. #tags group notes and can be filtered on the Notes page. Link a note to a roadmap week or topic with + Link to roadmap.",
    src: `See [[Hash maps]] and [[Binary search|my binary search note]].

#dsa #arrays`,
  },
  {
    title: "Footnotes",
    text: "For sources and asides.",
    src: `Java's HashMap switches long buckets to trees.[^1]

[^1]: Since Java 8, once a bucket holds 8 entries.`,
  },
];

export function NotesGuide() {
  const h = useHydrated();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <Link href="/notes" className="text-sm text-muted hover:text-fg">
          ← Notes
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Formatting guide</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-muted">
          Notes are written in Markdown, so they stay plain text you can take anywhere. The toolbar and the Insert menu write all of this for you; type / at the start of a
          line for the same menu.
        </p>
      </header>
      {SECTIONS.map((s) => (
        <section key={s.title} className="card overflow-hidden">
          <div className="border-b border-line px-5 py-3">
            <h2 className="font-semibold">{s.title}</h2>
            <p className="text-sm text-muted">{s.text}</p>
          </div>
          <div className="grid md:grid-cols-2">
            <pre className="overflow-x-auto whitespace-pre-wrap border-b border-line bg-panel-2 p-4 font-mono text-[12.5px] leading-relaxed md:border-b-0 md:border-r">{s.src}</pre>
            <div className="min-w-0 p-4">{h && !s.src.includes("sketch:abc") && !s.src.includes("asset:...") ? <NotePreview body={s.src} /> : <p className="text-sm text-muted">Try it in a note.</p>}</div>
          </div>
        </section>
      ))}
      <section className="card p-5 text-sm">
        <h2 className="mb-2 font-semibold">Keyboard</h2>
        <ul className="grid gap-1 sm:grid-cols-2">
          <li>Ctrl/⌘ B · bold</li>
          <li>Ctrl/⌘ I · italic</li>
          <li>Ctrl/⌘ E · inline code</li>
          <li>Ctrl/⌘ K · link</li>
          <li>Ctrl/⌘ Shift H · highlight</li>
          <li>Ctrl/⌘ F · find and replace in the note</li>
          <li>Ctrl/⌘ Z / Shift Z · undo / redo</li>
          <li>Tab / Shift Tab · indent list items</li>
          <li>/ at the start of a line · insert menu</li>
          <li>[[ · link a note · # · tag</li>
        </ul>
      </section>
    </div>
  );
}
