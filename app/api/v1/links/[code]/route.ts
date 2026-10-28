import { NextResponse } from "next/server";
import { get } from "@/lib/db";
import { apiKeyUser } from "@/lib/auth";
import { ApiError, errorResponse } from "@/lib/http";
import { linkStatus, serializeLink, type LinkRow } from "@/lib/links";
import { breakdown, dailySeries, sinceTs, totals } from "@/lib/stats";

export async function GET(req: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const user = await apiKeyUser(req);
    const { code } = await context.params;
    const link = get<LinkRow>("SELECT * FROM links WHERE code = ? AND user_id = ?", code, user.id);
    if (!link) throw new ApiError(404, "Link not found");

    const now = Date.now();
    const windowStart = sinceTs(30);
    const clicks = get<{ clicks: number; uniques: number; qr: number }>(
      `SELECT COUNT(*) clicks, COALESCE(SUM(is_unique),0) uniques, COALESCE(SUM(is_qr),0) qr
       FROM clicks WHERE link_id = ? AND is_bot = 0 AND ts >= ?`,
      link.id,
      windowStart
    );

    return NextResponse.json({
      ...serializeLink(link, new URL(req.url).origin),
      status: linkStatus(link),
      analytics: {
        range: "30d",
        clicks: Number(clicks?.clicks ?? 0),
        uniqueVisitors: Number(clicks?.uniques ?? 0),
        qrScans: Number(clicks?.qr ?? 0),
        series: dailySeries(user.id, 30, link.id),
        countries: breakdown(user.id, "country", 30, { linkId: link.id, limit: 10 }),
        devices: breakdown(user.id, "device", 30, { linkId: link.id, limit: 5 }),
        referrers: breakdown(user.id, "referrer", 30, { linkId: link.id, limit: 10 }),
      },
      generatedAt: new Date(now).toISOString(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
