import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { usageFor } from "@/lib/quota";
import { getBaseUrl } from "@/lib/server-url";
import { PagesView, type PageItem } from "@/components/pages/pages-view";

export const dynamic = "force-dynamic";

export default async function PagesPage() {
  const user = await requireUser();
  const plan = getPlan(user.plan);
  const usage = usageFor(user.id);
  const base = await getBaseUrl();

  const rows = all<{
    id: string;
    slug: string;
    title: string;
    bio: string | null;
    avatar: string | null;
    theme: string;
    accent: string;
    is_published: number;
    views: number;
    updated_at: number;
    blocks: number;
    blockClicks: number;
  }>(
    `SELECT p.id, p.slug, p.title, p.bio, p.avatar, p.theme, p.accent, p.is_published, p.views, p.updated_at,
            (SELECT COUNT(*) FROM page_blocks b WHERE b.page_id = p.id) AS blocks,
            (SELECT COALESCE(SUM(b.clicks),0) FROM page_blocks b WHERE b.page_id = p.id) AS blockClicks
     FROM pages p WHERE p.user_id = ? ORDER BY p.updated_at DESC`,
    user.id
  );

  const pages: PageItem[] = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    bio: row.bio,
    avatar: row.avatar,
    theme: row.theme,
    accent: row.accent,
    isPublished: Boolean(row.is_published),
    views: Number(row.views),
    blocks: Number(row.blocks),
    blockClicks: Number(row.blockClicks),
    updatedAt: row.updated_at,
    publicUrl: `${base}/p/${row.slug}`,
  }));

  return <PagesView pages={pages} limit={plan.pages} usage={usage.pages} />;
}
