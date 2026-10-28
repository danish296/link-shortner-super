import { NextResponse } from "next/server";
import { get, run, uid } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { assertQuota } from "@/lib/quota";
import { ApiError, assertSameOrigin, errorResponse, readJson } from "@/lib/http";
import { safeColor } from "@/lib/utils";

const ECC = new Set(["L", "M", "Q", "H"]);

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    const body = await readJson(req);
    const linkId = String(body.linkId ?? "");
    const link = get<{ id: string }>("SELECT id FROM links WHERE id = ? AND user_id = ?", linkId, user.id);
    if (!link) throw new ApiError(400, "Choose a link to generate a QR code for");
    assertQuota(user, "qrcodes");

    const name = String(body.name ?? "").trim().slice(0, 60) || "QR code";
    const margin = Math.min(8, Math.max(0, Math.floor(Number(body.margin ?? 2)) || 0));
    const ecc = String(body.ecc ?? "M").toUpperCase();
    if (!ECC.has(ecc)) throw new ApiError(400, "Invalid error correction level");
    const logo = String(body.logo ?? "").trim().slice(0, 6);

    const id = uid();
    run(
      `INSERT INTO qrcodes (id, user_id, link_id, name, fg, bg, margin, ecc, logo, scans, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      id,
      user.id,
      linkId,
      name,
      safeColor(body.fg, "#0b1020"),
      safeColor(body.bg, "#ffffff"),
      margin,
      ecc,
      logo || null,
      Date.now()
    );

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
