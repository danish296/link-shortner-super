import { NextResponse } from "next/server";
import { get } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { ApiError, assertSameOrigin, errorResponse, readJson } from "@/lib/http";
import { linkStatus } from "@/lib/links";
import { queryLinks } from "@/lib/links-query";
import { serializeLink } from "@/lib/links";

export async function GET(req: Request) {
  try {
    const user = await requireApiUser();
    const url = new URL(req.url);
    const result = queryLinks(user.id, {
      q: url.searchParams.get("q") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      page: Number(url.searchParams.get("page") ?? 1),
      size: Number(url.searchParams.get("size") ?? 20),
      sort: url.searchParams.get("sort") ?? undefined,
      campaignId: url.searchParams.get("campaignId") ?? undefined,
    });

    return NextResponse.json({
      links: result.rows.map((row) => ({ ...serializeLink(row, url.origin), status: linkStatus(row) })),
      page: result.page,
      pages: result.pages,
      total: result.total,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    const body = await readJson(req);
    const { createLink } = await import("@/lib/links");

    const link = await createLink(user, {
      url: String(body.url ?? ""),
      alias: body.alias ? String(body.alias) : undefined,
      title: body.title ? String(body.title) : undefined,
      campaignId: body.campaignId ? String(body.campaignId) : null,
      tags: body.tags as string[] | string | undefined,
      password: body.password ? String(body.password) : null,
      expiresAt: body.expiresAt ? Number(body.expiresAt) : null,
      maxClicks: body.maxClicks ? Number(body.maxClicks) : null,
      utmSource: body.utmSource ? String(body.utmSource) : undefined,
      utmMedium: body.utmMedium ? String(body.utmMedium) : undefined,
      utmCampaign: body.utmCampaign ? String(body.utmCampaign) : undefined,
      utmTerm: body.utmTerm ? String(body.utmTerm) : undefined,
      utmContent: body.utmContent ? String(body.utmContent) : undefined,
      pixelMeta: body.pixelMeta ? String(body.pixelMeta) : undefined,
      pixelGoogle: body.pixelGoogle ? String(body.pixelGoogle) : undefined,
      pixelTiktok: body.pixelTiktok ? String(body.pixelTiktok) : undefined,
      variantB: body.variantB ? String(body.variantB) : undefined,
      abWeight: body.abWeight ? Number(body.abWeight) : undefined,
      domainId: body.domainId ? String(body.domainId) : null,
    });

    const origin = new URL(req.url).origin;
    return NextResponse.json({ ok: true, link: serializeLink(link, origin) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
