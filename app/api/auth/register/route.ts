import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { get, run, uid } from "@/lib/db";
import { createApiKey, createSession, hashPassword } from "@/lib/auth";
import { ApiError, assertSameOrigin, clientIp, errorResponse, rateLimit, readJson } from "@/lib/http";
import { isEmail } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    rateLimit(`register:${clientIp(req.headers)}`, 10, 60_000);
    const body = await readJson(req);
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (name.length < 2 || name.length > 80) throw new ApiError(400, "Please enter your name");
    if (!isEmail(email)) throw new ApiError(400, "Please enter a valid email address");
    if (password.length < 8) throw new ApiError(400, "Password must be at least 8 characters");

    const existing = get<{ id: string }>("SELECT id FROM users WHERE email = ?", email);
    if (existing) throw new ApiError(409, "An account with this email already exists");

    const id = uid();
    const verifyToken = randomBytes(16).toString("hex");
    const passwordHash = await hashPassword(password);

    run(
      `INSERT INTO users (id, email, name, password_hash, plan, email_verified, verify_token, reset_token,
        reset_expires, api_key, auto_renew, plan_since, created_at)
       VALUES (?, ?, ?, ?, 'FREE', 0, ?, NULL, NULL, ?, 1, ?, ?)`,
      id, email, name, passwordHash, verifyToken, createApiKey(), Date.now(), Date.now()
    );

    await createSession(id);

    return NextResponse.json({
      ok: true,
      user: { id, name, email, plan: "FREE" },
      verifyUrl: `/verify-email?token=${verifyToken}`,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
