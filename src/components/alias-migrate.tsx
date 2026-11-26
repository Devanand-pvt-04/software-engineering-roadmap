"use client";

import { useEffect } from "react";
import { useContent } from "@/lib/content";
import { getState, setEntries, useStore } from "@/lib/store";

/**
 * When two weeks are merged, the surviving week lists the other's id in `aliases`. This copies ticks,
 * notes and quiz marks from the old id's keys to the new id's keys (only where the new key is empty),
 * so nothing done under the old week is lost.
 */
export function AliasMigrate() {
  const c = useContent();
  const s = useStore();
  useEffect(() => {
    const map: [string, string][] = [];
    for (const t of c.tracks) for (const w of c.weeks[t] ?? []) for (const a of w.aliases ?? []) map.push([a, w.id]);
    if (!map.length) return;
    const cur = getState().entries;
    const out: { key: string; v: unknown; t: number }[] = [];
    for (const [k, e] of Object.entries(cur)) {
      if (e.v === null || e.v === undefined) continue;
      for (const [from, to] of map) {
        const m = k.match(new RegExp(`^([a-z]{2}:)${from}(:.*)?$`));
        if (!m) continue;
        const nk = `${m[1]}${to}${m[2] ?? ""}`;
        if (cur[nk]?.v === undefined || cur[nk]?.v === null) out.push({ key: nk, v: e.v, t: e.t });
      }
    }
    if (out.length) setEntries(out);
  }, [c, s]);
  return null;
}
