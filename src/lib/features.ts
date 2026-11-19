// The feature registry: every part of the app a person can be given or denied.
// Profiles (e.g. "Java + DSA only") are sets of these; members get a profile plus per-person overrides.
// Client-safe.

export type FeatureId =
  | "track:main"
  | "track:java"
  | "problems"
  | "journal"
  | "guide"
  | "glossary"
  | "timer"
  | "backup";

export interface FeatureDef {
  id: FeatureId;
  label: string;
  description: string;
  group: "Tracks" | "Tools" | "Reference";
  /** Value when a profile doesn't mention it (so features added later reach existing profiles sensibly). */
  defaultOn: boolean;
  /** Only works if this other feature is on too. */
  requires?: FeatureId;
}

export const FEATURES: FeatureDef[] = [
  { id: "track:main", label: "Main track", description: "36 weeks from the CPU to Kubernetes: week pages, map, schedule days, URL note", group: "Tracks", defaultOn: false },
  { id: "track:java", label: "Java + DSA track", description: "36 weeks of Java, OOP and algorithms: week pages, map, schedule days", group: "Tracks", defaultOn: false },
  { id: "problems", label: "Problem tracker", description: "LeetCode list with statuses and spaced re-solves", group: "Tools", defaultOn: true, requires: "track:java" },
  { id: "journal", label: "Journal", description: "URL note (Main) and the mistakes and patterns logs (Java)", group: "Tools", defaultOn: true },
  { id: "timer", label: "Session timer", description: "The guided 5-step session timer on Today", group: "Tools", defaultOn: true },
  { id: "backup", label: "Export and import", description: "Download or restore progress as a file", group: "Tools", defaultOn: true },
  { id: "guide", label: "How it works", description: "Schedule, rules, setup checklist, falling-behind rules", group: "Reference", defaultOn: true },
  { id: "glossary", label: "Glossary", description: "The scary terms, mapped to weeks", group: "Reference", defaultOn: true },
];

export const ALL_FEATURES: FeatureId[] = FEATURES.map((f) => f.id);
export const isFeatureId = (x: string): x is FeatureId => (ALL_FEATURES as string[]).includes(x);

export type FeatureMap = Partial<Record<FeatureId, boolean>>;

/** Profile settings, then the member's own overrides, then dependencies. */
export function resolveFeatures(profile: FeatureMap, overrides: FeatureMap = {}): FeatureId[] {
  const on = new Set<FeatureId>();
  for (const f of FEATURES) {
    const v = overrides[f.id] ?? profile[f.id] ?? f.defaultOn;
    if (v) on.add(f.id);
  }
  for (const f of FEATURES) if (f.requires && !on.has(f.requires)) on.delete(f.id);
  return FEATURES.map((f) => f.id).filter((id) => on.has(id));
}

export const PRESETS: { id: string; name: string; features: FeatureMap }[] = [
  { id: "everything", name: "Everything", features: { "track:main": true, "track:java": true } },
  { id: "java", name: "Java + DSA only", features: { "track:java": true } },
  { id: "main", name: "Main track only", features: { "track:main": true } },
];
