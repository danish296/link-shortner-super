import { NextResponse } from "next/server";
import { get, run } from "@/lib/db";
import { hashPassword, type User } from "@/lib/auth";
import { ApiError, assertSameOrigin, errorResponse, readJson } from "@/lib/http";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const body = await readJson(req);
    const token = String(body.token ?? "");
    const password = String(body.password ?? "");
    if (password.length < 8) throw new ApiError(400, "Password must be at least 8 characters");
    if (!token) throw new ApiError(400, "Reset token is missing");

    const user = get<User>("SELECT * FROM users WHERE reset_token = ? AND reset_expires > ?", token, Date.now());
    if (!user) throw new ApiError(400, "This reset link is invalid or has expired");

    const hash = await hashPassword(password);
    run("UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?", hash, user.id);
    run("DELETE FROM sessions WHERE user_id = ?", user.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
