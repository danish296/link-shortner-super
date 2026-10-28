import { all } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { clampDays, sinceTs } from "@/lib/stats";
import { csvEscape } from "@/lib/utils";

export async function GET(req: Request) {
  const user = await requireApiUser();
  const url = new URL(req.url);
  const days = clampDays(url.searchParams.get("days") ?? undefined, 365);

  const rows = all<{
    ts: number;
    code: string;
    title: string | null;
    country: string;
    city: string;
    device: string;
    browser: string;
    os: string;
    referrer_host: string;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    is_qr: number;
    is_unique: number;
    variant: string | null;
  }>(
    `SELECT c.ts, l.code, l.title, c.country, c.city, c.device, c.browser, c.os, c.referrer_host,
            c.utm_source, c.utm_medium, c.utm_campaign, c.is_qr, c.is_unique, c.variant
     FROM clicks c JOIN links l ON l.id = c.link_id
     WHERE c.user_id = ? AND c.is_bot = 0 AND c.ts >= ?
     ORDER BY c.ts DESC LIMIT 50000`,
    user.id,
    sinceTs(days)
  );

  const header = [
    "timestamp", "short_code", "title", "country", "city", "device", "browser", "os",
    "referrer", "utm_source", "utm_medium", "utm_campaign", "qr_scan", "unique", "ab_variant",
  ];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [
        new Date(Number(row.ts)).toISOString(),
        row.code,
        row.title ?? "",
        row.country,
        row.city,
        row.device,
        row.browser,
        row.os,
        row.referrer_host,
        row.utm_source ?? "",
        row.utm_medium ?? "",
        row.utm_campaign ?? "",
        row.is_qr ? "yes" : "no",
        row.is_unique ? "yes" : "no",
        row.variant ?? "",
      ]
        .map(csvEscape)
        .join(",")
    );
  }

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="linkshort-clicks-${days}d.csv"`,
      "cache-control": "no-store",
    },
  });
}
