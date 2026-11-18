import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { WeekView } from "@/components/week-view";
import { TRACK_LABEL, WEEKS, getWeek, type Track } from "@/lib/roadmap";

export function generateStaticParams() {
  return (["main", "java"] as Track[]).flatMap((track) => WEEKS[track].map((w) => ({ track, n: String(w.n) })));
}

export async function generateMetadata({ params }: PageProps<"/[track]/[n]">): Promise<Metadata> {
  const { track, n } = await params;
  const w = getWeek(track as Track, Number(n));
  return { title: w ? `${TRACK_LABEL[track as Track]} W${n}: ${w.title}` : "Week" };
}

export default async function Page({ params }: PageProps<"/[track]/[n]">) {
  const { track, n } = await params;
  if (track !== "main" && track !== "java") notFound();
  const num = Number(n);
  if (!getWeek(track, num)) notFound();
  return <WeekView track={track} n={num} />;
}
