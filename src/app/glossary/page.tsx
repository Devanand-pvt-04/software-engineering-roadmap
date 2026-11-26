import type { Metadata } from "next";
import Link from "next/link";
import { GLOSSARY } from "@/data/guide";
import { posOf } from "@/server/content";

export const metadata: Metadata = { title: "Glossary" };

export default function Page() {
  const glossary = GLOSSARY;
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Glossary: the scary terms, mapped</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-muted">
          One-line meanings so they stop being noise today. Depth comes in the week listed. By the end of the plan, every term here should map to something you&apos;ve built or configured.
        </p>
      </header>
      <div className="card divide-y divide-line">
        {glossary.map((g) => (
          <div key={g.term} className="grid gap-1 p-4 sm:grid-cols-[200px_1fr_auto] sm:gap-4">
            <div className="font-semibold">{g.term}</div>
            <div className="text-[15px] text-muted">{g.meaning}</div>
            <div className="flex flex-wrap gap-1.5">
              {g.weeks.map((w) => {
                const track = w[0] === "M" ? "main" : "java";
                const pos = posOf(track, w);
                if (!pos) return null;
                return (
                  <Link key={w} href={`/${track}/${pos}`} className={`rounded-md px-2 py-0.5 text-xs font-semibold ${track === "main" ? "bg-main-soft text-main" : "bg-java-soft text-java"}`}>
                    {track === "main" ? "Main" : "Java"} W{pos}
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
