import { NextResponse } from "next/server";
import { apiKeyUser } from "@/lib/auth";
import { ApiError, clientIp, errorResponse, rateLimit, readJson } from "@/lib/http";
import { createLink, serializeLink } from "@/lib/links";

function toTimestamp(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Date.parse(String(value));
  if (!Number.isFinite(n)) throw new ApiError(400, "expiresAt must be a valid ISO date or epoch milliseconds");
  return n;
}

export async function POST(req: Request) {
  try {
    const user = await apiKeyUser(req);
    rateLimit(`v1-shorten:${clientIp(req.headers)}:${user.id}`, 240, 60_000);
    const body = await readJson(req);

    const link = await createLink(user, {
      url: String(body.url ?? ""),
      alias: body.alias ? String(body.alias) : undefined,
      title: body.title ? String(body.title) : undefined,
      campaignId: body.campaignId ? String(body.campaignId) : null,
      tags: body.tags as string[] | string | undefined,
      password: body.password ? String(body.password) : null,
      expiresAt: toTimestamp(body.expiresAt),
      maxClicks: body.maxClicks ? Number(body.maxClicks) : null,
      utmSource: body.utmSource ? String(body.utmSource) : undefined,
      utmMedium: body.utmMedium ? String(body.utmMedium) : undefined,
      utmCampaign: body.utmCampaign ? String(body.utmCampaign) : undefined,
      variantB: body.variantB ? String(body.variantB) : undefined,
      abWeight: body.abWeight ? Number(body.abWeight) : undefined,
    });

    return NextResponse.json(serializeLink(link, new URL(req.url).origin), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
