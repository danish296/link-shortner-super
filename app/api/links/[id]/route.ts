import { NextResponse } from "next/server";
import { run, tx } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { ApiError, assertSameOrigin, errorResponse, readJson } from "@/lib/http";
import { serializeLink, updateLink } from "@/lib/links";

function parseExpiry(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Date.parse(String(value));
  if (!Number.isFinite(n)) throw new ApiError(400, "Invalid expiration date");
  return n;
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    const { id } = await context.params;
    const body = await readJson(req);

    const patch: Parameters<typeof updateLink>[2] = {};
    if ("url" in body) patch.url = String(body.url ?? "");
    if ("alias" in body) patch.alias = String(body.alias ?? "");
    if ("title" in body) patch.title = String(body.title ?? "");
    if ("campaignId" in body) patch.campaignId = body.campaignId ? String(body.campaignId) : null;
    if ("tags" in body) patch.tags = body.tags as string[];
    if ("password" in body) patch.password = body.password ? String(body.password) : "";
    if ("expiresAt" in body) patch.expiresAt = parseExpiry(body.expiresAt);
    if ("maxClicks" in body) patch.maxClicks = body.maxClicks ? Number(body.maxClicks) : null;
    if ("isActive" in body) patch.isActive = Boolean(body.isActive);
    if ("utmSource" in body) patch.utmSource = String(body.utmSource ?? "");
    if ("utmMedium" in body) patch.utmMedium = String(body.utmMedium ?? "");
    if ("utmCampaign" in body) patch.utmCampaign = String(body.utmCampaign ?? "");
    if ("utmTerm" in body) patch.utmTerm = String(body.utmTerm ?? "");
    if ("utmContent" in body) patch.utmContent = String(body.utmContent ?? "");
    if ("pixelMeta" in body) patch.pixelMeta = String(body.pixelMeta ?? "");
    if ("pixelGoogle" in body) patch.pixelGoogle = String(body.pixelGoogle ?? "");
    if ("pixelTiktok" in body) patch.pixelTiktok = String(body.pixelTiktok ?? "");
    if ("variantB" in body) patch.variantB = String(body.variantB ?? "");
    if ("abWeight" in body) patch.abWeight = Number(body.abWeight);
    if ("domainId" in body) patch.domainId = body.domainId ? String(body.domainId) : null;

    const link = await updateLink(user, id, patch);
    return NextResponse.json({ ok: true, link: serializeLink(link, new URL(req.url).origin) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    const { id } = await context.params;
    const { get } = await import("@/lib/db");
    const existing = get<{ id: string }>("SELECT id FROM links WHERE id = ? AND user_id = ?", id, user.id);
    if (!existing) throw new ApiError(404, "Link not found");

    tx(() => {
      run("DELETE FROM clicks WHERE link_id = ?", id);
      run("DELETE FROM qrcodes WHERE link_id = ?", id);
      run("DELETE FROM links WHERE id = ?", id);
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
