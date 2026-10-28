import Link from "next/link";
import {
  ArrowUpRight,
  ExternalLink,
  Link2,
  MousePointerClick,
  QrCode,
  Smartphone,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { get } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { usageFor } from "@/lib/quota";
import { getBaseUrl } from "@/lib/server-url";
import { clampDays, dailySeries, recentClicks, topLinks, totals } from "@/lib/stats";
import { cn, formatNumber, percent, timeAgo } from "@/lib/utils";
import { AreaChart, BarList } from "@/components/charts";
import { EmptyState, Meter, PageHeader, SectionCard, StatCard } from "@/components/ui";

function delta(current: number, previous: number): { value: number; up: boolean } {
  if (previous <= 0) return { value: current > 0 ? 100 : 0, up: current > 0 };
  const change = ((current - previous) / previous) * 100;
  return { value: Math.round(Math.abs(change) * 10) / 10, up: change >= 0 };
}

export default async function DashboardPage() {
  const user = await requireUser();
  const plan = getPlan(user.plan);
  const days = clampDays(30, plan.analyticsDays);
  const base = await getBaseUrl();

  const [current, previous] = [totals(user.id, days), totals(user.id, days * 2)];
  const series = dailySeries(user.id, days);
  const leaders = topLinks(user.id, days, 5);
  const activity = recentClicks(user.id, 8);
  const usage = usageFor(user.id);
  const activeLinks = get<{ n: number }>("SELECT COUNT(*) n FROM links WHERE user_id = ? AND is_active = 1", user.id)?.n ?? 0;
  const usagePct = percent(usage.linksThisMonth, plan.linksPerMonth);
  const clickDelta = delta(current.clicks, previous.clicks - current.clicks);
  const uniqueRate = current.clicks > 0 ? Math.round((current.uniques / current.clicks) * 100) : 0;
  const peak = series.reduce((best, point) => (point.clicks > best.clicks ? point : best), series[0]);

  return (
    <>
      <PageHeader
        eyebrow={`${plan.name} plan`}
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description={`Here's how your links performed over the last ${days} days.`}
        actions={
          <Link href="/app/analytics" className="btn btn-outline btn-sm">
            <BarIcon /> Analytics
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tracked clicks"
          value={formatNumber(current.clicks)}
          icon={<MousePointerClick size={16} />}
          sub={
            <span className={cn("inline-flex items-center gap-1 font-medium", clickDelta.up ? "text-ok" : "text-bad")}>
              {clickDelta.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {clickDelta.value}%
              <span className="font-normal text-muted">vs previous {days}d</span>
            </span>
          }
        />
        <StatCard
          label="Unique visitors"
          value={formatNumber(current.uniques)}
          icon={<Users size={16} />}
          sub={`${uniqueRate}% of all clicks`}
        />
        <StatCard
          label="Active links"
          value={formatNumber(Number(activeLinks))}
          icon={<Link2 size={16} />}
          sub={
            <span>
              <span className="mono text-ink">
                {usage.linksThisMonth.toLocaleString()}/{plan.linksPerMonth.toLocaleString()}
              </span>{" "}
              created this month
            </span>
          }
        />
        <StatCard
          label="QR scans"
          value={formatNumber(current.qr)}
          icon={<QrCode size={16} />}
          sub={`${formatNumber(usage.qrcodes)} QR codes stored`}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SectionCard
          title="Clicks over time"
          subtitle={`Daily tracked clicks, last ${days} days${peak && peak.clicks > 0 ? ` · peak ${peak.clicks} on ${peak.label}` : ""}`}
          className="flex flex-col xl:col-span-2"
          action={
            <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand" /> clicks
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-chart-2" /> uniques
              </span>
            </div>
          }
          bodyClassName="flex flex-1 flex-col justify-center p-3 pt-2 sm:p-4 sm:pt-2"
        >
          <AreaChart id="dashboard" data={series} height={300} />
        </SectionCard>

        <SectionCard
          title="Top links"
          subtitle="By clicks in the current window"
          action={
            <Link href="/app/links" className="text-xs font-semibold text-brand-ink hover:underline">
              View all
            </Link>
          }
        >
          {leaders.length === 0 ? (
            <EmptyState
              icon={<Link2 size={18} />}
              title="No clicks yet"
              description="Create a short link and share it to start collecting analytics."
              action={
                <Link href="/app/links?new=1" className="btn btn-primary btn-sm">
                  Create a link
                </Link>
              }
            />
          ) : (
            <BarList
              items={leaders.map((row) => ({ label: `/${row.code}`, clicks: Number(row.clicks), uniques: Number(row.uniques) }))}
              showUnique
            />
          )}
          <div className="mt-4 rounded-xl border border-line bg-card2 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Links created this month</span>
              <span className="mono text-ink">
                {usage.linksThisMonth.toLocaleString()}/{plan.linksPerMonth.toLocaleString()}
              </span>
            </div>
            <Meter value={usage.linksThisMonth} max={plan.linksPerMonth} className="mt-2" />
            <Link href="/app/billing" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-ink hover:underline">
              <Sparkles size={11} /> {usagePct >= 80 ? "Running low — upgrade" : "Upgrade for more"}
            </Link>
          </div>
        </SectionCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SectionCard
          title="Recent activity"
          subtitle="Latest tracked clicks across your links"
          className="xl:col-span-2"
          bodyClassName="p-0"
          action={
            <Link href="/app/analytics" className="text-xs font-semibold text-brand-ink hover:underline">
              Full report
            </Link>
          }
        >
          {activity.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={<MousePointerClick size={18} />} title="Nothing yet" description="Clicks will appear here in real time." />
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Link</th>
                    <th>Location</th>
                    <th className="hidden md:table-cell">Device</th>
                    <th className="hidden lg:table-cell">Source</th>
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
                          {row.is_unique ? <span className="badge badge-accent !py-0 text-xs">new</span> : null}
                        </div>
                        <div className="mt-0.5 max-w-[220px] truncate text-xs text-muted">{row.title || row.code}</div>
                      </td>
                      <td className="whitespace-nowrap">
                        <div className="text-xs">{row.city || "Unknown"}</div>
                        <div className="text-xs uppercase tracking-wider text-muted">{row.country || "—"}</div>
                      </td>
                      <td className="hidden md:table-cell">
                        <span className="inline-flex items-center gap-2 text-xs text-muted">
                          <Smartphone size={12} /> {row.device || "Desktop"}
                        </span>
                        <div className="text-xs text-muted">{row.browser || "Unknown"}</div>
                      </td>
                      <td className="hidden max-w-[160px] truncate text-xs text-muted lg:table-cell">{row.referrer_host || "Direct"}</td>
                      <td className="whitespace-nowrap text-right text-xs text-muted">{timeAgo(row.ts)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <div className="flex h-full flex-col gap-4">
          <SectionCard title="Quick actions" subtitle="Everything you need in one click">
            <div className="grid grid-cols-1 gap-2">
              {[
                { href: "/app/links?new=1", label: "Shorten a link", icon: Link2 },
                { href: "/app/qrcodes", label: "Design a QR code", icon: QrCode },
                { href: "/app/campaigns", label: "Start a campaign", icon: Sparkles },
                { href: "/app/pages", label: "Edit bio page", icon: Users },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center gap-3 rounded-xl border border-line bg-card2 px-3 py-3 text-xs transition hover:border-line-strong hover:bg-card2"
                  >
                    <span className="feature-icon h-8 w-8 rounded-lg">
                      <Icon size={14} />
                    </span>
                    <span className="flex-1 font-medium">{item.label}</span>
                    <ArrowUpRight size={14} className="text-muted transition group-hover:text-brand-ink" />
                  </Link>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard
            title="Your short domain"
            subtitle="Share links from a branded host"
            className="flex flex-1 flex-col"
            bodyClassName="flex flex-1 flex-col justify-between"
          >
            <div className="rounded-xl border border-line bg-card2 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate font-mono text-xs text-ink">{base.replace(/^https?:\/\//, "")}</span>
                <Link href="/app/domains" className="btn btn-outline btn-sm shrink-0">
                  Manage
                </Link>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                LinkShort links resolve instantly on this host. Connect a custom domain on Pro and above.
              </p>
            </div>
            <a
              href={base}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-ink hover:underline"
            >
              Open site <ExternalLink size={11} />
            </a>
          </SectionCard>
        </div>
      </div>
    </>
  );
}

function BarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 3v18h18" />
      <path d="M7 16v-4" />
      <path d="M12 16V8" />
      <path d="M17 16v-6" />
    </svg>
  );
}
