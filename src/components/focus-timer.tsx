"use client";

import { useEffect, useState } from "react";
import { SESSION_TEMPLATE } from "@/data/guide";

/** The 5-step session template (Open, Recall, Focus, Explain, Close) as a guided timer. */
export function FocusTimer() {
  const [step, setStep] = useState(-1);
  const [left, setLeft] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft((l) => (l > 0 ? l - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [running]);

  const finished = running && left === 0 && step >= 0;
  useEffect(() => {
    if (!finished) return;
    const prev = document.title;
    document.title = "⏰ Next step · Zero to Deep";
    return () => {
      document.title = prev;
    };
  }, [finished]);

  const go = (i: number) => {
    if (i >= SESSION_TEMPLATE.length) {
      setStep(-1);
      setRunning(false);
      return;
    }
    setStep(i);
    setLeft(SESSION_TEMPLATE[i].minutes * 60);
    setRunning(true);
  };

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <div>
      <ol className="mb-4 grid grid-cols-5 gap-1.5">
        {SESSION_TEMPLATE.map((t, i) => (
          <li key={t.name}>
            <button
              onClick={() => go(i)}
              className={`w-full rounded-lg border px-1 py-2 text-center text-xs ${i === step ? "border-accent bg-accent-soft font-semibold text-accent" : i < step ? "border-line text-muted line-through" : "border-line text-muted hover:text-fg"}`}
            >
              {t.name}
              <div className="font-normal">{t.minutes}m</div>
            </button>
          </li>
        ))}
      </ol>
      {step < 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">About 85 minutes, guided step by step.</p>
          <button className="btn btn-primary" onClick={() => go(0)}>
            Start session
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">{SESSION_TEMPLATE[step].name}</div>
              <p className="mt-1 max-w-md text-sm text-muted">{SESSION_TEMPLATE[step].text}</p>
            </div>
            <div className={`font-mono text-4xl font-semibold tabular-nums ${left === 0 ? "text-warn" : ""}`} aria-live="polite">
              {mm}:{ss}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn" onClick={() => setRunning(!running)}>
              {running ? "Pause" : "Resume"}
            </button>
            <button className="btn btn-primary" onClick={() => go(step + 1)}>
              {step === SESSION_TEMPLATE.length - 1 ? "Finish" : `Next: ${SESSION_TEMPLATE[step + 1].name}`}
            </button>
            <button className="btn" onClick={() => go(SESSION_TEMPLATE.length)}>
              Stop
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
