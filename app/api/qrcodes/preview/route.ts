import { NextResponse } from "next/server";
import { get } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { renderQrSvg } from "@/lib/qr";
import { safeColor } from "@/lib/utils";

const ECC = new Set(["L", "M", "Q", "H"]);

export async function GET(req: Request) {
  try {
    const user = await requireApiUser();
    const params = new URL(req.url).searchParams;
    const code = params.get("code") ?? "";
    const link = get<{ code: string }>("SELECT code FROM links WHERE code = ? AND user_id = ?", code, user.id);
    if (!link) return NextResponse.json({ error: "Link not found" }, { status: 404 });

    const margin = Math.min(8, Math.max(0, Math.floor(Number(params.get("margin") ?? 2)) || 0));
    const rawEcc = (params.get("ecc") ?? "M").toUpperCase();
    const ecc = (ECC.has(rawEcc) ? rawEcc : "M") as "L" | "M" | "Q" | "H";
    const logo = (params.get("logo") ?? "").trim().slice(0, 6);

    const origin = process.env.APP_URL?.replace(/\/+$/, "") || new URL(req.url).origin;
    const svg = await renderQrSvg(`${origin}/${link.code}?qr=preview`, {
      fg: safeColor(params.get("fg"), "#0b1020"),
      bg: safeColor(params.get("bg"), "#ffffff"),
      margin,
      ecc,
      logo: logo || null,
    });

    return new NextResponse(svg, {
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
