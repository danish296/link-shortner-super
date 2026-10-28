import "server-only";
import { createHmac } from "node:crypto";
import { get, run, uid } from "./db";
import { clientIp } from "./http";
import type { LinkRow } from "./links";
import { deriveGeo, parseUserAgent, referrerInfo } from "./ua";

const SECRET = process.env.APP_SECRET || "linkshort-local-dev-secret-change-me";

export function hashIp(ip: string): string {
  return createHmac("sha256", SECRET).update(ip).digest("hex").slice(0, 32);
}

interface ClickOptions {
  isQr: boolean;
  variant: "A" | "B" | null;
  qrId?: string | null;
}

export function logLinkClick(link: LinkRow, headers: Headers, options: ClickOptions): { isBot: boolean } {
  const ua = parseUserAgent(headers.get("user-agent"));
  const geo = deriveGeo(headers);
  const ref = referrerInfo(headers.get("referer"));
  const ipHash = hashIp(clientIp(headers));
  const unique = !get("SELECT 1 FROM clicks WHERE link_id = ? AND ip_hash = ? LIMIT 1", link.id, ipHash);
  const ts = Date.now();

  run(
    `INSERT INTO clicks (id, user_id, link_id, ts, ip_hash, country, city, device, os, browser, referrer,
      referrer_host, utm_source, utm_medium, utm_campaign, utm_term, utm_content, is_qr, is_unique, is_bot, variant)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    uid(), link.user_id, link.id, ts, ipHash, geo.country, geo.city, ua.device, ua.os, ua.browser,
    ref.referrer, ref.host, link.utm_source, link.utm_medium, link.utm_campaign, link.utm_term, link.utm_content,
    options.isQr ? 1 : 0, unique ? 1 : 0, ua.isBot ? 1 : 0, options.variant
  );

  if (options.qrId && !ua.isBot) {
    run("UPDATE qrcodes SET scans = scans + 1 WHERE id = ? AND link_id = ?", options.qrId, link.id);
  }

  return { isBot: ua.isBot };
}

export function logPageClick(pageId: string, blockId: string, headers: Headers): void {
  const ua = parseUserAgent(headers.get("user-agent"));
  const geo = deriveGeo(headers);
  const ref = referrerInfo(headers.get("referer"));
  const ipHash = hashIp(clientIp(headers));
  const page = get<{ user_id: string }>("SELECT user_id FROM pages WHERE id = ?", pageId);
  if (!page) return;
  run(
    `INSERT INTO clicks (id, user_id, link_id, ts, ip_hash, country, city, device, os, browser, referrer,
      referrer_host, is_qr, is_unique, is_bot, page_id, block_id)
     VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?, ?, ?)`,
    uid(), page.user_id, Date.now(), ipHash, geo.country, geo.city, ua.device, ua.os, ua.browser,
    ref.referrer, ref.host, ua.isBot ? 1 : 0, pageId, blockId
  );
}
