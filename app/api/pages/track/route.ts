import { NextResponse } from "next/server";
import { get, run } from "@/lib/db";
import { logPageClick } from "@/lib/track";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const blockId = url.searchParams.get("b") || "";
  if (!blockId) return NextResponse.redirect(new URL("/", url.origin));

  const block = get<{ id: string; page_id: string; url: string | null; type: string }>(
    "SELECT id, page_id, url, type FROM page_blocks WHERE id = ?",
    blockId
  );
  if (!block) return NextResponse.redirect(new URL("/", url.origin));

  const page = get<{ id: string; slug: string; is_published: number }>(
    "SELECT id, slug, is_published FROM pages WHERE id = ?",
    block.page_id
  );
  if (!page) return NextResponse.redirect(new URL("/", url.origin));

  const back = new URL(`/p/${page.slug}`, url.origin);
  if (!page.is_published) return NextResponse.redirect(back);
  if (!block.url) return NextResponse.redirect(back);

  run("UPDATE page_blocks SET clicks = clicks + 1 WHERE id = ?", block.id);
  logPageClick(page.id, block.id, req.headers);

  return NextResponse.redirect(block.url, { status: 302, headers: { "cache-control": "no-store" } });
}
