import "server-only";
import { all, get } from "./db";
import { ApiError } from "./http";
import { getPlan, type PlanId } from "./plans";

export type QuotaKind = "links" | "qrcodes" | "campaigns" | "pages" | "domains";

export interface Usage {
  linksThisMonth: number;
  qrcodes: number;
  campaigns: number;
  pages: number;
  domains: number;
}

export function monthStart(ts = Date.now()): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

export function usageFor(userId: string): Usage {
  const month = monthStart();
  const links = get<{ n: number }>("SELECT COUNT(*) n FROM links WHERE user_id = ? AND created_at >= ?", userId, month);
  const qr = get<{ n: number }>("SELECT COUNT(*) n FROM qrcodes WHERE user_id = ?", userId);
  const campaigns = get<{ n: number }>("SELECT COUNT(*) n FROM campaigns WHERE user_id = ?", userId);
  const pages = get<{ n: number }>("SELECT COUNT(*) n FROM pages WHERE user_id = ?", userId);
  const domains = get<{ n: number }>("SELECT COUNT(*) n FROM domains WHERE user_id = ?", userId);
  return {
    linksThisMonth: Number(links?.n ?? 0),
    qrcodes: Number(qr?.n ?? 0),
    campaigns: Number(campaigns?.n ?? 0),
    pages: Number(pages?.n ?? 0),
    domains: Number(domains?.n ?? 0),
  };
}

const LABELS: Record<QuotaKind, string> = {
  links: "links this month",
  qrcodes: "QR codes",
  campaigns: "campaigns",
  pages: "bio pages",
  domains: "custom domains",
};

export function assertQuota(user: { id: string; plan: PlanId }, kind: QuotaKind): void {
  const plan = getPlan(user.plan);
  const usage = usageFor(user.id);
  const limit =
    kind === "links"
      ? plan.linksPerMonth
      : kind === "qrcodes"
        ? plan.qrcodes
        : kind === "campaigns"
          ? plan.campaigns
          : kind === "pages"
            ? plan.pages
            : plan.domains;
  const used =
    kind === "links"
      ? usage.linksThisMonth
      : kind === "qrcodes"
        ? usage.qrcodes
        : kind === "campaigns"
          ? usage.campaigns
          : kind === "pages"
            ? usage.pages
            : usage.domains;

  if (used >= limit) {
    throw new ApiError(
      402,
      `You've used all ${limit === 0 ? "" : limit} ${LABELS[kind]} on the ${plan.name} plan. Upgrade your plan to keep growing.`
    );
  }
}

export function planLimits(user: { plan: PlanId }) {
  return getPlan(user.plan);
}

export function campaignOptions(userId: string) {
  return all<{ id: string; name: string; color: string }>(
    "SELECT id, name, color FROM campaigns WHERE user_id = ? ORDER BY name ASC",
    userId
  );
}
