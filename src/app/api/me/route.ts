import { NextResponse, connection } from "next/server";
import { auth, authEnabled } from "@/auth";
import { dbEnabled } from "@/lib/db";

export async function GET() {
  await connection();
  const enabled = authEnabled && dbEnabled;
  if (!enabled) {
    // Booleans only, so a misconfigured deploy says what's missing without exposing values.
    const missing = [
      !process.env.AUTH_SECRET && "AUTH_SECRET",
      !process.env.AUTH_GITHUB_ID && "AUTH_GITHUB_ID",
      !process.env.AUTH_GITHUB_SECRET && "AUTH_GITHUB_SECRET",
      !dbEnabled && "DATABASE_URL",
    ].filter(Boolean);
    return NextResponse.json({ enabled: false, user: null, missing });
  }
  const s = await auth();
  const user = s?.user ? { name: s.user.name ?? null, image: s.user.image ?? null } : null;
  return NextResponse.json({ enabled, user }, { headers: { "cache-control": "no-store" } });
}
