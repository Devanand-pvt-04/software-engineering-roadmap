import { Suspense } from "react";
import type { Metadata } from "next";
import { WeekView } from "@/components/week-view";
import { TRACKS, TRACK_LABEL, type Track } from "@/lib/roadmap";
import { Missing } from "@/components/missing";
import { allWeeks, weekFor } from "@/server/content";

/** Every week page is known at build time, so they prerender instead of reading the URL per request. */
export function generateStaticParams() {
  return TRACKS.flatMap((track) => allWeeks(track).map((w) => ({ track, n: String(w.n) })));
}

const isTrack = (t: string): t is Track => t === "main" || t === "java";

export async function generateMetadata({ params }: PageProps<"/[track]/[n]">): Promise<Metadata> {
  const { track, n } = await params;
  if (!isTrack(track)) return { title: "Not found" };
  const w = weekFor(track, Number(n));
  return { title: w ? `${TRACK_LABEL[track]} W${n}: ${w.title}` : "Not found" };
}

// Reading params sits behind Suspense so client navigations between weeks don't block on the URL.
export default function Page({ params }: PageProps<"/[track]/[n]">) {
  return (
    <Suspense fallback={<div className="h-96" aria-busy="true" />}>
      <Week params={params} />
    </Suspense>
  );
}

async function Week({ params }: { params: PageProps<"/[track]/[n]">["params"] }) {
  const { track, n } = await params;
  const num = Number(n);
  if (!isTrack(track) || !Number.isInteger(num) || !weekFor(track, num)) return <Missing />;
  return <WeekView track={track} n={num} />;
}
