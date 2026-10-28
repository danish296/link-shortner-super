import { NextResponse } from "next/server";
import { run } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { assertSameOrigin, errorResponse, readJson } from "@/lib/http";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    const body = await readJson(req);
    const enabled = Boolean(body.enabled);
    run("UPDATE users SET auto_renew = ? WHERE id = ?", enabled ? 1 : 0, user.id);
    return NextResponse.json({ ok: true, autoRenew: enabled });
  } catch (error) {
    return errorResponse(error);
  }
}
