import { NextResponse } from "next/server";
import { currentUserId } from "@/auth";
import { dbEnabled, readAsset, writeAsset } from "@/lib/db";

// Images added to notes, one per request, as a data: URL. The browser compresses them first.
const MAX_BYTES = 3_000_000;
const ID = /^[a-z0-9]{4,40}$/;
const DATA_URL = /^data:image\/(png|jpeg|webp|gif|svg\+xml|avif);base64,[A-Za-z0-9+/=]+$/;

async function guard(params: Promise<{ id: string }>) {
  if (!dbEnabled) return { error: NextResponse.json({ error: "sync not configured" }, { status: 503 }) };
  const uid = await currentUserId();
  if (!uid) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  const { id } = await params;
  if (!ID.test(id)) return { error: NextResponse.json({ error: "bad id" }, { status: 400 }) };
  return { uid, id };
}

export async function GET(_req: Request, ctx: RouteContext<"/api/assets/[id]">) {
  const g = await guard(ctx.params);
  if (g.error) return g.error;
  const row = await readAsset(g.uid, g.id);
  if (!row?.url) return NextResponse.json({ error: "not found" }, { status: 404 });
  return new NextResponse(row.url, { headers: { "content-type": "text/plain", "cache-control": "private, max-age=31536000, immutable" } });
}

export async function PUT(req: Request, ctx: RouteContext<"/api/assets/[id]">) {
  const g = await guard(ctx.params);
  if (g.error) return g.error;
  const text = await req.text();
  if (text.length > MAX_BYTES) return NextResponse.json({ error: "too large" }, { status: 413 });
  if (!DATA_URL.test(text)) return NextResponse.json({ error: "not an image" }, { status: 400 });
  await writeAsset(g.uid, g.id, text);
  return NextResponse.json({ ok: true });
}
