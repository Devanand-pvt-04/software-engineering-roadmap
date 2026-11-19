import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { auth, authEnabled } from "@/auth";
import { dbEnabled } from "@/lib/db";
import { ALL_FEATURES, resolveFeatures, type FeatureId } from "@/lib/features";
import type { Role } from "@/lib/content";
import { getMember, getProfile, isOwner, norm, touchMember, type Member } from "./members";

export const PREVIEW_COOKIE = "ztd-preview";

export interface Access {
  /** open: sign-in isn't configured (local use), everything is on. */
  status: "open" | "anon" | "relogin" | "denied" | "ok";
  role: Role | null;
  login: string | null;
  uid: string | null;
  name: string | null;
  features: FeatureId[];
  /** Admin previewing as this member. */
  previewAs: string | null;
}

const NONE = { role: null, login: null, uid: null, name: null, features: [] as FeatureId[], previewAs: null };

export async function featuresOf(m: Member): Promise<FeatureId[]> {
  if (m.role === "admin") return ALL_FEATURES;
  const p = await getProfile(m.profileId);
  return resolveFeatures(p?.features ?? {}, m.overrides);
}

/** Who is asking and what they may see. Cached per request. */
export const getAccess = cache(async (): Promise<Access> => {
  await connection(); // always per request, never baked into a static page
  if (!authEnabled) return { ...NONE, status: "open", role: "open", features: ALL_FEATURES };
  const s = await auth();
  const u = s?.user as { id?: string; login?: string; githubId?: string; name?: string | null; image?: string | null } | undefined;
  if (!u) return { ...NONE, status: "anon" };
  // Sessions from before invites existed don't carry the GitHub username.
  if (!u.login) return { ...NONE, status: "relogin" };
  const login = norm(u.login);
  const base = { login, uid: u.id ?? null, name: u.name ?? null };

  let role: Role;
  let features: FeatureId[];
  if (isOwner(login)) {
    role = "owner";
    features = ALL_FEATURES;
  } else {
    const m = dbEnabled ? await getMember(login) : null;
    if (!m || m.status !== "active") return { ...NONE, ...base, status: "denied" };
    await touchMember(m, { githubId: u.githubId ?? null, name: u.name ?? null, image: u.image ?? null, login: u.login }).catch(() => {});
    role = m.role;
    features = await featuresOf(m);
  }

  if (role === "owner" || role === "admin") {
    const preview = (await cookies()).get(PREVIEW_COOKIE)?.value;
    const pm = preview ? await getMember(preview) : null;
    if (pm && pm.role !== "admin") return { ...base, status: "ok", role, features: await featuresOf(pm), previewAs: pm.displayLogin };
  }
  return { ...base, status: "ok", role, features, previewAs: null };
});

export const isAdminRole = (r: Role | null) => r === "owner" || r === "admin" || r === "open";

/**
 * For pages: the person's access if they have every feature listed, else null. Pages render <Missing />
 * for null, so a feature someone doesn't have looks exactly like a page that doesn't exist.
 */
export async function allowed(...fs: FeatureId[]): Promise<Access | null> {
  const a = await getAccess();
  if (a.status !== "ok" && a.status !== "open") return null;
  return fs.every((f) => a.features.includes(f)) ? a : null;
}

/** Page title that is only revealed to people who can open the page. */
export async function titleFor(title: string, ...fs: FeatureId[]) {
  return { title: (await allowed(...fs)) ? title : "Not found" };
}

/** Real admin rights (ignores preview). */
export async function requireAdmin() {
  const a = await getAccess();
  if ((a.status !== "ok" && a.status !== "open") || !isAdminRole(a.role)) notFound();
  return a;
}
export async function adminAccess() {
  const a = await getAccess();
  return (a.status === "ok" || a.status === "open") && isAdminRole(a.role) ? a : null;
}
