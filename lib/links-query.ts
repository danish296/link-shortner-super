import "server-only";
import { all, get } from "./db";
import type { LinkRow } from "./links";

export interface LinkQueryOptions {
  q?: string;
  status?: string;
  page?: number;
  size?: number;
  sort?: string;
  campaignId?: string;
}

export interface LinkQueryResult {
  rows: LinkRow[];
  total: number;
  page: number;
  pages: number;
  size: number;
}

const SORTS: Record<string, string> = {
  newest: "l.created_at DESC",
  oldest: "l.created_at ASC",
  clicks: "l.click_count DESC",
  clicks_asc: "l.click_count ASC",
  alias: "l.code ASC",
};

export function queryLinks(userId: string, options: LinkQueryOptions = {}): LinkQueryResult {
  const now = Date.now();
  const size = Math.min(Math.max(Math.floor(options.size ?? 20), 1), 100);
  const page = Math.max(Math.floor(options.page ?? 1), 1);
  const where: string[] = ["l.user_id = ?"];
  const params: unknown[] = [userId];

  if (options.q) {
    const like = `%${String(options.q).trim()}%`;
    where.push("(l.code LIKE ? OR l.url LIKE ? OR COALESCE(l.title,'') LIKE ? OR l.tags LIKE ?)");
    params.push(like, like, like, like);
  }

  const status = options.status || "all";
  if (status === "active") {
    where.push("l.is_active = 1 AND (l.expires_at IS NULL OR l.expires_at > ?) AND (l.max_clicks IS NULL OR l.click_count < l.max_clicks)");
    params.push(now);
  } else if (status === "inactive") {
    where.push("l.is_active = 0");
  } else if (status === "expired") {
    where.push("l.expires_at IS NOT NULL AND l.expires_at <= ?");
    params.push(now);
  } else if (status === "limit") {
    where.push("l.max_clicks IS NOT NULL AND l.click_count >= l.max_clicks");
  }

  if (options.campaignId) {
    where.push("l.campaign_id = ?");
    params.push(options.campaignId);
  }

  const whereSql = where.join(" AND ");
  const totalRow = get<{ n: number }>(`SELECT COUNT(*) n FROM links l WHERE ${whereSql}`, ...params);
  const total = Number(totalRow?.n ?? 0);
  const pages = Math.max(Math.ceil(total / size), 1);
  const order = SORTS[options.sort || "newest"] || SORTS.newest;

  const rows = all<LinkRow>(
    `SELECT l.*, c.name AS campaign_name, c.color AS campaign_color, d.hostname AS domain_host
     FROM links l LEFT JOIN campaigns c ON c.id = l.campaign_id LEFT JOIN domains d ON d.id = l.domain_id
     WHERE ${whereSql} ORDER BY ${order} LIMIT ? OFFSET ?`,
    ...params,
    size,
    (page - 1) * size
  );

  return { rows, total, page, pages, size };
}
