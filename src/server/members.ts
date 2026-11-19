import "server-only";
import { kvDelete, kvGet, kvList, kvSet, dbEnabled } from "@/lib/db";
import { PRESETS, isFeatureId, type FeatureMap } from "@/lib/features";

export interface Profile {
  id: string;
  name: string;
  features: FeatureMap;
}
export interface Member {
  login: string; // lowercase GitHub username
  displayLogin: string; // as typed / as GitHub spells it
  githubId: string | null; // numeric id, learned on first sign-in
  name: string | null;
  image: string | null;
  profileId: string;
  overrides: FeatureMap;
  role: "member" | "admin";
  status: "active" | "revoked";
  note: string;
  invitedAt: string;
  lastSeenAt: string | null;
}

export const LOGIN_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
export const norm = (login: string) => login.trim().replace(/^@/, "").toLowerCase();

export function ownerLogins(): string[] {
  const raw = process.env.ADMIN_GITHUB_LOGINS || process.env.VERCEL_GIT_REPO_OWNER || process.env.ZTD_REPO_OWNER || "";
  return raw.split(",").map(norm).filter(Boolean);
}
export const isOwner = (login: string) => ownerLogins().includes(norm(login));

export function cleanFeatures(x: unknown): FeatureMap {
  const out: FeatureMap = {};
  if (x && typeof x === "object")
    for (const [k, v] of Object.entries(x)) if (isFeatureId(k) && typeof v === "boolean") out[k] = v;
  return out;
}

export async function listProfiles(): Promise<Profile[]> {
  if (!dbEnabled) return PRESETS;
  let ps = await kvList<Profile>("profiles");
  if (!ps.length) {
    await Promise.all(PRESETS.map((p) => kvSet("profiles", p.id, p)));
    ps = PRESETS;
  }
  return ps.sort((a, b) => a.name.localeCompare(b.name));
}
export async function getProfile(id: string): Promise<Profile | null> {
  if (!dbEnabled) return PRESETS.find((p) => p.id === id) ?? null;
  return kvGet<Profile>("profiles", id);
}
export const saveProfile = (p: Profile) => kvSet("profiles", p.id, p);
export const deleteProfile = (id: string) => kvDelete("profiles", id);

export async function listMembers(): Promise<Member[]> {
  if (!dbEnabled) return [];
  return (await kvList<Member>("members")).sort((a, b) => a.login.localeCompare(b.login));
}
export async function getMember(login: string): Promise<Member | null> {
  if (!dbEnabled) return null;
  return kvGet<Member>("members", norm(login));
}
export const saveMember = (m: Member) => kvSet("members", m.login, m);
export const deleteMember = (login: string) => kvDelete("members", norm(login));

/** Record who actually signed in (id, name, avatar) and when; throttled to one write per 10 minutes. */
export async function touchMember(m: Member, seen: { githubId: string | null; name: string | null; image: string | null; login: string }) {
  const stale = !m.lastSeenAt || Date.now() - Date.parse(m.lastSeenAt) > 10 * 60_000;
  const changed = (seen.githubId && m.githubId !== seen.githubId) || m.name !== seen.name || m.image !== seen.image;
  if (!stale && !changed) return;
  await saveMember({ ...m, githubId: seen.githubId ?? m.githubId, name: seen.name, image: seen.image, displayLogin: seen.login, lastSeenAt: new Date().toISOString() });
}
