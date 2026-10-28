import { NextResponse } from "next/server";
import { run } from "@/lib/db";
import { hashPassword, requireApiUser, verifyPassword } from "@/lib/auth";
import { ApiError, assertSameOrigin, errorResponse, readJson } from "@/lib/http";

export async function PATCH(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    const body = await readJson(req);
    const current = String(body.current ?? "");
    const next = String(body.next ?? "");
    if (!(await verifyPassword(current, user.password_hash))) throw new ApiError(400, "Current password is incorrect");
    if (next.length < 8) throw new ApiError(400, "New password must be at least 8 characters");
    if (next === current) throw new ApiError(400, "New password must be different from the current one");

    run("UPDATE users SET password_hash = ? WHERE id = ?", await hashPassword(next), user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
