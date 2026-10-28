import { NextResponse } from "next/server";
import { get } from "@/lib/db";
import { createSession, verifyPassword, type User } from "@/lib/auth";
import { ApiError, assertSameOrigin, clientIp, errorResponse, rateLimit, readJson } from "@/lib/http";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const body = await readJson(req);
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    if (!email || !password) throw new ApiError(400, "Enter your email and password");

    rateLimit(`login:${clientIp(req.headers)}:${email}`, 12, 60_000);

    const user = get<User>("SELECT * FROM users WHERE email = ?", email);
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      throw new ApiError(401, "Invalid email or password");
    }

    await createSession(user.id);
    return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, plan: user.plan } });
  } catch (error) {
    return errorResponse(error);
  }
}
