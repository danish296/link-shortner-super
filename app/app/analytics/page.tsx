import Link from "next/link";
import { ArrowUpRight, BarChart3, Download, Globe2, MousePointerClick, QrCode, Users } from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { get } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { campaignOptions } from "@/lib/quota";
import { breakdown, clampDays, dailySeries, recentClicks, topLinks, totals } from "@/lib/stats";
import { formatNumber, percent, timeAgo } from "@/lib/utils";
import { AreaChart, BarList, Donut } from "@/components/charts";
import { RangeTabs } from "@/components/analytics/range-tabs";
import { EmptyState, Meter, PageHeader, SectionCard, StatCard } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const read = (key: string) => (Array.isArray(params[key]) ? params[key][0] : params[key]);

  const plan = getPlan(user.plan);
  const days = clampDays(read("days"), plan.analyticsDays);
  const campaignId = read("campaign") ?? "";
  const campaign = campaignId ? get<{ id: string; name: string; color: string }>("SELECT id, name, color FROM campaigns WHERE id = ? AND user_id = ?", campaignId, user.id) : undefined;
  const scope = campaign?.id;

  const current = totals(user.id, days, undefined, scope);
  const previous = totals(user.id, days * 2, undefined, scope);
  const series = dailySeries(user.id, days, undefined, scope);
  const countries = breakdown(user.id, "country", days, { campaignId: scope, limit: 8 });
  const cities = breakdown(user.id, "city", days, { campaignId: scope, limit: 6 });
  const devices = breakdown(user.id, "device", days, { campaignId: scope, limit: 4 });
  const browsers = breakdown(user.id, "browser", days, { campaignId: scope, limit: 6 });
  const os = breakdown(user.id, "os", days, { campaignId: scope, limit: 6 });
  const referrers = breakdown(user.id, "referrer", days, { campaignId: scope, limit: 8 });
  const utmSources = breakdown(user.id, "utm_source", days, { campaignId: scope, limit: 6 });
  const utmCampaigns = breakdown(user.id, "utm_campaign", days, { campaignId: scope, limit: 6 });
  const leaders = topLinks(user.id, days, 8, scope);
  const activity = recentClicks(user.id, 20, undefined, scope);
  const campaigns = campaignOptions(user.id);

  const prevClicks = previous.clicks - current.clicks;
  const delta = prevClicks > 0 ? Math.round(((current.clicks - prevClicks) / prevClicks) * 1000) / 10 : current.clicks > 0 ? 100 : 0;
  const uniqueRate = percent(current.uniques, current.clicks);
  const qrShare = percent(current.qr, current.clicks);
  const maxDay = series.reduce((best, point) => (point.clicks > best.clicks ? point : best), series[0]);

  const rangeOptions = [7, 30, 90, 365].filter((value) => value <= plan.analyticsDays);

  return (
    <>
      <PageHeader
        eyebrow={campaign ? `Campaign · ${campaign.name}` : "Workspace"}
        title="Analytics"
        description={`Traffic across ${campaign ? "this campaign" : "all of your links"} for the last ${days} days. Bots are filtered out automatically.`}
        actions={
          <a href={`/api/export/clicks?days=${days}`} className="btn btn-outline btn-sm">
            <Download size={14} /> Export CSV
          </a>
        }
      />

      <div className="card mb-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <RangeTabs basePath="/app/analytics" days={days} options={rangeOptions} extra={{ campaign: scope }} />
        <form action="/app/analytics" className="flex items-center gap-2 sm:ml-auto">
          <input type="hidden" name="days" value={days} />
          <label htmlFor="analytics-campaign" className="whitespace-nowrap text-xs text-muted">
            Campaign
          </label>
          <select id="analytics-campaign" name="campaign" defaultValue={scope ?? ""} className="select input-sm w-44">
            <option value="">All campaigns</option>
            {campaigns.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-outline btn-sm">
            Apply
          </button>
          {campaign ? (
            <Link href={`/app/analytics?days=${days}`} className="text-xs font-semibold text-muted hover:text-ink">
              Clear
            </Link>
          ) : null}
        </form>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={`Clicks · ${days}d`}
          value={formatNumber(current.clicks)}
          icon={<MousePointerClick size={16} />}
          sub={`${delta >= 0 ? "+" : ""}${delta}% vs previous ${days}d`}
        />
        <StatCard label="Unique visitors" value={formatNumber(current.uniques)} icon={<Users size={16} />} sub={`${uniqueRate}% unique rate`} />
        <StatCard label="QR scans" value={formatNumber(current.qr)} icon={<QrCode size={16} />} sub={`${qrShare}% of traffic`} />
        <StatCard
          label="Peak day"
          value={maxDay && maxDay.clicks > 0 ? formatNumber(maxDay.clicks) : "0"}
          icon={<BarChart3 size={16} />}
          sub={maxDay && maxDay.clicks > 0 ? `${maxDay.label} · top day in range` : "No clicks in range"}
        />
      </div>

      <div className="mt-4">
        <SectionCard
          title="Traffic over time"
          subtitle={campaign ? `Daily clicks for “${campaign.name}”` : "Daily tracked clicks across every link"}
          bodyClassName="p-3 pt-2 sm:p-4 sm:pt-2"
        >
          <AreaChart id="analytics" data={series} height={320} />
        </SectionCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <SectionCard title="Traffic quality" subtitle="What the numbers mean">
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-muted">Unique visitors</span>
                <span className="mono text-ink">
                  {formatNumber(current.uniques)} / {formatNumber(current.clicks)}
                </span>
              </div>
              <Meter value={current.uniques} max={Math.max(current.clicks, 1)} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-muted">QR share</span>
                <span className="mono text-ink">{qrShare}%</span>
              </div>
              <Meter value={current.qr} max={Math.max(current.clicks, 1)} />
            </div>
            <div className="rounded-lg border border-line bg-card2 px-3 py-2 text-xs leading-relaxed text-muted">
              Unique means a first-ever visit from a hashed visitor signal in this range. Bots and link previews are excluded from every
              chart.
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Campaigns" subtitle="Compare tracked traffic">
          {campaigns.length === 0 ? (
            <p className="text-xs text-muted">No campaigns yet.</p>
          ) : (
            <div className="space-y-2">
              {campaigns.slice(0, 6).map((option) => (
                <Link
                  key={option.id}
                  href={`/app/analytics?days=${days}&campaign=${option.id}`}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition hover:bg-card2 ${
                    scope === option.id ? "border-brand/40 bg-brand/5 text-ink" : "border-line text-muted"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: option.color }} />
                  <span className="flex-1 truncate">{option.name}</span>
                  <ArrowUpRight size={12} />
                </Link>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SectionCard title="Countries" subtitle="Where your audience is">
          <BarList items={countries} />
        </SectionCard>
        <SectionCard title="Devices" subtitle="Mobile, desktop and tablet">
          {devices.length ? <Donut items={devices} centerLabel="clicks" size={132} /> : <p className="text-xs text-muted">No data yet</p>}
        </SectionCard>
        <SectionCard title="Referrers" subtitle="Traffic sources">
          <BarList items={referrers} emptyLabel="No referrers yet" />
        </SectionCard>
        <SectionCard title="Browsers" subtitle="Browser distribution">
          <BarList items={browsers} />
        </SectionCard>
        <SectionCard title="Operating systems" subtitle="Platform split">
          <BarList items={os} />
        </SectionCard>
        <SectionCard title="Cities" subtitle="Top metro areas">
          <BarList items={cities} emptyLabel="No city data yet" />
        </SectionCard>
        <SectionCard title="UTM sources" subtitle="Tagged campaigns">
          <BarList items={utmSources} emptyLabel="No UTM traffic yet" />
        </SectionCard>
        <SectionCard title="UTM campaigns" subtitle="utm_campaign values">
          <BarList items={utmCampaigns} emptyLabel="No UTM campaigns yet" />
        </SectionCard>
        <SectionCard title="Top countries share" subtitle="Percentage of traffic">
          {countries.length ? (
            <Donut items={countries.slice(0, 5)} centerLabel="clicks" size={132} />
          ) : (
            <p className="text-xs text-muted">No geography yet</p>
          )}
        </SectionCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard title="Top links" subtitle={`Ranked by clicks in the last ${days} days`} bodyClassName="p-0">
          {leaders.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={<MousePointerClick size={18} />} title="No clicks yet" description="Share a link to populate this leaderboard." />
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Link</th>
                    <th className="text-right">Clicks</th>
                    <th className="text-right">Uniques</th>
                    <th className="hidden text-right sm:table-cell">CTR share</th>
                  </tr>
                </thead>
                <tbody>
                  {leaders.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <Link href={`/app/links/${row.id}`} className="flex items-center gap-2">
                          <span className="code-chip">/{row.code}</span>
                          <span className="max-w-[180px] truncate text-xs text-muted hover:text-ink">{row.title || row.url}</span>
                        </Link>
                      </td>
                      <td className="text-right mono text-xs font-semibold">{formatNumber(row.clicks)}</td>
                      <td className="text-right mono text-xs text-muted">{formatNumber(row.uniques)}</td>
                      <td className="hidden text-right text-xs text-muted sm:table-cell">{percent(row.clicks, current.clicks)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Live click feed" subtitle="Most recent tracked visits" bodyClassName="p-0">
          {activity.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={<Globe2 size={18} />} title="No visits yet" description="Clicks appear here as they happen." />
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Link</th>
                    <th>Location</th>
                    <th className="hidden md:table-cell">Source</th>
                    <th className="text-right">When</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="code-chip">/{row.code}</span>
                          {row.is_qr ? <span className="badge badge-warn !py-0 text-xs">QR</span> : null}
                          {row.variant ? <span className="badge badge-brand !py-0 text-xs">{row.variant}</span> : null}
                        </div>
                      </td>
                      <td>
                        <div className="text-xs">{row.city || "Unknown"}</div>
                        <div className="text-xs uppercase tracking-wider text-muted">{row.country || "—"}</div>
                      </td>
                      <td className="hidden max-w-[140px] truncate text-xs text-muted md:table-cell">{row.referrer_host || "Direct"}</td>
                      <td className="whitespace-nowrap text-right text-xs text-muted">{timeAgo(row.ts)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      <p className="mt-4 text-xs text-muted">
        {plan.name} plan includes {plan.analyticsDays} days of history.{" "}
        {plan.analyticsDays < 365 ? (
          <Link href="/app/billing" className="font-semibold text-brand-ink hover:underline">
            Upgrade for longer retention
          </Link>
        ) : null}
      </p>
    </>
  );
}
