import "server-only";
import { randomInt } from "node:crypto";
import { get, run, uid } from "./db";
import { hashPassword } from "./auth";
import { ApiError } from "./http";
import { assertQuota } from "./quota";
import { normalizeUrl, parseTags, parseJsonArray } from "./utils";
import type { PlanId } from "./plans";

export interface LinkRow {
  id: string;
  user_id: string;
  code: string;
  url: string;
  title: string | null;
  campaign_id: string | null;
  tags: string;
  password_hash: string | null;
  expires_at: number | null;
  max_clicks: number | null;
  click_count: number;
  is_active: number;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  pixel_meta: string | null;
  pixel_google: string | null;
  pixel_tiktok: string | null;
  variant_b: string | null;
  ab_weight: number;
  domain_id: string | null;
  created_at: number;
  updated_at: number;
  campaign_name?: string | null;
  campaign_color?: string | null;
  domain_host?: string | null;
}

export interface LinkInput {
  url: string;
  alias?: string;
  title?: string;
  campaignId?: string | null;
  tags?: string[] | string;
  password?: string | null;
  expiresAt?: number | null;
  maxClicks?: number | null;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  pixelMeta?: string;
  pixelGoogle?: string;
  pixelTiktok?: string;
  variantB?: string;
  abWeight?: number;
  domainId?: string | null;
}

const RESERVED = new Set([
  "app", "api", "login", "register", "logout", "pricing", "docs", "terms", "privacy",
  "cookies", "forgot-password", "reset-password", "verify-email", "p", "r", "admin",
  "dashboard", "settings", "billing", "analytics", "assets", "_next", "icon", "favicon",
  "robots", "sitemap", "new", "links", "campaigns", "qrcodes", "domains", "pages",
]);

const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";

export function randomCode(length = 7): string {
  let out = "";
  for (let i = 0; i < length; i += 1) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

export function isReserved(code: string): boolean {
  return RESERVED.has(code.toLowerCase());
}

export function codeExists(code: string, exceptId?: string): boolean {
  const row = exceptId
    ? get<{ id: string }>("SELECT id FROM links WHERE lower(code) = lower(?) AND id <> ?", code, exceptId)
    : get<{ id: string }>("SELECT id FROM links WHERE lower(code) = lower(?)", code);
  return Boolean(row);
}

function cleanText(value: unknown, max = 200): string {
  return String(value ?? "").trim().slice(0, max);
}

function cleanUtm(value: unknown): string | null {
  const v = cleanText(value, 100).replace(/[^\w.\-~]/g, "");
  return v || null;
}

function cleanPixel(value: unknown): string | null {
  const v = cleanText(value, 64);
  if (!v) return null;
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(v)) throw new ApiError(400, "Pixel IDs may only contain letters, numbers, - and _");
  return v;
}

function validateAlias(alias: string): void {
  if (!/^[a-zA-Z0-9_-]{3,32}$/.test(alias)) {
    throw new ApiError(400, "Custom alias must be 3–32 characters using letters, numbers, - or _");
  }
  if (isReserved(alias)) throw new ApiError(400, "That alias is reserved. Try another one.");
}

async function validatePassword(value: unknown): Promise<string | null> {
  const password = String(value ?? "");
  if (!password) return null;
  if (password.length < 4) throw new ApiError(400, "Link password must be at least 4 characters");
  if (password.length > 128) throw new ApiError(400, "Link password is too long");
  return hashPassword(password);
}

function validateExpiry(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const ts = Number(value);
  if (!Number.isFinite(ts) || ts < Date.now() - 60_000) {
    throw new ApiError(400, "Expiration date must be in the future");
  }
  return Math.floor(ts);
}

function validateMaxClicks(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 1 || n > 1_000_000) throw new ApiError(400, "Click limit must be between 1 and 1,000,000");
  return n;
}

function validateCampaign(userId: string, campaignId: unknown): string | null {
  const id = cleanText(campaignId, 64);
  if (!id) return null;
  const row = get<{ id: string }>("SELECT id FROM campaigns WHERE id = ? AND user_id = ?", id, userId);
  if (!row) throw new ApiError(400, "Campaign not found");
  return id;
}

function validateDomain(userId: string, domainId: unknown): string | null {
  const id = cleanText(domainId, 64);
  if (!id) return null;
  const row = get<{ id: string; verified: number }>("SELECT id, verified FROM domains WHERE id = ? AND user_id = ?", id, userId);
  if (!row) throw new ApiError(400, "Domain not found");
  if (!row.verified) throw new ApiError(400, "Verify your domain before attaching links to it");
  return id;
}

export async function createLink(
  user: { id: string; plan: PlanId },
  input: LinkInput
): Promise<LinkRow> {
  assertQuota(user, "links");

  let url: string;
  try {
    url = normalizeUrl(input.url);
  } catch (error) {
    throw new ApiError(400, error instanceof Error ? error.message : "Invalid URL");
  }

  let alias = cleanText(input.alias, 32);
  if (alias) {
    validateAlias(alias);
    if (codeExists(alias)) throw new ApiError(409, "That alias is already taken");
  } else {
    alias = randomCode();
    while (codeExists(alias)) alias = randomCode();
  }

  const title = cleanText(input.title, 120) || null;
  const tags = JSON.stringify(parseTags(input.tags ?? []));
  const campaignId = validateCampaign(user.id, input.campaignId);
  const domainId = validateDomain(user.id, input.domainId);
  const passwordHash = await validatePassword(input.password);
  const expiresAt = validateExpiry(input.expiresAt);
  const maxClicks = validateMaxClicks(input.maxClicks);
  const abWeight = Math.min(99, Math.max(1, Math.floor(Number(input.abWeight ?? 50)) || 50));

  let variantB: string | null = null;
  if (input.variantB && String(input.variantB).trim()) {
    try {
      variantB = normalizeUrl(input.variantB);
    } catch {
      throw new ApiError(400, "Variant B must be a valid URL");
    }
  }

  const id = uid();
  const ts = Date.now();
  run(
    `INSERT INTO links (id, user_id, code, url, title, campaign_id, tags, password_hash, expires_at,
      max_clicks, click_count, is_active, utm_source, utm_medium, utm_campaign, utm_term, utm_content,
      pixel_meta, pixel_google, pixel_tiktok, variant_b, ab_weight, domain_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, user.id, alias, url, title, campaignId, tags, passwordHash, expiresAt, maxClicks,
    cleanUtm(input.utmSource), cleanUtm(input.utmMedium), cleanUtm(input.utmCampaign),
    cleanUtm(input.utmTerm), cleanUtm(input.utmContent),
    cleanPixel(input.pixelMeta), cleanPixel(input.pixelGoogle), cleanPixel(input.pixelTiktok),
    variantB, abWeight, domainId, ts, ts
  );

  return get<LinkRow>("SELECT * FROM links WHERE id = ?", id) as LinkRow;
}

export async function updateLink(
  user: { id: string; plan: PlanId },
  id: string,
  input: Partial<LinkInput> & { isActive?: boolean }
): Promise<LinkRow> {
  const existing = get<LinkRow>("SELECT * FROM links WHERE id = ? AND user_id = ?", id, user.id);
  if (!existing) throw new ApiError(404, "Link not found");

  let url = existing.url;
  if (input.url !== undefined) {
    try {
      url = normalizeUrl(input.url);
    } catch (error) {
      throw new ApiError(400, error instanceof Error ? error.message : "Invalid URL");
    }
  }

  let code = existing.code;
  if (input.alias !== undefined) {
    const alias = cleanText(input.alias, 32);
    if (!alias) throw new ApiError(400, "Alias cannot be empty");
    validateAlias(alias);
    if (codeExists(alias, existing.id)) throw new ApiError(409, "That alias is already taken");
    code = alias;
  }

  let passwordHash = existing.password_hash;
  if (input.password !== undefined) {
    if (input.password === "" || input.password === null) passwordHash = null;
    else passwordHash = await validatePassword(input.password);
  }

  const tags = input.tags !== undefined ? JSON.stringify(parseTags(input.tags)) : existing.tags;
  const campaignId = input.campaignId !== undefined ? validateCampaign(user.id, input.campaignId) : existing.campaign_id;
  const domainId = input.domainId !== undefined ? validateDomain(user.id, input.domainId) : existing.domain_id;
  const expiresAt = input.expiresAt !== undefined ? validateExpiry(input.expiresAt) : existing.expires_at;
  const maxClicks = input.maxClicks !== undefined ? validateMaxClicks(input.maxClicks) : existing.max_clicks;
  const isActive = input.isActive !== undefined ? (input.isActive ? 1 : 0) : existing.is_active;
  const abWeight = input.abWeight !== undefined ? Math.min(99, Math.max(1, Math.floor(Number(input.abWeight)) || 50)) : existing.ab_weight;

  let variantB = existing.variant_b;
  if (input.variantB !== undefined) {
    if (!String(input.variantB ?? "").trim()) variantB = null;
    else {
      try {
        variantB = normalizeUrl(input.variantB);
      } catch {
        throw new ApiError(400, "Variant B must be a valid URL");
      }
    }
  }

  run(
    `UPDATE links SET url = ?, code = ?, title = ?, campaign_id = ?, tags = ?, password_hash = ?,
      expires_at = ?, max_clicks = ?, is_active = ?, utm_source = ?, utm_medium = ?, utm_campaign = ?,
      utm_term = ?, utm_content = ?, pixel_meta = ?, pixel_google = ?, pixel_tiktok = ?, variant_b = ?,
      ab_weight = ?, domain_id = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
    url, code,
    input.title !== undefined ? cleanText(input.title, 120) || null : existing.title,
    campaignId,
    tags,
    passwordHash,
    expiresAt,
    maxClicks,
    isActive,
    input.utmSource !== undefined ? cleanUtm(input.utmSource) : existing.utm_source,
    input.utmMedium !== undefined ? cleanUtm(input.utmMedium) : existing.utm_medium,
    input.utmCampaign !== undefined ? cleanUtm(input.utmCampaign) : existing.utm_campaign,
    input.utmTerm !== undefined ? cleanUtm(input.utmTerm) : existing.utm_term,
    input.utmContent !== undefined ? cleanUtm(input.utmContent) : existing.utm_content,
    input.pixelMeta !== undefined ? cleanPixel(input.pixelMeta) : existing.pixel_meta,
    input.pixelGoogle !== undefined ? cleanPixel(input.pixelGoogle) : existing.pixel_google,
    input.pixelTiktok !== undefined ? cleanPixel(input.pixelTiktok) : existing.pixel_tiktok,
    variantB,
    abWeight,
    domainId,
    Date.now(),
    id,
    user.id
  );

  return get<LinkRow>("SELECT * FROM links WHERE id = ?", id) as LinkRow;
}

export function getLinkByCode(code: string): LinkRow | undefined {
  return get<LinkRow>(
    `SELECT l.*, c.name AS campaign_name, c.color AS campaign_color, d.hostname AS domain_host
     FROM links l LEFT JOIN campaigns c ON c.id = l.campaign_id LEFT JOIN domains d ON d.id = l.domain_id
     WHERE l.code = ?`,
    code
  );
}

export function getLinkById(userId: string, id: string): LinkRow | undefined {
  return get<LinkRow>(
    `SELECT l.*, c.name AS campaign_name, c.color AS campaign_color, d.hostname AS domain_host
     FROM links l LEFT JOIN campaigns c ON c.id = l.campaign_id LEFT JOIN domains d ON d.id = l.domain_id
     WHERE l.id = ? AND l.user_id = ?`,
    id,
    userId
  );
}

export function serializeLink(link: LinkRow, baseUrl: string) {
  return {
    id: link.id,
    code: link.code,
    shortUrl: `${baseUrl}/${link.code}`,
    url: link.url,
    title: link.title,
    tags: parseJsonArray(link.tags),
    clicks: link.click_count,
    isActive: Boolean(link.is_active),
    passwordProtected: Boolean(link.password_hash),
    expiresAt: link.expires_at,
    maxClicks: link.max_clicks,
    campaignId: link.campaign_id,
    createdAt: link.created_at,
  };
}

export function applyUtm(url: string, link: Pick<LinkRow, "utm_source" | "utm_medium" | "utm_campaign" | "utm_term" | "utm_content">): string {
  const params: Array<[string, string | null]> = [
    ["utm_source", link.utm_source],
    ["utm_medium", link.utm_medium],
    ["utm_campaign", link.utm_campaign],
    ["utm_term", link.utm_term],
    ["utm_content", link.utm_content],
  ];
  if (!params.some(([, value]) => Boolean(value))) return url;
  try {
    const parsed = new URL(url);
    for (const [key, value] of params) if (value) parsed.searchParams.set(key, value);
    return parsed.toString();
  } catch {
    return url;
  }
}

export function linkStatus(link: LinkRow): "active" | "inactive" | "expired" | "limit" {
  if (!link.is_active) return "inactive";
  if (link.expires_at && link.expires_at < Date.now()) return "expired";
  if (link.max_clicks && link.click_count >= link.max_clicks) return "limit";
  return "active";
}
