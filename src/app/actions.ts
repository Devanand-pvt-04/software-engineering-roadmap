"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { PREVIEW_COOKIE } from "@/server/access";

export async function signInGitHub() {
  await signIn("github");
}
export async function signOutAction() {
  (await cookies()).delete(PREVIEW_COOKIE);
  await signOut();
}
export async function stopPreview() {
  (await cookies()).delete(PREVIEW_COOKIE);
  redirect("/admin");
}
