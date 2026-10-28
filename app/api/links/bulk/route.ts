import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { ApiError, assertSameOrigin, errorResponse, readJson } from "@/lib/http";
import { createLink, serializeLink } from "@/lib/links";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    const body = await readJson(req);
    const text = String(body.text ?? "");
    const urls = Array.from(
      new Set(
        text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
      )
    ).slice(0, 50);

    if (urls.length === 0) throw new ApiError(400, "Paste at least one URL, one per line");

    const origin = new URL(req.url).origin;
    const created: Array<{ url: string; code: string; shortUrl: string }> = [];
    const failed: Array<{ url: string; error: string }> = [];

    for (const url of urls) {
      try {
        const link = await createLink(user, {
          url,
          campaignId: body.campaignId ? String(body.campaignId) : null,
          tags: body.tags as string[] | string | undefined,
        });
        const serialized = serializeLink(link, origin);
        created.push({ url: link.url, code: link.code, shortUrl: serialized.shortUrl });
      } catch (error) {
        failed.push({ url, error: error instanceof Error ? error.message : "Failed" });
      }
    }

    return NextResponse.json({ ok: true, created, failed });
  } catch (error) {
    return errorResponse(error);
  }
}
