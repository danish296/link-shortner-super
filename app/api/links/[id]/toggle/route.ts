import { NextResponse } from "next/server";
import { get, run } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { ApiError, assertSameOrigin, errorResponse } from "@/lib/http";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    const { id } = await context.params;
    const link = get<{ is_active: number }>("SELECT is_active FROM links WHERE id = ? AND user_id = ?", id, user.id);
    if (!link) throw new ApiError(404, "Link not found");
    const next = link.is_active ? 0 : 1;
    run("UPDATE links SET is_active = ?, updated_at = ? WHERE id = ?", next, Date.now(), id);
    return NextResponse.json({ ok: true, isActive: Boolean(next) });
  } catch (error) {
    return errorResponse(error);
  }
}
