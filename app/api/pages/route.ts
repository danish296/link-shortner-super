import { NextResponse } from "next/server";
import { get, run, uid } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { assertQuota } from "@/lib/quota";
import { ApiError, assertSameOrigin, errorResponse, readJson } from "@/lib/http";
import { initials, normalizeUrl, safeColor, slugify } from "@/lib/utils";

const THEMES = new Set(["midnight", "aurora", "sunset", "ocean", "mono", "candy"]);
const BLOCK_TYPES = new Set(["link", "social", "heading", "text"]);

interface BlockInput {
  id?: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  url: string | null;
  sort: number;
}

function normalizeBlock(raw: Record<string, unknown>, index: number): BlockInput {
  const type = String(raw.type ?? "link");
  if (!BLOCK_TYPES.has(type)) throw new ApiError(400, "Invalid block type");
  let url: string | null = null;
  const title = String(raw.title ?? "").trim().slice(0, 120) || null;
  const subtitle = String(raw.subtitle ?? "").trim().slice(0, 300) || null;

  if (type === "link" || type === "social") {
    if (!title) throw new ApiError(400, "Every button needs a title");
    try {
      url = normalizeUrl(raw.url);
    } catch {
      throw new ApiError(400, `The link behind “${title}” is not a valid URL`);
    }
  } else if (type === "heading" && !title) {
    throw new ApiError(400, "Headings need some text");
  } else if (type === "text" && !title && !subtitle) {
    throw new ApiError(400, "Text blocks need some content");
  }

  const validId = raw.id && /^[a-zA-Z0-9_-]{1,64}$/.test(String(raw.id)) ? String(raw.id) : undefined;
  return { id: validId, type, title, subtitle, url, sort: index };
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    const body = await readJson(req);
    const title = String(body.title ?? "").trim();
    if (title.length < 2 || title.length > 80) throw new ApiError(400, "Page title must be 2–80 characters");
    assertQuota(user, "pages");

    let slug = slugify(String(body.slug ?? "") || title);
    if (slug.length < 3) slug = `page-${Math.random().toString(36).slice(2, 8)}`;
    const taken = get<{ id: string }>("SELECT id FROM pages WHERE slug = ?", slug);
    if (taken) throw new ApiError(409, "That page URL is already taken");

    const theme = THEMES.has(String(body.theme)) ? String(body.theme) : "midnight";
    const id = uid();
    const ts = Date.now();
    run(
      `INSERT INTO pages (id, user_id, slug, title, bio, avatar, theme, accent, is_published, views, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)`,
      id,
      user.id,
      slug,
      title,
      String(body.bio ?? "").trim().slice(0, 300) || null,
      initials(title).slice(0, 3) || "LS",
      theme,
      safeColor(body.accent),
      ts,
      ts
    );

    return NextResponse.json({ ok: true, id, slug }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: Request) {
  return NextResponse.json({ error: "Use PATCH /api/pages/[id]" }, { status: 405 });
}
