// Everything the person has written, as one Markdown document.
import type { ClientContent } from "./content";
import { APP_NAME } from "./brand";
import type { State } from "./merge";
import { TRACK_LABEL, keys } from "./roadmap";

interface LogItem {
  kind: "mistake" | "pattern";
  text: string;
  tag: string;
  date: string;
}

export function notesMarkdown(s: State, c: ClientContent, today: string): string {
  const text = (k: string) => {
    const v = s.entries[k]?.v;
    return typeof v === "string" ? v.trim() : "";
  };
  const out: string[] = [`# ${APP_NAME} notes`, ``, `Exported ${today}.`, ``];
  for (const t of c.tracks) {
    const weeks = (c.weeks[t] ?? []).filter((w) => text(keys.note(w.id)));
    if (!weeks.length) continue;
    out.push(`## ${TRACK_LABEL[t]}`, ``);
    for (const w of weeks) out.push(`### Week ${w.n}: ${w.title}`, ``, text(keys.note(w.id)), ``);
  }
  const url = c.urlNoteSections.filter((x) => text(`url:${x.id}`));
  if (url.length) {
    out.push(`## ${c.urlNoteTitle}`, ``);
    for (const x of url) out.push(`### ${x.phase}: ${x.title}`, ``, text(`url:${x.id}`), ``);
  }
  if (c.tracks.includes("java")) {
    const logs = Object.entries(s.entries)
      .filter(([k, e]) => k.startsWith("log:") && e.v)
      .map(([, e]) => e.v as LogItem)
      .sort((a, b) => a.date.localeCompare(b.date));
    for (const [kind, title] of [
      ["pattern", "Patterns"],
      ["mistake", "Mistakes"],
    ] as const) {
      const items = logs.filter((l) => l.kind === kind);
      if (!items.length) continue;
      out.push(`## ${title}`, ``);
      for (const l of items) out.push(`- **${l.date}**${l.tag ? ` _${l.tag}_` : ""}: ${l.text.replace(/\n+/g, " ")}`);
      out.push(``);
    }
  }
  if (out.length === 4) out.push(`_No notes yet._`, ``);
  return out.join("\n");
}

export function download(name: string, body: string, type: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([body], { type }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
