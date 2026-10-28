import "server-only";
import { all, get } from "./db";

export interface Totals {
  clicks: number;
  uniques: number;
  qr: number;
}

export interface SeriesPoint {
  date: string;
  label: string;
  clicks: number;
  uniques: number;
}

const BREAKDOWN_FIELDS = {
  country: "country",
  city: "city",
  device: "device",
  os: "os",
  browser: "browser",
  referrer: "referrer_host",
  utm_source: "utm_source",
  utm_medium: "utm_medium",
  utm_campaign: "utm_campaign",
} as const;

export type BreakdownField = keyof typeof BREAKDOWN_FIELDS;

export function sinceTs(days: number): number {
  return Date.now() - days * 86_400_000;
}

export function clampDays(requested: number | string | undefined, maxDays: number): number {
  const n = Math.floor(Number(requested ?? 30));
  const value = Number.isFinite(n) ? Math.min(Math.max(n, 1), 365) : 30;
  return Math.min(value, maxDays);
}

export function totals(userId: string, days: number, linkId?: string, campaignId?: string): Totals {
  let row: { clicks: number; uniques: number; qr: number } | undefined;
  if (linkId) {
    row = get<{ clicks: number; uniques: number; qr: number }>(
      `SELECT COUNT(*) clicks, COALESCE(SUM(is_unique),0) uniques, COALESCE(SUM(is_qr),0) qr
       FROM clicks WHERE link_id = ? AND is_bot = 0 AND ts >= ?`,
      linkId,
      sinceTs(days)
    );
  } else if (campaignId) {
    row = get<{ clicks: number; uniques: number; qr: number }>(
      `SELECT COUNT(*) clicks, COALESCE(SUM(c.is_unique),0) uniques, COALESCE(SUM(c.is_qr),0) qr
       FROM clicks c JOIN links l ON l.id = c.link_id
       WHERE c.user_id = ? AND l.campaign_id = ? AND c.is_bot = 0 AND c.ts >= ?`,
      userId,
      campaignId,
      sinceTs(days)
    );
  } else {
    row = get<{ clicks: number; uniques: number; qr: number }>(
      `SELECT COUNT(*) clicks, COALESCE(SUM(is_unique),0) uniques, COALESCE(SUM(is_qr),0) qr
       FROM clicks WHERE user_id = ? AND link_id IS NOT NULL AND is_bot = 0 AND ts >= ?`,
      userId,
      sinceTs(days)
    );
  }
  return { clicks: Number(row?.clicks ?? 0), uniques: Number(row?.uniques ?? 0), qr: Number(row?.qr ?? 0) };
};

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function dailySeries(userId: string, days: number, linkId?: string, campaignId?: string): SeriesPoint[] {
  let rows: Array<{ d: string; c: number; u: number }>;
  if (linkId) {
    rows = all<{ d: string; c: number; u: number }>(
      `SELECT date(ts/1000,'unixepoch','localtime') d, COUNT(*) c, COALESCE(SUM(is_unique),0) u
       FROM clicks WHERE link_id = ? AND is_bot = 0 AND ts >= ? GROUP BY d`,
      linkId,
      sinceTs(days)
    );
  } else if (campaignId) {
    rows = all<{ d: string; c: number; u: number }>(
      `SELECT date(c.ts/1000,'unixepoch','localtime') d, COUNT(*) c, COALESCE(SUM(c.is_unique),0) u
       FROM clicks c JOIN links l ON l.id = c.link_id
       WHERE c.user_id = ? AND l.campaign_id = ? AND c.is_bot = 0 AND c.ts >= ? GROUP BY d`,
      userId,
      campaignId,
      sinceTs(days)
    );
  } else {
    rows = all<{ d: string; c: number; u: number }>(
      `SELECT date(ts/1000,'unixepoch','localtime') d, COUNT(*) c, COALESCE(SUM(is_unique),0) u
       FROM clicks WHERE user_id = ? AND link_id IS NOT NULL AND is_bot = 0 AND ts >= ? GROUP BY d`,
      userId,
      sinceTs(days)
    );
  }

  const map = new Map(rows.map((r) => [r.d, r]));
  const out: SeriesPoint[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(start);
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    const row = map.get(key);
    out.push({
      date: key,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      clicks: Number(row?.c ?? 0),
      uniques: Number(row?.u ?? 0),
    });
  }
  return out;
}

export interface BreakdownItem {
  label: string;
  clicks: number;
  uniques: number;
}

export function breakdown(
  userId: string,
  field: BreakdownField,
  days: number,
  options: { linkId?: string; campaignId?: string; limit?: number; emptyLabel?: string } = {}
): BreakdownItem[] {
  const col = BREAKDOWN_FIELDS[field];
  const emptyLabel = options.emptyLabel ?? (field === "referrer" ? "Direct" : "Unknown");
  const params: unknown[] = [emptyLabel, userId];
  let from = "clicks";
  let where = "c.user_id = ? AND c.link_id IS NOT NULL AND c.is_bot = 0 AND c.ts >= ?";
  params.push(sinceTs(days));
  if (options.linkId) {
    where += " AND c.link_id = ?";
    params.push(options.linkId);
  }
  if (options.campaignId) {
    from = "clicks c JOIN links l ON l.id = c.link_id";
    where += " AND l.campaign_id = ?";
    params.push(options.campaignId);
  } else {
    from = "clicks c";
  }
  params.push(options.limit ?? 8);
  const rows = all<{ label: string; clicks: number; uniques: number }>(
    `SELECT CASE WHEN c.${col} IS NULL OR c.${col} = '' THEN ? ELSE c.${col} END AS label,
            COUNT(*) AS clicks, COALESCE(SUM(c.is_unique),0) AS uniques
     FROM ${from} WHERE ${where}
     GROUP BY label ORDER BY clicks DESC LIMIT ?`,
    ...params
  );
  return rows.map((r) => ({ label: r.label, clicks: Number(r.clicks), uniques: Number(r.uniques) }));
}

export interface LinkSummaryRow {
  id: string;
  code: string;
  title: string | null;
  url: string;
  is_active: number;
  expires_at: number | null;
  max_clicks: number | null;
  click_count: number;
  clicks: number;
  uniques: number;
}

export function topLinks(userId: string, days: number, limit = 5, campaignId?: string): LinkSummaryRow[] {
  const params: unknown[] = [sinceTs(days), userId];
  let where = "l.user_id = ?";
  if (campaignId) {
    where += " AND l.campaign_id = ?";
    params.push(campaignId);
  }
  params.push(limit);
  return all<LinkSummaryRow>(
    `SELECT l.id, l.code, l.title, l.url, l.is_active, l.expires_at, l.max_clicks, l.click_count,
            COUNT(c.id) AS clicks, COALESCE(SUM(c.is_unique),0) AS uniques
     FROM links l JOIN clicks c ON c.link_id = l.id AND c.ts >= ? AND c.is_bot = 0
     WHERE ${where}
     GROUP BY l.id ORDER BY clicks DESC LIMIT ?`,
    ...params
  ).map((r) => ({ ...r, clicks: Number(r.clicks), uniques: Number(r.uniques) }));
}

export interface ClickRow {
  id: string;
  ts: number;
  country: string;
  city: string;
  device: string;
  browser: string;
  os: string;
  referrer_host: string;
  is_qr: number;
  is_unique: number;
  variant: string | null;
  link_id: string | null;
  code: string | null;
  title: string | null;
}

export function recentClicks(userId: string, limit = 12, linkId?: string, campaignId?: string): ClickRow[] {
  if (linkId) {
    return all<ClickRow>(
      `SELECT c.id, c.ts, c.country, c.city, c.device, c.browser, c.os, c.referrer_host, c.is_qr,
              c.is_unique, c.variant, c.link_id, l.code, l.title
       FROM clicks c LEFT JOIN links l ON l.id = c.link_id
       WHERE c.link_id = ? AND c.is_bot = 0 ORDER BY c.ts DESC LIMIT ?`,
      linkId,
      limit
    );
  }
  const params: unknown[] = [userId];
  let where = "c.user_id = ?";
  if (campaignId) {
    where += " AND l.campaign_id = ?";
    params.push(campaignId);
  }
  params.push(limit);
  return all<ClickRow>(
    `SELECT c.id, c.ts, c.country, c.city, c.device, c.browser, c.os, c.referrer_host, c.is_qr,
            c.is_unique, c.variant, c.link_id, l.code, l.title
     FROM clicks c JOIN links l ON l.id = c.link_id
     WHERE ${where} AND c.is_bot = 0 ORDER BY c.ts DESC LIMIT ?`,
    ...params
  );
}

export function variants(linkId: string, days: number): Array<{ variant: string; clicks: number }> {
  return all<{ variant: string; clicks: number }>(
    `SELECT COALESCE(variant,'A') AS variant, COUNT(*) AS clicks FROM clicks
     WHERE link_id = ? AND is_bot = 0 AND ts >= ? GROUP BY variant`,
    linkId,
    sinceTs(days)
  ).map((r) => ({ variant: r.variant, clicks: Number(r.clicks) }));
}

export interface AccountCounts {
  links: number;
  qrcodes: number;
  campaigns: number;
  pages: number;
  domains: number;
  clicks: number;
}

export function accountCounts(userId: string): AccountCounts {
  const row = get<Record<string, number>>(
    `SELECT
      (SELECT COUNT(*) FROM links WHERE user_id = ?) AS links,
      (SELECT COUNT(*) FROM qrcodes WHERE user_id = ?) AS qrcodes,
      (SELECT COUNT(*) FROM campaigns WHERE user_id = ?) AS campaigns,
      (SELECT COUNT(*) FROM pages WHERE user_id = ?) AS pages,
      (SELECT COUNT(*) FROM domains WHERE user_id = ?) AS domains,
      (SELECT COALESCE(SUM(click_count),0) FROM links WHERE user_id = ?) AS clicks`,
    userId, userId, userId, userId, userId, userId
  );
  return {
    links: Number(row?.links ?? 0),
    qrcodes: Number(row?.qrcodes ?? 0),
    campaigns: Number(row?.campaigns ?? 0),
    pages: Number(row?.pages ?? 0),
    domains: Number(row?.domains ?? 0),
    clicks: Number(row?.clicks ?? 0),
  };
}

export interface CampaignSummary {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: number;
  links: number;
  clicks: number;
}

export function campaignSummaries(userId: string): CampaignSummary[] {
  return all<CampaignSummary>(
    `SELECT c.id, c.name, c.description, c.color, c.created_at,
            COUNT(l.id) AS links, COALESCE(SUM(l.click_count),0) AS clicks
     FROM campaigns c LEFT JOIN links l ON l.campaign_id = c.id
     WHERE c.user_id = ? GROUP BY c.id ORDER BY c.created_at DESC`,
    userId
  ).map((r) => ({ ...r, links: Number(r.links), clicks: Number(r.clicks) }));
}
