import { NextResponse } from "next/server";
import { get, run, uid } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { assertQuota } from "@/lib/quota";
import { campaignSummaries } from "@/lib/stats";
import { ApiError, assertSameOrigin, errorResponse, readJson } from "@/lib/http";
import { safeColor } from "@/lib/utils";

export async function GET() {
  try {
    const user = await requireApiUser();
    return NextResponse.json({ campaigns: campaignSummaries(user.id) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    const body = await readJson(req);
    const name = String(body.name ?? "").trim();
    if (name.length < 2 || name.length > 60) throw new ApiError(400, "Campaign name must be 2–60 characters");
    assertQuota(user, "campaigns");

    const exists = get<{ id: string }>("SELECT id FROM campaigns WHERE user_id = ? AND lower(name) = lower(?)", user.id, name);
    if (exists) throw new ApiError(409, "A campaign with that name already exists");

    const id = uid();
    run(
      "INSERT INTO campaigns (id, user_id, name, description, color, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      id,
      user.id,
      name,
      String(body.description ?? "").trim().slice(0, 200) || null,
      safeColor(body.color),
      Date.now()
    );

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
