import type { Metadata } from "next";
import { adminAccess } from "@/server/access";
import { Missing } from "@/components/missing";
import { listMembers, listProfiles, ownerLogins } from "@/server/members";
import { kvMany, dbEnabled } from "@/lib/db";
import { allWeeks } from "@/server/content";
import { weekProgress } from "@/lib/progress";
import { mergeState, emptyState, type State } from "@/lib/merge";
import { TRACKS } from "@/lib/roadmap";
import { AdminView, type MemberRow } from "@/components/admin-view";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await adminAccess()) ? "Admin" : "Not found" };
}

/** What the admin sees of a member's progress: weeks passed per track and when they last ticked anything. */
function summarize(raw: unknown) {
  const s: State = mergeState(emptyState(), raw);
  const passed = Object.fromEntries(TRACKS.map((t) => [t, allWeeks(t).filter((w) => weekProgress(s, t, w).passed).length]));
  let last = 0;
  let solved = 0;
  for (const [k, e] of Object.entries(s.entries)) {
    if (!k.startsWith("cfg:") && e.v && e.t > last) last = e.t;
    if (k.startsWith("pr:") && (e.v as { status?: string })?.status && ["solved", "helped"].includes((e.v as { status: string }).status)) solved++;
  }
  return { passed, lastActive: last ? new Date(last).toISOString() : null, solved };
}

export default async function Page() {
  const me = await adminAccess();
  if (!me) return <Missing />;
  const [profiles, members] = await Promise.all([listProfiles(), listMembers()]);
  const progress = await kvMany<unknown>("progress", members.filter((m) => m.githubId).map((m) => `github:${m.githubId}`));
  const rows: MemberRow[] = members.map((m) => ({
    ...m,
    progress: m.githubId && progress[`github:${m.githubId}`] ? summarize(progress[`github:${m.githubId}`]) : null,
  }));
  return <AdminView me={me.login ?? ""} owners={ownerLogins()} dbReady={dbEnabled} profiles={profiles} members={rows} />;
}
