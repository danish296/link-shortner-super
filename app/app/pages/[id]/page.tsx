import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { getBaseUrl } from "@/lib/server-url";
import { PageEditor, type EditorBlock } from "@/components/pages/page-editor";

export const dynamic = "force-dynamic";

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const page = get<{
    id: string;
    slug: string;
    title: string;
    bio: string | null;
    avatar: string | null;
    theme: string;
    accent: string;
    is_published: number;
    views: number;
  }>("SELECT id, slug, title, bio, avatar, theme, accent, is_published, views FROM pages WHERE id = ? AND user_id = ?", id, user.id);
  if (!page) notFound();

  const blocks = all<{ id: string; type: string; title: string | null; subtitle: string | null; url: string | null }>(
    "SELECT id, type, title, subtitle, url FROM page_blocks WHERE page_id = ? ORDER BY sort ASC",
    id
  );

  const editorBlocks: EditorBlock[] = blocks.map((block) => ({
    id: block.id,
    type: (block.type as EditorBlock["type"]) ?? "link",
    title: block.title ?? "",
    subtitle: block.subtitle ?? "",
    url: block.url ?? "",
  }));

  const base = await getBaseUrl();

  return (
    <PageEditor
      page={{
        id: page.id,
        slug: page.slug,
        title: page.title,
        bio: page.bio,
        avatar: page.avatar,
        theme: page.theme,
        accent: page.accent,
        isPublished: Boolean(page.is_published),
        views: Number(page.views),
      }}
      blocks={editorBlocks}
      baseUrl={base}
    />
  );
}
