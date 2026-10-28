import { NextResponse } from "next/server";
import { get, run } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { ApiError, assertSameOrigin, errorResponse, readJson } from "@/lib/http";
import { safeColor } from "@/lib/utils";

const ECC = new Set(["L", "M", "Q", "H"]);

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    const { id } = await context.params;
    const existing = get<{ id: string; name: string; fg: string; bg: string; margin: number; ecc: string; logo: string | null }>(
      "SELECT * FROM qrcodes WHERE id = ? AND user_id = ?",
      id,
      user.id
    );
    if (!existing) throw new ApiError(404, "QR code not found");
    const body = await readJson(req);
    const ecc = body.ecc !== undefined ? String(body.ecc).toUpperCase() : existing.ecc;
    if (!ECC.has(ecc)) throw new ApiError(400, "Invalid error correction level");

    run(
      "UPDATE qrcodes SET name = ?, fg = ?, bg = ?, margin = ?, ecc = ?, logo = ? WHERE id = ?",
      body.name !== undefined ? String(body.name).trim().slice(0, 60) || existing.name : existing.name,
      body.fg !== undefined ? safeColor(body.fg, existing.fg) : existing.fg,
      body.bg !== undefined ? safeColor(body.bg, existing.bg) : existing.bg,
      body.margin !== undefined ? Math.min(8, Math.max(0, Math.floor(Number(body.margin)) || 0)) : existing.margin,
      ecc,
      body.logo !== undefined ? String(body.logo).trim().slice(0, 6) || null : existing.logo,
      id
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    const { id } = await context.params;
    const existing = get<{ id: string }>("SELECT id FROM qrcodes WHERE id = ? AND user_id = ?", id, user.id);
    if (!existing) throw new ApiError(404, "QR code not found");
    run("DELETE FROM qrcodes WHERE id = ?", id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
