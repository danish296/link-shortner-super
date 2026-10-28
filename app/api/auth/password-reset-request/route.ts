import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { get, run } from "@/lib/db";
import { ApiError, assertSameOrigin, clientIp, errorResponse, rateLimit, readJson } from "@/lib/http";
import { isEmail } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    rateLimit(`reset-request:${clientIp(req.headers)}`, 6, 60_000);
    const body = await readJson(req);
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!isEmail(email)) throw new ApiError(400, "Enter a valid email address");

    const user = get<{ id: string }>("SELECT id FROM users WHERE email = ?", email);
    let resetUrl: string | null = null;
    if (user) {
      const token = randomBytes(24).toString("hex");
      run("UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?", token, Date.now() + 60 * 60 * 1000, user.id);
      resetUrl = `/reset-password?token=${token}`;
    }
    return NextResponse.json({
      ok: true,
      message: "If an account exists for that email, a reset link has been generated.",
      resetUrl,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
