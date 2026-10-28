import { NextResponse } from "next/server";
import { resolveTxt } from "node:dns/promises";
import { get, run } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { ApiError, assertSameOrigin, errorResponse, readJson } from "@/lib/http";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    const { id } = await context.params;
    const domain = get<{ id: string; hostname: string; verified: number; is_active: number; token: string }>(
      "SELECT * FROM domains WHERE id = ? AND user_id = ?",
      id,
      user.id
    );
    if (!domain) throw new ApiError(404, "Domain not found");

    const body = await readJson(req);
    const action = String(body.action ?? "");

    if (action === "verify" || action === "simulate") {
      if (action === "simulate") {
        if (process.env.NODE_ENV === "production") throw new ApiError(403, "Simulated verification is disabled in production");
        run("UPDATE domains SET verified = 1 WHERE id = ?", id);
        return NextResponse.json({ ok: true, verified: true, simulated: true });
      }
      let records: string[][] = [];
      try {
        records = await resolveTxt(`_linkshort.${domain.hostname}`);
      } catch {
        throw new ApiError(400, `No TXT record found at _linkshort.${domain.hostname} yet. DNS changes can take a few minutes.`);
      }
      const values = records.map((chunks) => chunks.join(""));
      if (!values.includes(domain.token)) {
        throw new ApiError(400, "TXT record found, but the verification value doesn't match. Double-check the token.");
      }
      run("UPDATE domains SET verified = 1 WHERE id = ?", id);
      return NextResponse.json({ ok: true, verified: true });
    }

    if (action === "pause" || action === "resume") {
      run("UPDATE domains SET is_active = ? WHERE id = ?", action === "resume" ? 1 : 0, id);
      return NextResponse.json({ ok: true, isActive: action === "resume" });
    }

    throw new ApiError(400, "Unknown domain action");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    const { id } = await context.params;
    const domain = get<{ id: string }>("SELECT id FROM domains WHERE id = ? AND user_id = ?", id, user.id);
    if (!domain) throw new ApiError(404, "Domain not found");
    run("UPDATE links SET domain_id = NULL WHERE domain_id = ?", id);
    run("DELETE FROM domains WHERE id = ?", id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
