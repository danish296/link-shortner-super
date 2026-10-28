export interface UaInfo {
  browser: string;
  os: string;
  device: "Desktop" | "Mobile" | "Tablet" | "Bot";
  isBot: boolean;
}

const BOT_RE = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|headless|curl|wget|python-requests|axios|node-fetch/i;

export function parseUserAgent(uaRaw: string | null | undefined): UaInfo {
  const ua = uaRaw ?? "";
  if (!ua) return { browser: "Unknown", os: "Unknown", device: "Desktop", isBot: false };

  const isBot = BOT_RE.test(ua);
  let browser = "Other";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(ua)) browser = "Opera";
  else if (/Firefox|FxiOS/i.test(ua)) browser = "Firefox";
  else if (/SamsungBrowser/i.test(ua)) browser = "Samsung Internet";
  else if (/Chrome|CriOS/i.test(ua)) browser = "Chrome";
  else if (/Safari/i.test(ua)) browser = "Safari";

  let os = "Other";
  if (/Windows NT/i.test(ua)) os = "Windows";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Mac OS X|Macintosh/i.test(ua)) os = "macOS";
  else if (/CrOS/i.test(ua)) os = "ChromeOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  let device: UaInfo["device"] = "Desktop";
  if (isBot) device = "Bot";
  else if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) device = "Tablet";
  else if (/Mobi|iPhone|iPod|Android.*Mobile/i.test(ua)) device = "Mobile";

  return { browser, os, device, isBot };
}

const LANG_COUNTRY: Record<string, { country: string; city: string }> = {
  "en-US": { country: "United States", city: "New York" },
  "en-GB": { country: "United Kingdom", city: "London" },
  "en-CA": { country: "Canada", city: "Toronto" },
  "en-AU": { country: "Australia", city: "Sydney" },
  "pt-BR": { country: "Brazil", city: "São Paulo" },
  "pt-PT": { country: "Portugal", city: "Lisbon" },
  "es-ES": { country: "Spain", city: "Madrid" },
  "es-MX": { country: "Mexico", city: "Mexico City" },
  "fr-FR": { country: "France", city: "Paris" },
  "de-DE": { country: "Germany", city: "Berlin" },
  "it-IT": { country: "Italy", city: "Milan" },
  "nl-NL": { country: "Netherlands", city: "Amsterdam" },
  "id-ID": { country: "Indonesia", city: "Jakarta" },
  "ja-JP": { country: "Japan", city: "Tokyo" },
  "hi-IN": { country: "India", city: "Mumbai" },
};

const CODE_COUNTRY: Record<string, { country: string; city: string }> = {
  US: { country: "United States", city: "New York" },
  BR: { country: "Brazil", city: "São Paulo" },
  IN: { country: "India", city: "Mumbai" },
  DE: { country: "Germany", city: "Berlin" },
  GB: { country: "United Kingdom", city: "London" },
  FR: { country: "France", city: "Paris" },
  CA: { country: "Canada", city: "Toronto" },
  AU: { country: "Australia", city: "Sydney" },
  JP: { country: "Japan", city: "Tokyo" },
  ES: { country: "Spain", city: "Madrid" },
  MX: { country: "Mexico", city: "Mexico City" },
  PT: { country: "Portugal", city: "Lisbon" },
  ID: { country: "Indonesia", city: "Jakarta" },
  IT: { country: "Italy", city: "Milan" },
  NL: { country: "Netherlands", city: "Amsterdam" },
  SE: { country: "Sweden", city: "Stockholm" },
};

/**
 * Country data is only as good as the edge/CDN headers present on the request.
 * Without a geo header we fall back to the Accept-Language region, then Unknown.
 */
export function deriveGeo(headers: Headers): { country: string; city: string } {
  const explicit = (headers.get("cf-ipcountry") || headers.get("x-vercel-ip-country") || "").toUpperCase();
  if (explicit && CODE_COUNTRY[explicit]) return CODE_COUNTRY[explicit];
  if (explicit && explicit !== "XX" && explicit !== "T1") return { country: explicit, city: "Unknown" };

  const lang = (headers.get("accept-language") || "").split(",")[0]?.trim();
  if (lang && LANG_COUNTRY[lang]) return LANG_COUNTRY[lang];
  if (lang) {
    const base = lang.split("-")[0]?.toLowerCase();
    if (base === "en") return LANG_COUNTRY["en-US"];
    if (base === "pt") return LANG_COUNTRY["pt-BR"];
    if (base === "es") return LANG_COUNTRY["es-ES"];
    if (base === "fr") return LANG_COUNTRY["fr-FR"];
    if (base === "de") return LANG_COUNTRY["de-DE"];
  }
  return { country: "Unknown", city: "Unknown" };
}

export function referrerInfo(referrer: string | null): { referrer: string; host: string } {
  if (!referrer) return { referrer: "", host: "Direct" };
  try {
    const url = new URL(referrer);
    if (url.hostname.includes("localhost") || url.hostname === "127.0.0.1") return { referrer: "", host: "Direct" };
    return { referrer: referrer.slice(0, 500), host: url.hostname.replace(/^www\./, "") };
  } catch {
    return { referrer: "", host: "Direct" };
  }
}
