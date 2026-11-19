"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { PREVIEW_COOKIE, requireAdmin } from "@/server/access";
import {
  LOGIN_RE, cleanFeatures, deleteMember, deleteProfile, getMember, getProfile, isOwner, listMembers, listProfiles, norm, saveMember, saveProfile, type Member,
} from "@/server/members";
import type { FeatureMap } from "@/lib/features";
import { dbEnabled } from "@/lib/db";

export type Result = { ok: true; message?: string } | { ok: false; error: string };

async function guard(): Promise<Result | null> {
  await requireAdmin();
  if (!dbEnabled) return { ok: false, error: "Members need the database, and it isn't configured on this deployment." };
  return null;
}

/** Ask GitHub whether the username exists, and how it's capitalised. Never blocks an invite if GitHub can't be reached. */
async function lookupGitHub(login: string): Promise<{ exists: boolean | null; login?: string; name?: string | null; image?: string | null }> {
  try {
    const r = await fetch(`https://api.github.com/users/${encodeURIComponent(login)}`, {
      headers: { accept: "application/vnd.github+json", "user-agent": "zero-to-deep" },
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (r.status === 404) return { exists: false };
    if (!r.ok) return { exists: null };
    const j = (await r.json()) as { login: string; name: string | null; avatar_url: string; type: string };
    if (j.type !== "User") return { exists: false };
    return { exists: true, login: j.login, name: j.name, image: j.avatar_url };
  } catch {
    return { exists: null };
  }
}

export async function inviteMember(input: { login: string; profileId: string; role: "member" | "admin"; note: string }): Promise<Result> {
  const g = await guard();
  if (g) return g;
  const login = norm(input.login);
  if (!LOGIN_RE.test(login)) return { ok: false, error: "That isn't a valid GitHub username." };
  if (isOwner(login)) return { ok: false, error: "That's you. You already have full access." };
  if (await getMember(login)) return { ok: false, error: `@${login} is already on the list.` };
  if (!(await getProfile(input.profileId))) return { ok: false, error: "Pick a profile." };
  const gh = await lookupGitHub(login);
  if (gh.exists === false) return { ok: false, error: `GitHub has no user called @${login}. Check the spelling.` };
  const m: Member = {
    login,
    displayLogin: gh.login ?? input.login.trim().replace(/^@/, ""),
    githubId: null,
    name: gh.name ?? null,
    image: gh.image ?? null,
    profileId: input.profileId,
    overrides: {},
    role: input.role === "admin" ? "admin" : "member",
    status: "active",
    note: input.note.slice(0, 200),
    invitedAt: new Date().toISOString(),
    lastSeenAt: null,
  };
  await saveMember(m);
  revalidatePath("/admin");
  return { ok: true, message: `Invited @${m.displayLogin}. Send them the app link; they sign in with GitHub.` };
}

export async function updateMember(
  login: string,
  patch: Partial<{ profileId: string; overrides: FeatureMap; role: "member" | "admin"; status: "active" | "revoked"; note: string }>,
): Promise<Result> {
  const g = await guard();
  if (g) return g;
  const m = await getMember(login);
  if (!m) return { ok: false, error: "That member no longer exists." };
  const next: Member = { ...m };
  if (patch.profileId !== undefined) {
    if (!(await getProfile(patch.profileId))) return { ok: false, error: "Unknown profile." };
    next.profileId = patch.profileId;
  }
  if (patch.overrides !== undefined) next.overrides = cleanFeatures(patch.overrides);
  if (patch.role !== undefined) next.role = patch.role === "admin" ? "admin" : "member";
  if (patch.status !== undefined) next.status = patch.status === "revoked" ? "revoked" : "active";
  if (patch.note !== undefined) next.note = patch.note.slice(0, 200);
  await saveMember(next);
  revalidatePath("/admin");
  return { ok: true };
}

export async function removeMember(login: string): Promise<Result> {
  const g = await guard();
  if (g) return g;
  await deleteMember(login);
  revalidatePath("/admin");
  return { ok: true };
}

export async function saveProfileAction(input: { id?: string; name: string; features: FeatureMap }): Promise<Result> {
  const g = await guard();
  if (g) return g;
  const name = input.name.trim().slice(0, 60);
  if (!name) return { ok: false, error: "Give the profile a name." };
  let id = input.id;
  if (!id) {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "profile";
    const taken = new Set((await listProfiles()).map((p) => p.id));
    id = base;
    for (let i = 2; taken.has(id); i++) id = `${base}-${i}`;
  } else if (!(await getProfile(id))) return { ok: false, error: "That profile no longer exists." };
  await saveProfile({ id, name, features: cleanFeatures(input.features) });
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteProfileAction(id: string): Promise<Result> {
  const g = await guard();
  if (g) return g;
  const users = (await listMembers()).filter((m) => m.profileId === id);
  if (users.length) return { ok: false, error: `Move ${users.map((m) => "@" + m.displayLogin).join(", ")} to another profile first.` };
  await deleteProfile(id);
  revalidatePath("/admin");
  return { ok: true };
}

export async function startPreview(login: string) {
  await requireAdmin();
  const m = await getMember(login);
  if (!m) return;
  (await cookies()).set(PREVIEW_COOKIE, m.login, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 4 });
  redirect("/");
}
