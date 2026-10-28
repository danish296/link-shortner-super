import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  ExternalLink,
  Globe2,
  Lock,
  MousePointerClick,
  QrCode,
  Tag,
  Users,
} from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { getLinkById, linkStatus } from "@/lib/links";
import { getPlan } from "@/lib/plans";
import { campaignOptions } from "@/lib/quota";
import { getBaseUrl } from "@/lib/server-url";
import { breakdown, clampDays, dailySeries, recentClicks, totals, variants } from "@/lib/stats";
import { formatDateTime, formatNumber, parseJsonArray, percent, timeAgo } from "@/lib/utils";
import { AreaChart, BarList, Donut } from "@/components/charts";
import { RangeTabs } from "@/components/analytics/range-tabs";
import { LinkDetailActions } from "@/components/links/link-detail-actions";
import type { LinkListItem } from "@/components/links/links-view";
import { CopyButton } from "@/components/copy-button";
import { EmptyState, PageHeader, SectionCard, StatCard, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function LinkDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const rawDays = Array.isArray(query.days) ? query.days[0] : query.days;

  const row = getLinkById(user.id, id);
  if (!row) notFound();

  const plan = getPlan(user.plan);
  const days = clampDays(rawDays, plan.analyticsDays);
  const base = await getBaseUrl();
  const status = linkStatus(row);
  const totalsNow = totals(user.id, days, row.id);
  const series = dailySeries(user.id, days, row.id);
  const countries = breakdown(user.id, "country", days, { linkId: row.id, limit: 6 });
  const cities = breakdown(user.id, "city", days, { linkId: row.id, limit: 5 });
  const devices = breakdown(user.id, "device", days, { linkId: row.id, limit: 4 });
  const browsers = breakdown(user.id, "browser", days, { linkId: row.id, limit: 5 });
  const referrers = breakdown(user.id, "referrer", days, { linkId: row.id, limit: 5 });
  const utmSources = breakdown(user.id, "utm_source", days, { linkId: row.id, limit: 5 });
  const ab = variants(row.id, days);
  const activity = recentClicks(user.id, 15, row.id);
  const qrCount = all<{ n: number }>("SELECT COUNT(*) n FROM qrcodes WHERE link_id = ?", row.id)[0]?.n ?? 0;

  const item: LinkListItem = {
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
    status,
    clicks: row.click_count,
    createdAt: row.created_at,
    campaignName: row.campaign_name ?? null,
    campaignColor: row.campaign_color ?? null,
    domainHost: row.domain_host ?? null,
  };

  const campaigns = campaignOptions(user.id);
  const domains = all<{ id: string; hostname: string }>(
    "SELECT id, hostname FROM domains WHERE user_id = ? AND verified = 1 ORDER BY hostname ASC",
    user.id
  );

  const utms = [
    ["source", row.utm_source],
    ["medium", row.utm_medium],
    ["campaign", row.utm_campaign],
    ["term", row.utm_term],
    ["content", row.utm_content],
  ].filter(([, value]) => Boolean(value)) as Array<[string, string]>;

  const meta: Array<[string, React.ReactNode]> = [
    [
      "Destination",
      <a
        key="destination"
        href={row.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex max-w-full items-center gap-1 truncate text-brand-ink hover:underline"
      >
        <span className="truncate">{row.url.replace(/^https?:\/\//, "")}</span>
        <ExternalLink size={11} className="shrink-0" />
      </a>,
    ],
    ["Status", <StatusBadge key="status" status={status} />],
    ["Campaign", row.campaign_name ?? <span key="campaign" className="text-muted">No campaign</span>],
    ["Domain", row.domain_host ?? <span key="domain" className="text-muted">Default domain</span>],
    ["Tags", item.tags.length ? item.tags.join(", ") : <span key="tags" className="text-muted">None</span>],
    [
      "Password",
      row.password_hash ? (
        <span key="password" className="inline-flex items-center gap-1 text-ink">
          <Lock size={11} /> Protected
        </span>
      ) : (
        <span key="password" className="text-muted">Open</span>
      ),
    ],
    ["Click limit", row.max_clicks ? `${formatNumber(row.click_count)} / ${formatNumber(row.max_clicks)}` : "Unlimited"],
    ["Expires", row.expires_at ? formatDateTime(row.expires_at) : "Never"],
    ["A/B split", row.variant_b ? `Variant B gets ${row.ab_weight}%` : "Off"],
    ["Created", formatDateTime(row.created_at)],
  ];

  return (
    <>
      <Link href="/app/links" className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-muted transition hover:text-ink">
        <ArrowLeft size={14} /> Back to links
      </Link>

      <PageHeader
        eyebrow={row.campaign_name ? `Campaign · ${row.campaign_name}` : "Short link"}
        title={row.title || `/${row.code}`}
        description={`Created ${timeAgo(row.created_at)} · ${formatNumber(row.click_count)} total clicks all time`}
        actions={<LinkDetailActions link={item} campaigns={campaigns} domains={domains} baseUrl={base} />}
      />

      <div className="card mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-card2 px-3 py-2">
          <span className="truncate font-mono text-sm text-ink">{item.shortUrl}</span>
          <CopyButton text={item.shortUrl} className="ml-auto shrink-0" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/app/qrcodes?link=${row.id}`} className="btn btn-outline btn-sm">
            <QrCode size={14} /> QR code {qrCount > 0 ? `(${qrCount})` : ""}
          </Link>
          <a href={item.shortUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
            <ExternalLink size={14} /> Open link
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={`Clicks · ${days}d`}
          value={formatNumber(totalsNow.clicks)}
          icon={<MousePointerClick size={16} />}
          sub="Tracked visits in range"
        />
        <StatCard
          label="Unique visitors"
          value={formatNumber(totalsNow.uniques)}
          icon={<Users size={16} />}
          sub={`${totalsNow.clicks ? percent(totalsNow.uniques, totalsNow.clicks) : 0}% of traffic`}
        />
        <StatCard
          label="QR scans"
          value={formatNumber(totalsNow.qr)}
          icon={<QrCode size={16} />}
          sub={`${totalsNow.clicks ? percent(totalsNow.qr, totalsNow.clicks) : 0}% came from print`}
        />
        <StatCard
          label="Countries"
          value={formatNumber(countries.length)}
          icon={<Globe2 size={16} />}
          sub={countries[0] ? `Top: ${countries[0].label}` : "No geography yet"}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SectionCard
          title="Clicks over time"
          subtitle={`Daily activity for /${row.code}`}
          className="xl:col-span-2"
          action={<RangeTabs basePath={`/app/links/${row.id}`} days={days} options={[7, 30, 90].filter((d) => d <= plan.analyticsDays)} />}
          bodyClassName="p-3 pt-2 sm:p-4 sm:pt-2"
        >
          <AreaChart id={`link-${row.id}`} data={series} height={250} />
        </SectionCard>

        <SectionCard title="Link details" subtitle="Configuration and routing rules">
          <dl className="space-y-3">
            {meta.map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-4 text-xs">
                <dt className="shrink-0 text-muted">{label}</dt>
                <dd className="min-w-0 max-w-[62%] break-words text-right">{value}</dd>
              </div>
            ))}
          </dl>
          {utms.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {utms.map(([key, value]) => (
                <span key={key} className="badge badge-muted font-mono !text-xs">
                  utm_{key}={value}
                </span>
              ))}
            </div>
          ) : null}
          {row.variant_b ? (
            <div className="mt-4 rounded-lg border border-line bg-card2 p-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
                <CalendarClock size={11} /> Variant B
              </div>
              <p className="mt-1 break-all text-xs text-muted">{row.variant_b.replace(/^https?:\/\//, "")}</p>
            </div>
          ) : null}
        </SectionCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SectionCard title="Devices" subtitle="How visitors browse">
          {devices.length ? <Donut items={devices} centerLabel="clicks" size={126} /> : <p className="text-xs text-muted">No data yet</p>}
        </SectionCard>
        <SectionCard title="Countries" subtitle="Top locations">
          <BarList items={countries} />
        </SectionCard>
        <SectionCard title="Referrers" subtitle="Where traffic comes from">
          <BarList items={referrers} emptyLabel="No referrers yet" />
        </SectionCard>
        <SectionCard title="Cities" subtitle="Top cities in range">
          <BarList items={cities} emptyLabel="No city data yet" />
        </SectionCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <SectionCard title="Browsers" subtitle="Browser share">
          <BarList items={browsers} emptyLabel="No browser data yet" />
        </SectionCard>
        <SectionCard title="UTM sources" subtitle="Campaign tagging">
          <BarList items={utmSources} emptyLabel="No UTM traffic yet" />
        </SectionCard>
        <SectionCard title="A/B test" subtitle={row.variant_b ? `${row.ab_weight}% sent to variant B` : "Not configured"}>
          {row.variant_b ? (
            ab.length ? (
              <div className="space-y-3">
                {ab.map((variant, index) => {
                  const total = ab.reduce((sum, value) => sum + value.clicks, 0) || 1;
                  const pct = Math.round((variant.clicks / total) * 100);
                  return (
                    <div key={variant.variant}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-semibold">Variant {variant.variant === "B" ? "B" : "A"}</span>
                        <span className="text-muted">
                          {formatNumber(variant.clicks)} · {pct}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-card2">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(pct, 2)}%`,
                            background: index === 0 ? "var(--brand)" : "var(--accent)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                <p className="text-xs text-muted">Split is random per visitor; results are logged with every click.</p>
              </div>
            ) : (
              <p className="text-xs text-muted">No split traffic in this range yet.</p>
            )
          ) : (
            <p className="text-xs text-muted">Add a variant B URL in the link settings to start a split test.</p>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Recent clicks"
        subtitle="Most recent tracked visits for this link"
        className="mt-4"
        bodyClassName="p-0"
      >
        {activity.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<MousePointerClick size={18} />}
              title="No clicks in this range"
              description="Share the link or scan its QR code to see live activity here."
            />
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Location</th>
                  <th className="hidden md:table-cell">Device</th>
                  <th className="hidden lg:table-cell">Referrer</th>
                  <th className="text-right">Attributes</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((click) => (
                  <tr key={click.id}>
                    <td className="whitespace-nowrap">
                      <div className="text-xs">{timeAgo(click.ts)}</div>
                      <div className="text-xs text-muted">{formatDateTime(click.ts)}</div>
                    </td>
                    <td>
                      <div className="text-xs">{click.city || "Unknown"}</div>
                      <div className="text-xs uppercase tracking-wider text-muted">{click.country || "—"}</div>
                    </td>
                    <td className="hidden md:table-cell">
                      <div className="text-xs">{click.device || "Desktop"}</div>
                      <div className="text-xs text-muted">{click.browser || "Unknown"} · {click.os || "—"}</div>
                    </td>
                    <td className="hidden max-w-[180px] truncate text-xs text-muted lg:table-cell">{click.referrer_host || "Direct"}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        {click.is_unique ? <span className="badge badge-accent !py-0 text-xs">unique</span> : null}
                        {click.is_qr ? <span className="badge badge-warn !py-0 text-xs">QR</span> : null}
                        {click.variant ? <span className="badge badge-brand !py-0 text-xs">{click.variant}</span> : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <p className="mt-4 flex items-center gap-2 text-xs text-muted">
        <Tag size={12} /> Analytics for this link are limited to {plan.analyticsDays} days on the {plan.name} plan.
      </p>
    </>
  );
}
