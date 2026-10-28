import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { run } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { assertSameOrigin, errorResponse } from "@/lib/http";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    if (user.email_verified) return NextResponse.json({ ok: true, alreadyVerified: true });
    const token = randomBytes(16).toString("hex");
    run("UPDATE users SET verify_token = ? WHERE id = ?", token, user.id);
    return NextResponse.json({
      ok: true,
      alreadyVerified: false,
      verifyUrl: `/verify-email?token=${token}`,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
