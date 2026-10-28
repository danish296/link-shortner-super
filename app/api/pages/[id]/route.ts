import { NextResponse } from "next/server";
import { get, run, uid, tx } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { ApiError, assertSameOrigin, errorResponse, readJson } from "@/lib/http";
import { normalizeUrl, safeColor, slugify } from "@/lib/utils";

const THEMES = new Set(["midnight", "aurora", "sunset", "ocean", "mono", "candy"]);
const BLOCK_TYPES = new Set(["link", "social", "heading", "text"]);

interface PageBlockRow {
  id: string;
  page_id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  url: string | null;
  sort: number;
  clicks: number;
}

function normalizeBlock(raw: Record<string, unknown>, index: number) {
  const type = String(raw.type ?? "link");
  if (!BLOCK_TYPES.has(type)) throw new ApiError(400, "Invalid block type");
  const title = String(raw.title ?? "").trim().slice(0, 120) || null;
  const subtitle = String(raw.subtitle ?? "").trim().slice(0, 300) || null;
  let url: string | null = null;

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

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    const { id } = await context.params;
    const page = get<{
      id: string;
      slug: string;
      title: string;
      bio: string | null;
      avatar: string | null;
      theme: string;
      accent: string;
      is_published: number;
    }>("SELECT * FROM pages WHERE id = ? AND user_id = ?", id, user.id);
    if (!page) throw new ApiError(404, "Page not found");

    const body = await readJson(req);
    const title = body.title !== undefined ? String(body.title).trim() : page.title;
    if (title.length < 2 || title.length > 80) throw new ApiError(400, "Page title must be 2–80 characters");

    let slug = page.slug;
    if (body.slug !== undefined) {
      slug = slugify(String(body.slug));
      if (slug.length < 3) throw new ApiError(400, "Page URL must be at least 3 characters");
      const taken = get<{ id: string }>("SELECT id FROM pages WHERE slug = ? AND id <> ?", slug, id);
      if (taken) throw new ApiError(409, "That page URL is already taken");
    }

    const theme = body.theme !== undefined ? String(body.theme) : page.theme;
    if (!THEMES.has(theme)) throw new ApiError(400, "Invalid page theme");

    const blocksRaw = Array.isArray(body.blocks) ? (body.blocks as Array<Record<string, unknown>>) : null;
    if (blocksRaw && blocksRaw.length > 30) throw new ApiError(400, "A page can have at most 30 blocks");
    const blocks = blocksRaw ? blocksRaw.map(normalizeBlock) : null;

    tx(() => {
      run(
        `UPDATE pages SET title = ?, slug = ?, bio = ?, avatar = ?, theme = ?, accent = ?, is_published = ?, updated_at = ?
         WHERE id = ?`,
        title,
        slug,
        body.bio !== undefined ? String(body.bio).trim().slice(0, 300) || null : page.bio,
        body.avatar !== undefined ? String(body.avatar).trim().slice(0, 3).toUpperCase() || null : page.avatar,
        theme,
        body.accent !== undefined ? safeColor(body.accent) : page.accent,
        body.isPublished !== undefined ? (body.isPublished ? 1 : 0) : page.is_published,
        Date.now(),
        id
      );

      if (blocks) {
        const kept: string[] = [];
        for (const block of blocks) {
          if (block.id) {
            const existing = get<{ id: string }>(
              "SELECT id FROM page_blocks WHERE id = ? AND page_id = ?",
              block.id,
              id
            );
            if (existing) {
              run(
                "UPDATE page_blocks SET type = ?, title = ?, subtitle = ?, url = ?, sort = ? WHERE id = ?",
                block.type,
                block.title,
                block.subtitle,
                block.url,
                block.sort,
                block.id
              );
              kept.push(block.id);
              continue;
            }
          }
          const newId = uid();
          run(
            "INSERT INTO page_blocks (id, page_id, type, title, subtitle, url, sort, clicks) VALUES (?, ?, ?, ?, ?, ?, ?, 0)",
            newId,
            id,
            block.type,
            block.title,
            block.subtitle,
            block.url,
            block.sort
          );
          kept.push(newId);
        }
        if (kept.length > 0) {
          const placeholders = kept.map(() => "?").join(",");
          run(`DELETE FROM page_blocks WHERE page_id = ? AND id NOT IN (${placeholders})`, id, ...kept);
        } else {
          run("DELETE FROM page_blocks WHERE page_id = ?", id);
        }
      }
    });

    return NextResponse.json({ ok: true, slug });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    const { id } = await context.params;
    const page = get<{ id: string }>("SELECT id FROM pages WHERE id = ? AND user_id = ?", id, user.id);
    if (!page) throw new ApiError(404, "Page not found");
    tx(() => {
      run("DELETE FROM page_blocks WHERE page_id = ?", id);
      run("DELETE FROM clicks WHERE page_id = ?", id);
      run("DELETE FROM pages WHERE id = ?", id);
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
