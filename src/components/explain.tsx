import type { ExplainView } from "@/lib/roadmap";

const PARTS: [keyof ExplainView, string][] = [
  ["why", "Why it exists"],
  ["problem", "The problem it solves"],
  ["how", "How it solves it"],
  ["tech", "How it works"],
  ["cost", "What it costs"],
];

/** Collapsed "from the ground up" card under a Must know topic. */
export function Explain({ x }: { x?: ExplainView }) {
  if (!x) return null;
  return (
    <details className="group mb-2 ml-8 rounded-lg border border-line bg-panel-2 text-sm open:pb-3">
      <summary className="cursor-pointer select-none px-3 py-1.5 text-xs font-semibold text-muted hover:text-fg">
        From the ground up
        {x.buildsOn && <span className="ml-2 font-normal">· builds on {x.buildsOn}</span>}
      </summary>
      <dl className="space-y-2 px-3 pt-1">
        {PARTS.map(([k, label]) => (
          <div key={k}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
            <dd className="leading-relaxed">{x[k]}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
