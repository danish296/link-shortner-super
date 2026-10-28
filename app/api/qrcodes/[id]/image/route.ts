import { NextResponse } from "next/server";
import { get } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { renderQrSvg } from "@/lib/qr";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;
    const qr = get<{
      id: string;
      link_id: string;
      fg: string;
      bg: string;
      margin: number;
      ecc: string;
      logo: string | null;
    }>("SELECT id, link_id, fg, bg, margin, ecc, logo FROM qrcodes WHERE id = ? AND user_id = ?", id, user.id);
    if (!qr) return NextResponse.json({ error: "QR code not found" }, { status: 404 });

    const link = get<{ code: string }>("SELECT code FROM links WHERE id = ?", qr.link_id);
    if (!link) return NextResponse.json({ error: "Link not found" }, { status: 404 });

    const origin = process.env.APP_URL?.replace(/\/+$/, "") || new URL(req.url).origin;
    const target = `${origin}/${link.code}?qr=${qr.id}`;
    const svg = await renderQrSvg(target, {
      fg: qr.fg,
      bg: qr.bg,
      margin: qr.margin,
      ecc: qr.ecc as "L" | "M" | "Q" | "H",
      logo: qr.logo,
    });

    const download = new URL(req.url).searchParams.get("download") === "1";
    return new NextResponse(svg, {
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "cache-control": "no-store",
        ...(download ? { "content-disposition": `attachment; filename="linkshort-${qr.id}.svg"` } : {}),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
