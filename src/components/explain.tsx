import type { ExplainView } from "@/lib/roadmap";

const LABELS = {
  why: "Why it exists",
  problem: "The problem it solves",
  how: "How it solves it",
  tech: "How it works",
  cost: "What it costs",
  tryIt: "Try it",
} as const;
const ORDER = ["why", "problem", "how", "tech", "cost", "tryIt"] as const;

/** Collapsed "from the ground up" card under a Must know topic. */
export function Explain({ x }: { x?: ExplainView }) {
  if (!x) return null;
  return (
    <details className="group mb-1 ml-8 rounded-lg border border-transparent text-sm open:border-line open:bg-panel-2 open:pb-3">
      <summary className="w-fit cursor-pointer select-none rounded-md px-2 py-1 text-xs font-medium text-accent hover:bg-accent-soft group-open:px-3 group-open:text-muted">
        From the ground up
        {x.buildsOn && (
          <span className="ml-2 font-normal">· builds on {x.buildsOn}</span>
        )}
      </summary>
      <dl className="space-y-2 px-3 pt-1">
        {ORDER.map((k) => {
          const v = x[k];
          if (!v || (Array.isArray(v) && !v.length)) return null;
          return (
            <div key={k}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                {LABELS[k]}
              </dt>
              {Array.isArray(v) ? (
                <dd>
                  <ul className="list-disc space-y-1 pl-5 leading-relaxed">
                    {v.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </dd>
              ) : (
                <dd className="leading-relaxed">{v}</dd>
              )}
            </div>
          );
        })}
      </dl>
    </details>
  );
}
