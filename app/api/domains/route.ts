import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { get, run, uid } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { assertQuota } from "@/lib/quota";
import { ApiError, assertSameOrigin, errorResponse, readJson } from "@/lib/http";

function normalizeHostname(raw: unknown): string {
  let host = String(raw ?? "").trim().toLowerCase();
  host = host.replace(/^https?:\/\//, "").split("/")[0].split("?")[0];
  host = host.replace(/:\d+$/, "").replace(/\.$/, "");
  if (!/^(?=.{4,253}$)(?!-)[a-z0-9-]{1,63}(?:\.(?!-)[a-z0-9-]{1,63})+$/.test(host)) {
    throw new ApiError(400, "Enter a valid domain like go.yourbrand.com");
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) throw new ApiError(400, "Use a domain name, not an IP address");
  return host;
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    const body = await readJson(req);
    const hostname = normalizeHostname(body.hostname);

    const taken = get<{ id: string }>("SELECT id FROM domains WHERE hostname = ?", hostname);
    if (taken) throw new ApiError(409, "That domain is already connected to an account");
    assertQuota(user, "domains");

    const id = uid();
    const token = randomBytes(10).toString("hex");
    run(
      "INSERT INTO domains (id, user_id, hostname, verified, is_active, token, created_at) VALUES (?, ?, ?, 0, 1, ?, ?)",
      id,
      user.id,
      hostname,
      token,
      Date.now()
    );

    return NextResponse.json({
      ok: true,
      id,
      hostname,
      token,
      dns: { type: "TXT", name: `_linkshort.${hostname}`, value: token },
    }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
