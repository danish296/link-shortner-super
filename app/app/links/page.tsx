import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { linkStatus } from "@/lib/links";
import { queryLinks } from "@/lib/links-query";
import { getPlan } from "@/lib/plans";
import { campaignOptions } from "@/lib/quota";
import { getBaseUrl } from "@/lib/server-url";
import { parseJsonArray } from "@/lib/utils";
import { LinksView, type LinkListItem } from "@/components/links/links-view";

export const dynamic = "force-dynamic";

export default async function LinksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const read = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const filters = {
    q: (read("q") ?? "").slice(0, 120),
    status: read("status") ?? "all",
    sort: read("sort") ?? "newest",
    campaignId: read("campaignId") ?? "",
  };

  const base = await getBaseUrl();
  const result = queryLinks(user.id, {
    q: filters.q,
    status: filters.status,
    sort: filters.sort,
    campaignId: filters.campaignId || undefined,
    page: Number(read("page") ?? 1) || 1,
    size: 20,
  });

  const rows: LinkListItem[] = result.rows.map((row) => ({
    id: row.id,
    code: row.code,
    shortUrl: `${base}/${row.code}`,
    url: row.url,
    title: row.title,
    tags: parseJsonArray(row.tags),
    campaignId: row.campaign_id,
    domainId: row.domain_id,
    passwordProtected: Boolean(row.password_hash),
    expiresAt: row.expires_at,
    maxClicks: row.max_clicks,
    isActive: Boolean(row.is_active),
    utmSource: row.utm_source,
    utmMedium: row.utm_medium,
    utmCampaign: row.utm_campaign,
    utmTerm: row.utm_term,
    utmContent: row.utm_content,
    pixelMeta: row.pixel_meta,
    pixelGoogle: row.pixel_google,
    pixelTiktok: row.pixel_tiktok,
    variantB: row.variant_b,
    abWeight: row.ab_weight,
    status: linkStatus(row),
    clicks: row.click_count,
    createdAt: row.created_at,
    campaignName: row.campaign_name ?? null,
    campaignColor: row.campaign_color ?? null,
    domainHost: row.domain_host ?? null,
  }));

  const campaigns = campaignOptions(user.id);
  const domains = all<{ id: string; hostname: string }>(
    "SELECT id, hostname FROM domains WHERE user_id = ? AND verified = 1 ORDER BY hostname ASC",
    user.id
  );
  const plan = getPlan(user.plan);
  const initialUrl = (() => {
    const raw = read("url");
    if (!raw) return undefined;
    try {
      const parsed = new URL(raw);
      return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : undefined;
    } catch {
      return undefined;
    }
  })();

  return (
    <LinksView
      rows={rows}
      total={result.total}
      page={result.page}
      pages={result.pages}
      filters={filters}
      campaigns={campaigns}
      domains={domains}
      baseUrl={base}
      openNew={read("new") === "1"}
      campaignsLimit={plan.campaigns}
      defaultCampaignId={read("campaign")}
      defaultUrl={initialUrl}
    />
  );
}
