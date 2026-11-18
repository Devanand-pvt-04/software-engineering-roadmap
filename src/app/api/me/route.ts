import { NextResponse, connection } from "next/server";
import { auth, authEnabled } from "@/auth";
import { dbEnabled } from "@/lib/db";

export async function GET() {
  await connection();
  const enabled = authEnabled && dbEnabled;
  if (!enabled) return NextResponse.json({ enabled: false, user: null });
  const s = await auth();
  const user = s?.user ? { name: s.user.name ?? null, image: s.user.image ?? null } : null;
  return NextResponse.json({ enabled, user }, { headers: { "cache-control": "no-store" } });
}
