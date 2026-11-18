import type { Metadata } from "next";
import Link from "next/link";
import { GLOSSARY } from "@/data/guide";

export const metadata: Metadata = { title: "Glossary" };

export default function Page() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Glossary: the scary terms, mapped</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-muted">
          One-line meanings so they stop being noise today. Depth comes in the week listed. By week 36, every term here should map to something you&apos;ve built or configured.
        </p>
      </header>
      <div className="card divide-y divide-line">
        {GLOSSARY.map((g) => (
          <div key={g.term} className="grid gap-1 p-4 sm:grid-cols-[200px_1fr_auto] sm:gap-4">
            <div className="font-semibold">{g.term}</div>
            <div className="text-[15px] text-muted">{g.meaning}</div>
            <div className="flex flex-wrap gap-1.5">
              {g.weeks.map((w) => {
                const track = w[0] === "M" ? "main" : "java";
                return (
                  <Link key={w} href={`/${track}/${w.slice(1)}`} className={`rounded-md px-2 py-0.5 text-xs font-semibold ${track === "main" ? "bg-main-soft text-main" : "bg-java-soft text-java"}`}>
                    {track === "main" ? "Main" : "Java"} W{w.slice(1)}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
