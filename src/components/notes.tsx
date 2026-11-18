"use client";

import { useEffect, useRef, useState } from "react";
import { useValue } from "@/lib/store";

/** Debounced textarea bound to a store key. */
export function NoteBox({ k, placeholder, rows = 6 }: { k: string; placeholder?: string; rows?: number }) {
  const [v, set] = useValue<string>(k, "");
  const [local, setLocal] = useState(v);
  const editing = useRef(false);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!editing.current) setLocal(v);
  }, [v]);
  return (
    <textarea
      className="input min-h-28 resize-y leading-relaxed"
      rows={rows}
      value={local}
      placeholder={placeholder}
      onFocus={() => (editing.current = true)}
      onBlur={() => {
        editing.current = false;
        if (t.current) clearTimeout(t.current);
        if (local !== v) set(local);
      }}
      onChange={(e) => {
        const nv = e.target.value;
        setLocal(nv);
        if (t.current) clearTimeout(t.current);
        t.current = setTimeout(() => set(nv), 700);
      }}
    />
  );
}
