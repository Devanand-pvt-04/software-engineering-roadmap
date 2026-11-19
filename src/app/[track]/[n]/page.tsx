import type { Metadata } from "next";
import { WeekView } from "@/components/week-view";
import { TRACK_LABEL, type Track } from "@/lib/roadmap";
import { allowed, getAccess } from "@/server/access";
import { Missing } from "@/components/missing";
import { weekFor } from "@/server/content";

const isTrack = (t: string): t is Track => t === "main" || t === "java";

export async function generateMetadata({ params }: PageProps<"/[track]/[n]">): Promise<Metadata> {
  const { track, n } = await params;
  const a = await getAccess();
  // Never name a week of a track this person can't see.
  if (!isTrack(track) || !a.features.includes(`track:${track}`)) return { title: "Not found" };
  const w = weekFor(track, Number(n));
  return { title: w ? `${TRACK_LABEL[track]} W${n}: ${w.title}` : "Not found" };
}

export default async function Page({ params }: PageProps<"/[track]/[n]">) {
  const { track, n } = await params;
  const num = Number(n);
  if (!isTrack(track) || !(await allowed(`track:${track}`)) || !Number.isInteger(num) || !weekFor(track, num)) return <Missing />;
  return <WeekView track={track} n={num} />;
}
