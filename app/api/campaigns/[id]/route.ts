import { NextResponse } from "next/server";
import { get, run } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { ApiError, assertSameOrigin, errorResponse, readJson } from "@/lib/http";
import { safeColor } from "@/lib/utils";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    const { id } = await context.params;
    const existing = get<{ id: string; name: string; description: string | null; color: string }>(
      "SELECT * FROM campaigns WHERE id = ? AND user_id = ?",
      id,
      user.id
    );
    if (!existing) throw new ApiError(404, "Campaign not found");

    const body = await readJson(req);
    const name = body.name !== undefined ? String(body.name).trim() : existing.name;
    if (name.length < 2 || name.length > 60) throw new ApiError(400, "Campaign name must be 2–60 characters");
    const duplicate = get<{ id: string }>(
      "SELECT id FROM campaigns WHERE user_id = ? AND lower(name) = lower(?) AND id <> ?",
      user.id,
      name,
      id
    );
    if (duplicate) throw new ApiError(409, "A campaign with that name already exists");

    run(
      "UPDATE campaigns SET name = ?, description = ?, color = ? WHERE id = ?",
      name,
      body.description !== undefined ? String(body.description).trim().slice(0, 200) || null : existing.description,
      body.color !== undefined ? safeColor(body.color) : existing.color,
      id
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    const { id } = await context.params;
    const existing = get<{ id: string }>("SELECT id FROM campaigns WHERE id = ? AND user_id = ?", id, user.id);
    if (!existing) throw new ApiError(404, "Campaign not found");
    run("UPDATE links SET campaign_id = NULL WHERE campaign_id = ?", id);
    run("DELETE FROM campaigns WHERE id = ?", id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
