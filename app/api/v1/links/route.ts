import { NextResponse } from "next/server";
import { apiKeyUser } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { linkStatus, serializeLink } from "@/lib/links";
import { queryLinks } from "@/lib/links-query";

export async function GET(req: Request) {
  try {
    const user = await apiKeyUser(req);
    const url = new URL(req.url);
    const result = queryLinks(user.id, {
      q: url.searchParams.get("q") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      page: Number(url.searchParams.get("page") ?? 1),
      size: Number(url.searchParams.get("size") ?? 20),
      sort: url.searchParams.get("sort") ?? undefined,
    });
    return NextResponse.json({
      data: result.rows.map((row) => ({ ...serializeLink(row, url.origin), status: linkStatus(row) })),
      pagination: { page: result.page, pages: result.pages, total: result.total, size: result.size },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
