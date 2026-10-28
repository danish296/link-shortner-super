import Link from "next/link";
import QRCode from "qrcode";
import {
  ArrowRight,
  BarChart3,
  Braces,
  Check,
  Download,
  Globe2,
  Layers,
  Link2,
  Megaphone,
  MousePointerClick,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserRound,
  Zap,
} from "@/components/icons";
import { AreaChart, BarList, type ChartPoint } from "@/components/charts";
import { HeroShortener } from "@/components/marketing/hero-shortener";
import { PricingGrid } from "@/components/marketing/pricing-grid";
import { Reveal, TaglineReveal } from "@/components/reveal";
import { getCurrentUser } from "@/lib/auth";
import { getPlan } from "@/lib/plans";
import { getBaseUrl } from "@/lib/server-url";
import { formatNumber } from "@/lib/utils";

export const metadata = {
  title: "Short links, QR codes and analytics",
  description:
    "Create branded short links, track clicks in real time, design QR codes and publish bio pages. Free to start, no card required.",
};

const BENEFITS = [
  {
    icon: Link2,
    title: "Branded short links",
    body: "Custom aliases with expiry dates, click caps and password protection. Change the destination later without touching what you already shared.",
  },
  {
    icon: QrCode,
    title: "QR codes ready for print",
    body: "Set colors, quiet zone, error correction and a center label, then export a vector SVG that stays sharp on a poster or a menu.",
  },
  {
    icon: BarChart3,
    title: "Analytics you can act on",
    body: "Country, city, device, browser, OS and referrer for every click, with bot traffic filtered out and unique visitors deduplicated.",
  },
  {
    icon: Megaphone,
    title: "Campaigns and A/B tests",
    body: "Group links by campaign, compare performance per channel and send a share of traffic to a second destination.",
  },
  {
    icon: UserRound,
    title: "Bio pages on your own URL",
    body: "Publish a themed page at /p/your name with social, heading and text blocks. Every tap is counted as a click.",
  },
];

const ALSO_INCLUDED = [
  { icon: Globe2, label: "Custom domains with DNS verification" },
  { icon: Braces, label: "REST API with bearer keys" },
  { icon: Download, label: "CSV export of every tracked click" },
  { icon: Sparkles, label: "Retargeting pixels on link open" },
];

const STEPS = [
  {
    title: "Add the destination",
    body: "Paste a URL, choose an alias and set an expiry or a click cap when the link is only meant to live for a while.",
  },
  {
    title: "Share it anywhere",
    body: "Send the short link, print the QR code or place it on a bio page. Campaign tags travel with it.",
  },
  {
    title: "Read the results",
    body: "Open analytics to see clicks by country, device and referrer, then export the raw rows whenever you need them.",
  },
];

const USE_CASES = [
  {
    icon: Smartphone,
    title: "Creators",
    body: "One page for every profile link, plus short URLs for captions and stories that you can actually measure.",
  },
  {
    icon: Megaphone,
    title: "Marketing teams",
    body: "Spin up campaign links for each channel, tag them consistently and compare what converts.",
  },
  {
    icon: Zap,
    title: "Developers",
    body: "A predictable REST API, CSV exports and a schema you can read in one sitting.",
  },
];

const HONEST = [
  {
    title: "Your click data leaves with you",
    body: "Export every tracked click as CSV, from 7 to 365 days depending on your plan.",
  },
  {
    title: "A real API, not a preview",
    body: "Create and list links with a bearer key at 240 requests per minute on every plan.",
  },
  {
    title: "No lock in",
    body: "Runs on Next.js and SQLite. The schema is small enough to read in one sitting.",
  },
];

const FAQ = [
  {
    q: "Is there a free plan?",
    a: "Yes. The Free plan includes 100 links per month, 5 QR codes, 3 campaigns, one bio page and 7 days of analytics history. No credit card required.",
  },
  {
    q: "How do custom domains work?",
    a: "Add a domain, publish the TXT record we show you, and verify. In this local build links are still served from the app host, but the verification flow is real.",
  },
  {
    q: "Do short links expire?",
    a: "Only if you set an expiry date or a click limit. Otherwise links stay active until you pause or delete them.",
  },
  {
    q: "Can I export my click data?",
    a: "Yes. Download a CSV of up to 50,000 clicks for the last 7 to 365 days from the analytics page or through the export endpoint.",
  },
  {
    q: "What happens when I hit my plan limit?",
    a: "Creating more links returns an upgrade prompt instead of failing silently. Your existing links keep working.",
  },
  {
    q: "Can I try it without signing up?",
    a: "The shortener on this page previews your link. Create a free account to activate it and start tracking clicks.",
  },
];

function demoSeries(): ChartPoint[] {
  return Array.from({ length: 30 }, (_, index) => {
    const day = index + 1;
    const clicks = Math.round(420 + Math.sin(index / 2.6) * 120 + index * 22 + (index % 7 === 5 ? 190 : 0));
    return { label: `${day}`, clicks, uniques: Math.round(clicks * 0.68) };
  });
}

function mockAlias(target: string): string {
  const stub = target.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
  return `${stub.split(".")[0]}-launch`;
}

export default async function LandingPage() {
  const [user, baseUrl] = await Promise.all([getCurrentUser(), getBaseUrl()]);
  const planName = user ? getPlan(user.plan).name : null;
  const host = baseUrl.replace(/^https?:\/\//, "");
  const series = demoSeries();
  const totalClicks = series.reduce((sum, point) => sum + point.clicks, 0);
  const totalUniques = series.reduce((sum, point) => sum + (point.uniques ?? 0), 0);
  const qrSvg = await QRCode.toString(`https://${host}/qr`, {
    type: "svg",
    margin: 1,
    width: 200,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#ffffff" },
  });

  return (
    <>
      <section className="pb-16 md:pb-24">
        <div className="container-x">
          <div className="mt-8 flex flex-col items-center text-center">
            <span className="section-eyebrow">
              <Sparkles size={12} /> Short links, QR codes and analytics
            </span>
            <h1 className="hero-title mt-6 max-w-[680px] text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              Short links that tell you
              <br className="hidden sm:block" /> what happened.
            </h1>
            <p className="mt-6 max-w-[680px] text-base leading-relaxed text-pretty text-muted sm:text-lg">
              Branded URLs, QR codes and bio pages for marketing teams that share links every day. See the country, device and
              referrer behind every click.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3">
              {user ? (
                <Link href="/app/dashboard" className="btn btn-primary btn-lg">
                  Open dashboard <ArrowRight size={16} />
                </Link>
              ) : (
                <Link href="/register" className="btn btn-primary btn-lg">
                  Create your free account <ArrowRight size={16} />
                </Link>
              )}
              <p className="text-xs text-muted">100 links a month. No credit card.</p>
            </div>

            <HeroShortener baseHost={host} />
          </div>

          <div id="live-demo" className="mt-16 scroll-mt-24">
            <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-line bg-panel p-4">
              <div className="flex items-center justify-between border-b border-line px-2 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-bad" />
                  <span className="h-2 w-2 rounded-full bg-warn" />
                  <span className="h-2 w-2 rounded-full bg-ok" />
                </div>
                <span className="mono hidden text-xs text-muted sm:block">{host}/app/dashboard</span>
                <span className="badge badge-ok">
                  <span className="h-2 w-2 rounded-full bg-ok" /> Live
                </span>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
                <div className="rounded-lg bg-card p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="stat-label">Clicks, last 30 days</p>
                      <p className="mt-2 flex items-baseline gap-2">
                        <span className="stat-value">{formatNumber(totalClicks)}</span>
                        <span className="badge badge-ok">+18.4%</span>
                      </p>
                    </div>
                    <span className="badge badge-muted">All links</span>
                  </div>
                  <div className="mt-4">
                    <AreaChart id="landing-preview" data={series} height={190} />
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="rounded-lg bg-card p-4">
                    <p className="stat-label">Top links</p>
                    <div className="mt-4">
                      <BarList
                        items={[
                          { label: `/${mockAlias("https://instagram.com")}`, clicks: 2841 },
                          { label: "/spring-sale", clicks: 1930 },
                          { label: "/podcast-ep-42", clicks: 1204 },
                          { label: "/menu-qr", clicks: 866 },
                        ]}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-card p-4">
                      <MousePointerClick size={16} className="text-accent-fg" />
                      <p className="mt-2 text-lg font-semibold">68.2%</p>
                      <p className="text-xs text-muted">unique visitors</p>
                    </div>
                    <div className="rounded-lg bg-card p-4">
                      <QrCode size={16} className="text-brand-ink" />
                      <p className="mt-2 text-lg font-semibold">1,246</p>
                      <p className="text-xs text-muted">QR scans</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <dl className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-8 text-center md:grid-cols-4">
              {[
                { value: "100", label: "links each month on the Free plan" },
                { value: "7 to 365", label: "days of click history" },
                { value: "240", label: "API requests per minute" },
                { value: "SVG", label: "vector QR export" },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="text-2xl font-semibold tracking-tight">{stat.value}</dt>
                  <dd className="mt-1 text-xs text-muted">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-20 border-y border-line bg-panel py-16 md:py-24">
        <div className="container-x">
          <Reveal>
            <div className="max-w-[680px]">
              <span className="section-eyebrow">
                <Layers size={12} /> What it does
              </span>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">Everything a link needs, in one place</h2>
              <p className="mt-4 text-base leading-relaxed text-muted">
                Most tools stop at the redirect. LinkShort keeps the destination, the design and the results together, so you can
                answer one question: did this link work?
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Reveal key={benefit.title} delay={index * 60} className="h-full">
                  <div className="card card-pad card-hover h-full">
                    <span className="feature-icon">
                      <Icon size={20} />
                    </span>
                    <h3 className="mt-4 text-base font-semibold">{benefit.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{benefit.body}</p>
                  </div>
                </Reveal>
              );
            })}

            <Reveal delay={BENEFITS.length * 60} className="h-full">
              <div className="card card-pad h-full">
                <p className="text-sm font-semibold">Also included</p>
                <ul className="mt-4 space-y-3">
                  {ALSO_INCLUDED.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.label} className="flex items-start gap-2 text-sm leading-relaxed text-muted">
                        <Icon size={16} className="mt-0.5 shrink-0 text-brand-ink" />
                        {item.label}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container-x">
          <TaglineReveal
            lines={["Stop guessing which links work.", "See exactly what happens after the click."]}
            className="mx-auto text-center text-4xl font-semibold leading-tight tracking-tight sm:text-5xl"
          />
        </div>
      </section>

      <section className="border-y border-line bg-panel py-16 md:py-24">
        <div className="container-x">
          <Reveal>
            <div className="max-w-[680px]">
              <span className="section-eyebrow">
                <Check size={12} /> How it works
              </span>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">From long URL to a clear answer in three steps</h2>
            </div>
          </Reveal>

          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="border-t border-line pt-6">
                <Reveal delay={index * 80}>
                  <span className="mono text-sm text-brand-ink">{String(index + 1).padStart(2, "0")}</span>
                  <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="analytics" className="scroll-mt-20 py-16 md:py-24">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div>
              <span className="section-eyebrow">
                <BarChart3 size={12} /> Analytics
              </span>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">Know which links earn their keep</h2>
              <p className="mt-4 text-base leading-relaxed text-muted">
                Every open is logged with country, city, device, browser, OS and referrer. Bot traffic is filtered out, unique
                visitors are deduplicated, and QR scans are attributed separately.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Click trends for 7, 30, 90 or 365 days depending on your plan",
                  "Breakdowns by country, city, device, browser, OS and referrer",
                  "QR scans and A/B variant performance in the same view",
                  "CSV export of every tracked click",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted">
                    <Check size={16} className="mt-0.5 shrink-0 text-ok" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href={user ? "/app/analytics" : "/register"} className="btn btn-outline btn-sm mt-8">
                {user ? "Open analytics" : "Explore analytics"} <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="card card-pad">
              <div className="flex items-start justify-between">
                <div>
                  <p className="stat-label">Clicks</p>
                  <p className="stat-value mt-2">{formatNumber(totalClicks)}</p>
                </div>
                <div className="text-right">
                  <p className="stat-label">Unique</p>
                  <p className="stat-value mt-2">{formatNumber(totalUniques)}</p>
                </div>
              </div>
              <div className="mt-6">
                <AreaChart id="landing-analytics" data={series} height={210} />
              </div>
              <div className="mt-6 grid gap-6 border-t border-line pt-6 sm:grid-cols-2">
                <div>
                  <p className="stat-label mb-3">Top countries</p>
                  <BarList
                    items={[
                      { label: "United States", clicks: 4820 },
                      { label: "Germany", clicks: 2210 },
                      { label: "India", clicks: 1880 },
                      { label: "United Kingdom", clicks: 1440 },
                    ]}
                  />
                </div>
                <div>
                  <p className="stat-label mb-3">Devices</p>
                  <BarList
                    items={[
                      { label: "Mobile", clicks: 6130 },
                      { label: "Desktop", clicks: 2890 },
                      { label: "Tablet", clicks: 640 },
                    ]}
                  />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="qr" className="scroll-mt-20 border-y border-line bg-panel py-16 md:py-24">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <Reveal className="order-2 lg:order-1">
            <div className="mx-auto max-w-sm rounded-3xl border border-line bg-white p-6">
              <div
                className="flex justify-center"
                role="img"
                aria-label={`QR code that opens ${host}/qr`}
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <p className="mt-6 text-center text-xs font-semibold uppercase tracking-widest text-black/50">Scan to open</p>
              <p className="mono mt-1 text-center text-xs text-black/50">{host}/qr</p>
            </div>
          </Reveal>

          <Reveal delay={80} className="order-1 lg:order-2">
            <div>
              <span className="section-eyebrow">
                <QrCode size={12} /> QR codes
              </span>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">QR codes you will not be embarrassed to print</h2>
              <p className="mt-4 text-base leading-relaxed text-muted">
                Choose foreground and background colors, quiet zone and error correction, add a center label, then download an SVG
                that stays sharp at any size. Scans are tagged so you can separate them from ordinary clicks.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {["SVG export", "Custom colors", "Center label", "Scan attribution"].map((item) => (
                  <div key={item} className="rounded-xl border border-line bg-card px-4 py-3 text-sm text-muted">
                    {item}
                  </div>
                ))}
              </div>
              <Link href={user ? "/app/qrcodes" : "/register"} className="btn btn-outline btn-sm mt-8">
                {user ? "Manage QR codes" : "Create your first QR code"} <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="bio" className="scroll-mt-20 py-16 md:py-24">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div>
              <span className="section-eyebrow">
                <UserRound size={12} /> Bio pages
              </span>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">A bio page that looks like your brand</h2>
              <p className="mt-4 text-base leading-relaxed text-muted">
                Publish a mobile first page at <span className="mono text-ink">/p/your-name</span> with six themes, an accent
                color, social icons, headings and free text. Every block tap is tracked as a click.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-muted">
                <li className="flex gap-3">
                  <ShieldCheck size={16} className="mt-0.5 shrink-0 text-ok" /> Pause or publish instantly
                </li>
                <li className="flex gap-3">
                  <ShieldCheck size={16} className="mt-0.5 shrink-0 text-ok" /> Live preview while you edit
                </li>
                <li className="flex gap-3">
                  <ShieldCheck size={16} className="mt-0.5 shrink-0 text-ok" /> Per block click counts
                </li>
              </ul>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="mx-auto w-full max-w-xs">
              <div className="page-theme-aurora overflow-hidden rounded-3xl border border-line p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-xl font-semibold text-white ring-2 ring-white/20">
                    AM
                  </div>
                  <p className="mt-4 text-base font-semibold">Alex Morgan</p>
                  <p className="mt-1 text-xs text-white/70">Designer, builder, coffee person</p>
                </div>
                <div className="mt-6 space-y-2">
                  {["Latest project", "YouTube channel", "Shop my desk setup", "Book a call"].map((label, index) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-white"
                      style={index === 0 ? { background: "rgba(255,255,255,0.22)" } : undefined}
                    >
                      {label}
                      <ArrowRight size={16} className="text-white/60" />
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-center text-xs text-white/50">Made with LinkShort</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-line bg-panel py-16 md:py-24">
        <div className="container-x">
          <Reveal>
            <div className="max-w-[680px]">
              <span className="section-eyebrow">
                <Zap size={12} /> Built for
              </span>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">Whatever you share, it starts with a link</h2>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {USE_CASES.map((useCase, index) => {
              const Icon = useCase.icon;
              return (
                <Reveal key={useCase.title} delay={index * 60} className="h-full">
                  <div className="card card-pad h-full">
                    <span className="feature-icon">
                      <Icon size={20} />
                    </span>
                    <h3 className="mt-4 text-base font-semibold">{useCase.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{useCase.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={120}>
            <div className="mt-12 grid gap-8 border-t border-line pt-12 md:grid-cols-3">
              {HONEST.map((item) => (
                <div key={item.title}>
                  <h3 className="text-base font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-20 py-16 md:py-24">
        <div className="container-x">
          <Reveal>
            <div className="mx-auto max-w-[680px] text-center">
              <span className="section-eyebrow">
                <Sparkles size={12} /> Pricing
              </span>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">Start free, upgrade when you grow</h2>
              <p className="mt-4 text-base leading-relaxed text-muted">
                Every plan includes analytics, QR codes, campaigns and API access. Switch or cancel at any time.
              </p>
            </div>
          </Reveal>
          <div className="mt-12">
            <PricingGrid signedIn={Boolean(user)} />
          </div>
          <p className="mt-6 text-center text-sm text-muted">
            Compare every limit on the{" "}
            <Link href="/pricing" className="text-brand-ink underline-offset-4 hover:underline">
              pricing page
            </Link>
            . {planName ? `Your current plan: ${planName}.` : "The Free plan includes 100 links a month."}
          </p>
        </div>
      </section>

      <section className="border-y border-line bg-panel py-16 md:py-24">
        <div className="container-x grid gap-12 lg:grid-cols-[0.9fr_1.4fr]">
          <Reveal>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Questions, answered</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Still curious? The{" "}
                <Link href="/docs" className="text-brand-ink underline-offset-4 hover:underline">
                  documentation
                </Link>{" "}
                covers the API and link behavior in detail.
              </p>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div className="space-y-2">
              {FAQ.map((item) => (
                <details key={item.q} className="group rounded-xl border border-line bg-card px-6 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold">
                    {item.q}
                    <span className="text-muted transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container-x">
          <Reveal>
            <div className="rounded-3xl border border-line bg-card px-6 py-16 text-center sm:px-12">
              <h2 className="mx-auto max-w-[680px] text-3xl font-semibold tracking-tight">Your next 100 links are free</h2>
              <p className="mx-auto mt-4 max-w-[680px] text-base leading-relaxed text-muted">
                Create an account, shorten your first link in seconds, and watch the clicks land in real time.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href={user ? "/app/links?new=1" : "/register"} className="btn btn-primary btn-lg">
                  {user ? "Create a link" : "Create your free account"} <ArrowRight size={16} />
                </Link>
              </div>
              <p className="mt-6 text-xs text-muted">
                Demo account: <span className="mono text-ink">demo@linkshort.app</span> /{" "}
                <span className="mono text-ink">demo1234</span>
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
