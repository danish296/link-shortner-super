import { NextResponse } from "next/server";
import { run } from "@/lib/db";
import { createApiKey, requireApiUser } from "@/lib/auth";
import { assertSameOrigin, errorResponse } from "@/lib/http";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    const key = createApiKey();
    run("UPDATE users SET api_key = ? WHERE id = ?", key, user.id);
    return NextResponse.json({ ok: true, apiKey: key });
  } catch (error) {
    return errorResponse(error);
  }
}
