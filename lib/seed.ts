import type { DatabaseSync } from "node:sqlite";
import { randomBytes, scryptSync } from "node:crypto";

type Rand = () => number;

function mulberry32(seed: number): Rand {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted<T>(rand: Rand, entries: Array<[T, number]>): T {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rand() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

function demoHash(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

const DEMO_EMAIL = "demo@linkshort.app";

interface Spec {
  id: string;
  code: string;
  url: string;
  title: string;
  campaignId: string | null;
  tags: string[];
  clicks: number;
  utm?: { source: string; medium: string; campaign: string };
  password?: string;
  expiresAt?: number;
  maxClicks?: number;
  active?: boolean;
  variantB?: string;
  abWeight?: number;
  pixelMeta?: string;
  qr?: boolean;
}

const COUNTRIES: Array<[string, string, number]> = [
  ["United States", "New York", 23],
  ["Brazil", "São Paulo", 17],
  ["India", "Mumbai", 11],
  ["Germany", "Berlin", 8],
  ["United Kingdom", "London", 8],
  ["France", "Paris", 6],
  ["Canada", "Toronto", 5],
  ["Australia", "Sydney", 4],
  ["Japan", "Tokyo", 4],
  ["Spain", "Madrid", 4],
  ["Mexico", "Mexico City", 3],
  ["Portugal", "Lisbon", 3],
  ["Indonesia", "Jakarta", 3],
  ["Italy", "Milan", 3],
  ["Netherlands", "Amsterdam", 2],
  ["Sweden", "Stockholm", 2],
];

const REFERRERS: Array<[string, string, number]> = [
  ["", "Direct", 30],
  ["https://www.google.com/search", "google.com", 20],
  ["https://x.com/", "x.com", 12],
  ["https://www.instagram.com/", "instagram.com", 9],
  ["https://www.linkedin.com/feed", "linkedin.com", 7],
  ["https://www.youtube.com/", "youtube.com", 4],
  ["https://www.facebook.com/", "facebook.com", 4],
  ["https://news.ycombinator.com/", "news.ycombinator.com", 3],
  ["https://www.reddit.com/", "reddit.com", 3],
  ["https://linkshort.app/newsletter", "linkshort.app", 3],
  ["https://t.co/", "t.co", 2],
];

const HOURS: Array<[number, number]> = [
  [7, 1], [8, 2], [9, 3], [10, 3], [11, 3], [12, 4], [13, 4], [14, 5], [15, 5],
  [16, 4], [17, 4], [18, 4], [19, 5], [20, 6], [21, 6], [22, 4], [23, 2],
];

export function seedDemo(d: DatabaseSync): void {
  const existing = d.prepare("SELECT id FROM users WHERE email = ?").get(DEMO_EMAIL);
  if (existing) return;

  const now = Date.now();
  const rand = mulberry32(0x5eed2026);
  const day = 86_400_000;

  const userId = "u_demo_alex";
  const apiKey = "ls_live_demo_5f6b7c8d9e0f1a2b3c4d";

  const campaigns = [
    { id: "cp_launch", name: "Product Launch", description: "Everything around the v2 launch week.", color: "#2f55f0" },
    { id: "cp_newsletter", name: "Newsletter 2026", description: "Links shared in the weekly newsletter.", color: "#8fa6ff" },
    { id: "cp_spring", name: "Spring Promo", description: "Seasonal offers and campaign landing pages.", color: "#ffc53d" },
    { id: "cp_podcast", name: "Podcast", description: "Show notes, guests and episode links.", color: "#3ddc97" },
  ];

  const specs: Spec[] = [
    {
      id: "ln_launch", code: "launch", url: "https://www.figma.com/community",
      title: "Product Launch — Design System", campaignId: "cp_launch", tags: ["launch", "design"],
      clicks: 528, utm: { source: "x", medium: "social", campaign: "launch-2026" }, qr: true,
    },
    {
      id: "ln_newsletter", code: "newsletter", url: "https://www.notion.so/product",
      title: "Notion for product teams", campaignId: "cp_newsletter", tags: ["newsletter"],
      clicks: 389, utm: { source: "newsletter", medium: "email", campaign: "newsletter-2026" }, qr: true,
    },
    {
      id: "ln_spring", code: "spring-sale", url: "https://gumroad.com/discover",
      title: "Spring Sale — 40% off resources", campaignId: "cp_spring", tags: ["sale", "promo"],
      clicks: 241, utm: { source: "instagram", medium: "social", campaign: "spring-2026" },
      expiresAt: now - 2 * day, qr: true,
    },
    {
      id: "ln_demo", code: "demo", url: "https://vercel.com/blog",
      title: "Vercel engineering blog", campaignId: null, tags: ["content"],
      clicks: 312, qr: true,
    },
    {
      id: "ln_github", code: "github-repo", url: "https://github.com/vercel/next.js",
      title: "Next.js repository", campaignId: null, tags: ["dev"], clicks: 128,
    },
    {
      id: "ln_podcast", code: "podcast-ep-12", url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
      title: "Podcast Ep. 12 — Building in public", campaignId: "cp_podcast", tags: ["podcast"],
      clicks: 95, active: false,
    },
    {
      id: "ln_yt", code: "yt-2026", url: "https://www.youtube.com/@vercel",
      title: "YouTube channel", campaignId: null, tags: ["video"],
      clicks: 74, pixelMeta: "1097070082069034",
    },
    {
      id: "ln_beta", code: "beta-waitlist", url: "https://www.notion.so/product",
      title: "Beta waitlist (A/B test)", campaignId: "cp_launch", tags: ["beta", "ab-test"],
      clicks: 63, variantB: "https://www.notion.so/help", abWeight: 40,
    },
    {
      id: "ln_vip", code: "vip-access", url: "https://calendly.com",
      title: "VIP access — private call", campaignId: null, tags: ["vip"],
      clicks: 23, password: "demo123",
    },
    {
      id: "ln_drop", code: "drop-limited", url: "https://stripe.com/pricing",
      title: "Limited drop — first 50 only", campaignId: "cp_spring", tags: ["drop", "limited"],
      clicks: 50, maxClicks: 50,
    },
    {
      id: "ln_linkedin", code: "linkedin-post", url: "https://www.linkedin.com/feed",
      title: "LinkedIn launch post", campaignId: null, tags: ["social"], clicks: 41,
      utm: { source: "linkedin", medium: "social", campaign: "launch-2026" },
    },
    {
      id: "ln_figma", code: "figma-file", url: "https://www.figma.com/community/file/1298426160",
      title: "Hero illustration file", campaignId: "cp_launch", tags: ["design"], clicks: 34,
    },
    {
      id: "ln_doc", code: "press-kit", url: "https://docs.google.com/document/u/0/",
      title: "Press kit & brand assets", campaignId: null, tags: ["press"], clicks: 17,
    },
  ];

  const insertUser = d.prepare(
    `INSERT INTO users (id, email, name, password_hash, plan, email_verified, verify_token, reset_token,
      reset_expires, api_key, auto_renew, plan_since, created_at)
     VALUES (?, ?, ?, ?, ?, 1, NULL, NULL, NULL, ?, 1, ?, ?)`
  );
  const insertCampaign = d.prepare(
    `INSERT INTO campaigns (id, user_id, name, description, color, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  );
  const insertLink = d.prepare(
    `INSERT INTO links (id, user_id, code, url, title, campaign_id, tags, password_hash, expires_at, max_clicks,
      click_count, is_active, utm_source, utm_medium, utm_campaign, utm_term, utm_content, pixel_meta, pixel_google,
      pixel_tiktok, variant_b, ab_weight, domain_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, NULL, NULL, ?, ?, NULL, ?, ?)`
  );
  const insertClick = d.prepare(
    `INSERT INTO clicks (id, user_id, link_id, ts, ip_hash, country, city, device, os, browser, referrer,
      referrer_host, utm_source, utm_medium, utm_campaign, utm_term, utm_content, is_qr, is_unique, is_bot, variant)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?)`
  );
  const insertQr = d.prepare(
    `INSERT INTO qrcodes (id, user_id, link_id, name, fg, bg, margin, ecc, logo, scans, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertDomain = d.prepare(
    `INSERT INTO domains (id, user_id, hostname, verified, is_active, token, created_at) VALUES (?, ?, ?, 1, 1, ?, ?)`
  );
  const insertPage = d.prepare(
    `INSERT INTO pages (id, user_id, slug, title, bio, avatar, theme, accent, is_published, views, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`
  );
  const insertBlock = d.prepare(
    `INSERT INTO page_blocks (id, page_id, type, title, subtitle, url, sort, clicks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertInvoice = d.prepare(
    `INSERT INTO invoices (id, user_id, plan, amount_cents, status, created_at) VALUES (?, ?, ?, ?, 'PAID', ?)`
  );

  d.exec("BEGIN");
  try {
    insertUser.run(userId, DEMO_EMAIL, "Alex Morgan", demoHash("demo1234"), "PRO", apiKey, now - 100 * day, now - 120 * day);

    campaigns.forEach((c, index) => {
      insertCampaign.run(c.id, userId, c.name, c.description, c.color, now - (110 - index * 8) * day);
    });

    insertDomain.run("dm_alex", userId, "go.alexmorgan.co", "linkshort-verify=8f2c91d4e7", now - 60 * day);

    const qrClicks = new Map<string, number>();

    specs.forEach((spec, linkIndex) => {
      const created = now - (75 + Math.floor(rand() * 18)) * day;
      const passwordHash = spec.password ? demoHash(spec.password) : null;
      insertLink.run(
        spec.id, userId, spec.code, spec.url, spec.title, spec.campaignId, JSON.stringify(spec.tags),
        passwordHash, spec.expiresAt ?? null, spec.maxClicks ?? null, spec.clicks, spec.active === false ? 0 : 1,
        spec.utm?.source ?? null, spec.utm?.medium ?? null, spec.utm?.campaign ?? null,
        spec.pixelMeta ?? null, spec.variantB ?? null, spec.abWeight ?? 50, created, created
      );

      const seenIps = new Set<number>();
      let qrCount = 0;
      for (let i = 0; i < spec.clicks; i += 1) {
        const isBot = rand() < 0.03;
        const [country, city] = pickWeighted(rand, COUNTRIES.map(([c, ci, w]) => [[c, ci] as [string, string], w] as [[string, string], number]));
        const [refUrl, refHost] = pickWeighted(rand, REFERRERS.map(([u, h, w]) => [[u, h] as [string, string], w] as [[string, string], number]));
        const device = isBot ? "Bot" : pickWeighted(rand, [["Mobile", 58], ["Desktop", 35], ["Tablet", 7]] as Array<["Mobile" | "Desktop" | "Tablet", number]>);
        const os = isBot || device === "Desktop"
          ? (isBot ? "Other" : pickWeighted(rand, [["Windows", 55], ["macOS", 30], ["Linux", 12], ["ChromeOS", 3]] as Array<[string, number]>))
          : pickWeighted(rand, (device === "Tablet" ? [["iOS", 40], ["Android", 60]] : [["iOS", 55], ["Android", 45]]) as Array<[string, number]>);
        const browser = isBot
          ? "Other"
          : os === "iOS"
            ? pickWeighted(rand, [["Safari", 70], ["Chrome", 30]] as Array<[string, number]>)
            : os === "Android"
              ? pickWeighted(rand, [["Chrome", 80], ["Samsung Internet", 20]] as Array<[string, number]>)
              : pickWeighted(rand, [["Chrome", 60], ["Safari", 14], ["Edge", 12], ["Firefox", 10], ["Opera", 4]] as Array<[string, number]>);

        const isQr = Boolean(spec.qr) && !isBot && rand() < 0.18;
        if (isQr) qrCount += 1;

        const ipIndex = Math.floor(rand() * 320);
        const unique = !seenIps.has(ipIndex) && !isBot;
        seenIps.add(ipIndex);

        const variant = spec.variantB ? (rand() * 100 < (spec.abWeight ?? 50) ? "B" : "A") : null;

        let ts = now - Math.floor(Math.pow(rand(), 1.5) * 60) * day;
        const d0 = new Date(ts);
        d0.setHours(pickWeighted(rand, HOURS), Math.floor(rand() * 60), Math.floor(rand() * 60), 0);
        ts = d0.getTime();
        if (ts > now) ts -= day;

        insertClick.run(
          `ck_${spec.id}_${i}`, userId, spec.id, ts, `demo-${linkIndex}-${ipIndex}`,
          country, city, device, os, browser, refUrl, refHost,
          spec.utm?.source ?? null, spec.utm?.medium ?? null, spec.utm?.campaign ?? null,
          isQr ? 1 : 0, unique ? 1 : 0, isBot ? 1 : 0,
          isBot ? null : variant
        );
      }
      if (qrCount > 0) qrClicks.set(spec.id, qrCount);
    });

    insertQr.run("qr_launch", userId, "ln_launch", "Launch — print & deck", "#04060a", "#ffffff", 2, "M", "AM", qrClicks.get("ln_launch") ?? 0, now - 40 * day);
    insertQr.run("qr_newsletter", userId, "ln_newsletter", "Newsletter QR", "#1b36b8", "#eef2ff", 3, "M", "NL", qrClicks.get("ln_newsletter") ?? 0, now - 30 * day);
    insertQr.run("qr_spring", userId, "ln_spring", "Spring pop-up", "#a86300", "#fdf6e8", 2, "Q", "SP", qrClicks.get("ln_spring") ?? 0, now - 20 * day);
    insertQr.run("qr_demo", userId, "ln_demo", "Demo QR", "#04060a", "#ffffff", 4, "H", "LS", qrClicks.get("ln_demo") ?? 0, now - 10 * day);

    const pageCreated = now - 45 * day;
    insertPage.run(
      "pg_alex", userId, "alexmorgan", "Alex Morgan",
      "Product designer building calm, useful software. Currently exploring the intersection of design systems and AI.",
      "AM", "midnight", "#2f55f0", 1240, pageCreated, pageCreated
    );
    insertBlock.run("bl_portfolio", "pg_alex", "link", "Portfolio", "Selected work 2023–2026", "https://www.figma.com/community", 0, 214);
    insertBlock.run("bl_video", "pg_alex", "link", "Latest video", "Designing in public, ep. 12", "https://www.youtube.com/@vercel", 1, 158);
    insertBlock.run("bl_newsletter", "pg_alex", "link", "Newsletter", "Weekly notes on product design", "https://www.notion.so/product", 2, 96);
    insertBlock.run("bl_call", "pg_alex", "link", "Book a call", "30 minutes, no agenda", "https://calendly.com", 3, 38);
    insertBlock.run("bl_heading", "pg_alex", "heading", "Elsewhere", null, null, 4, 0);
    insertBlock.run("bl_social", "pg_alex", "social", "LinkedIn", "@alexmorgan", "https://www.linkedin.com/feed", 5, 21);

    for (let i = 0; i < 3; i += 1) {
      const ts = new Date(now - (i * 30 + 8) * day);
      insertInvoice.run(`inv_demo_${i}`, userId, "PRO", 1300, ts.getTime());
    }

    d.exec("COMMIT");
  } catch (error) {
    d.exec("ROLLBACK");
    throw error;
  }
}
