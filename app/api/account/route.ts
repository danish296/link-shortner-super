import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { get, run } from "@/lib/db";
import { createApiKey, hashPassword, requireApiUser, verifyPassword, type User } from "@/lib/auth";
import { ApiError, assertSameOrigin, errorResponse, readJson } from "@/lib/http";
import { isEmail } from "@/lib/utils";

export async function PATCH(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    const body = await readJson(req);
    const name = body.name !== undefined ? String(body.name).trim() : user.name;
    const email = body.email !== undefined ? String(body.email).trim().toLowerCase() : user.email;

    if (name.length < 2 || name.length > 80) throw new ApiError(400, "Please enter your name");
    if (!isEmail(email)) throw new ApiError(400, "Please enter a valid email address");

    let verifyUrl: string | null = null;
    if (email !== user.email) {
      const existing = get<{ id: string }>("SELECT id FROM users WHERE email = ? AND id <> ?", email, user.id);
      if (existing) throw new ApiError(409, "That email is already in use");
      const token = randomBytes(16).toString("hex");
      run("UPDATE users SET name = ?, email = ?, email_verified = 0, verify_token = ? WHERE id = ?", name, email, token, user.id);
      verifyUrl = `/verify-email?token=${token}`;
    } else {
      run("UPDATE users SET name = ? WHERE id = ?", name, user.id);
    }

    return NextResponse.json({ ok: true, verifyUrl });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    run("DELETE FROM clicks WHERE user_id = ?", user.id);
    run("DELETE FROM links WHERE user_id = ?", user.id);
    run("DELETE FROM qrcodes WHERE user_id = ?", user.id);
    run("DELETE FROM page_blocks WHERE page_id IN (SELECT id FROM pages WHERE user_id = ?)", user.id);
    run("DELETE FROM pages WHERE user_id = ?", user.id);
    run("DELETE FROM domains WHERE user_id = ?", user.id);
    run("DELETE FROM campaigns WHERE user_id = ?", user.id);
    run("DELETE FROM invoices WHERE user_id = ?", user.id);
    run("DELETE FROM sessions WHERE user_id = ?", user.id);
    run("DELETE FROM users WHERE id = ?", user.id);
    const { destroySession } = await import("@/lib/auth");
    await destroySession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
