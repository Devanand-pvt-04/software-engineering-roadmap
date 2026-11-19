import { NextResponse } from "next/server";
import { getAccess } from "@/server/access";
import { dbEnabled, readProgress, writeProgress } from "@/lib/db";
import { emptyState, mergeState } from "@/lib/merge";

const MAX_BYTES = 2_000_000;

async function guard() {
  if (!dbEnabled) return { error: NextResponse.json({ error: "sync not configured" }, { status: 503 }) };
  const a = await getAccess();
  // Only invited, active members (and the owner) can read or write progress.
  if (a.status !== "ok" || !a.uid) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  return { uid: a.uid };
}

export async function GET() {
  const g = await guard();
  if (g.error) return g.error;
  const data = await readProgress(g.uid);
  return NextResponse.json(data ? mergeState(emptyState(), data) : emptyState());
}

async function save(req: Request) {
  const g = await guard();
  if (g.error) return g.error;
  const text = await req.text();
  if (text.length > MAX_BYTES) return NextResponse.json({ error: "too large" }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const existing = await readProgress(g.uid);
  const merged = mergeState(existing, body);
  await writeProgress(g.uid, merged);
  return NextResponse.json(merged);
}

export const PUT = save;
export const POST = save; // navigator.sendBeacon uses POST
