import Link from "next/link";
import { ArrowRight, BookOpen, Braces, Codesandbox, KeyRound, Terminal } from "@/components/icons";
import { CopyButton } from "@/components/copy-button";
import { getCurrentUser } from "@/lib/auth";
import { getBaseUrl } from "@/lib/server-url";

export const metadata = {
  title: "Documentation",
  description: "REST API documentation for LinkShort: authentication, link creation, analytics, rate limits and error codes.",
};

const NAV = [
  { href: "#quickstart", label: "Quickstart" },
  { href: "#auth", label: "Authentication" },
  { href: "#endpoints", label: "Endpoints" },
  { href: "#create", label: "Create a link" },
  { href: "#list", label: "List links" },
  { href: "#single", label: "Get a link" },
  { href: "#redirects", label: "Redirect behavior" },
  { href: "#qr", label: "QR & exports" },
  { href: "#limits", label: "Rate limits" },
  { href: "#errors", label: "Errors" },
  { href: "#object", label: "Link object" },
];

const PARAMS: Array<{ name: string; type: string; required?: boolean; description: string }> = [
  { name: "url", type: "string", required: true, description: "Destination URL. https:// is added automatically if missing." },
  { name: "alias", type: "string", description: "Custom code (3–40 characters, letters, digits, - and _). Generated when omitted." },
  { name: "title", type: "string", description: "Human readable label shown in the dashboard." },
  { name: "campaignId", type: "string", description: "Attach the link to one of your campaigns." },
  { name: "tags", type: "string[]", description: "Freeform labels used for filtering." },
  { name: "password", type: "string", description: "Require a password before the redirect happens." },
  { name: "expiresAt", type: "string | number", description: "ISO date or epoch milliseconds. The link stops redirecting after this time." },
  { name: "maxClicks", type: "number", description: "Close the link after N clicks. Enforced atomically." },
  { name: "utmSource / utmMedium / utmCampaign", type: "string", description: "Appended to the destination as UTM parameters." },
  { name: "variantB", type: "string", description: "Second destination URL for A/B testing." },
  { name: "abWeight", type: "number", description: "Percentage of traffic sent to variant B (1–99)." },
];

const ERRORS = [
  { status: "400", meaning: "Validation error", example: "url is required" },
  { status: "401", meaning: "Missing or invalid API key", example: "Invalid API key" },
  { status: "402", meaning: "Plan quota exhausted", example: "Free plan allows 100 links per month" },
  { status: "403", meaning: "Cross origin request blocked", example: "Invalid origin" },
  { status: "404", meaning: "Resource not found", example: "Link not found" },
  { status: "409", meaning: "Conflict", example: "That alias is already taken" },
  { status: "429", meaning: "Rate limited", example: "Too many attempts. Please wait a moment." },
];

export default async function DocsPage() {
  const [baseUrl, user] = await Promise.all([getBaseUrl(), getCurrentUser()]);
  const key = user?.api_key ?? "ls_live_your_key";

  const code = {
    quickstart: `# Create a short link
curl -X POST "${baseUrl}/api/v1/shorten" \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://example.com/spring-sale","alias":"spring"}'`,
    response: `HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "lk_9f3ab2c1",
  "code": "spring",
  "shortUrl": "${baseUrl}/spring",
  "url": "https://example.com/spring-sale",
  "title": null,
  "tags": [],
  "clicks": 0,
  "isActive": true,
  "passwordProtected": false,
  "expiresAt": null,
  "maxClicks": null,
  "campaignId": null,
  "createdAt": 1770000000000
}`,
    auth: `Authorization: Bearer ${key}`,
    list: `curl "${baseUrl}/api/v1/links?status=active&size=10&sort=clicks" \\
  -H "Authorization: Bearer ${key}"`,
    listResponse: `{
  "data": [ { "id": "lk_9f3ab2c1", "code": "spring", "clicks": 128, "status": "active", … } ],
  "pagination": { "page": 1, "pages": 3, "total": 27, "size": 10 }
}`,
    single: `curl "${baseUrl}/api/v1/links/spring" \\
  -H "Authorization: Bearer ${key}"`,
    singleResponse: `{
  "id": "lk_9f3ab2c1",
  "code": "spring",
  "status": "active",
  "analytics": {
    "range": "30d",
    "clicks": 128,
    "uniqueVisitors": 94,
    "qrScans": 12,
    "series": [ { "label": "2026-10-01", "clicks": 9, "uniques": 7 }, … ],
    "countries": [ { "label": "United States", "clicks": 52 } ],
    "devices": [ { "label": "Mobile", "clicks": 81 } ],
    "referrers": [ { "label": "instagram.com", "clicks": 33 } ]
  },
  "generatedAt": "2026-10-28T09:41:00.000Z"
}`,
    export: `curl -L "${baseUrl}/api/export/clicks?days=30" -o clicks.csv`,
  };

  return (
    <div className="container-x py-12">
      <div className="max-w-2xl">
        <span className="section-eyebrow">
          <BookOpen size={12} /> Documentation
        </span>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">LinkShort API</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          A small REST API for creating short links and reading their analytics. Everything the dashboard does goes through the same database —
          no separate sync to worry about.
        </p>
        <p className="mono mt-4 rounded-lg border border-line bg-card px-3 py-2 text-xs text-muted">Base URL: {baseUrl}</p>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[210px_1fr]">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1 border-l border-line pl-3">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="block py-1 text-xs text-muted transition-colors hover:text-ink">
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 space-y-12">
          <section id="quickstart" className="scroll-mt-24">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold">
              <Terminal size={17} className="text-brand-ink" /> Quickstart
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Grab a key from the <Link href="/app/api" className="text-brand-ink hover:underline">API & keys</Link> page, then POST a URL.
              Responses are JSON; timestamps are epoch milliseconds.
            </p>
            <CodeBlock code={code.quickstart} label="Create a link" />
            <CodeBlock code={code.response} label="Response" />
          </section>

          <section id="auth" className="scroll-mt-24">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold">
              <KeyRound size={17} className="text-brand-ink" /> Authentication
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Every <span className="mono">/api/v1</span> request needs your key in the Authorization header. Regenerating a key invalidates the
              previous one immediately.
            </p>
            <CodeBlock code={code.auth} label="Header" />
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Dashboard endpoints (QR images, CSV export, account changes) use your session cookie instead and additionally require a same-origin
              request for mutations.
            </p>
          </section>

          <section id="endpoints" className="scroll-mt-24">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold">
              <Braces size={17} className="text-brand-ink" /> Endpoints
            </h2>
            <div className="mt-3 overflow-hidden rounded-xl border border-line">
              <table className="table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Path</th>
                    <th className="hidden sm:table-cell">Auth</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["POST", "/api/v1/shorten", "Bearer key"],
                    ["GET", "/api/v1/links", "Bearer key"],
                    ["GET", "/api/v1/links/{code}", "Bearer key"],
                    ["GET", "/api/qrcodes/{id}/image", "Session"],
                    ["GET", "/api/export/clicks", "Session"],
                  ].map(([method, path, auth]) => (
                    <tr key={path}>
                      <td>
                        <span className={`badge font-mono ${method === "POST" ? "badge-brand" : "badge-muted"}`}>{method}</span>
                      </td>
                      <td className="mono text-xs">{path}</td>
                      <td className="hidden text-xs text-muted sm:table-cell">{auth}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="create" className="scroll-mt-24">
            <h3 className="font-display text-lg font-bold">Create a link</h3>
            <p className="mt-1 mono text-xs text-muted">POST /api/v1/shorten</p>
            <div className="mt-3 overflow-hidden rounded-xl border border-line">
              <table className="table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Type</th>
                    <th className="hidden sm:table-cell">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {PARAMS.map((param) => (
                    <tr key={param.name}>
                      <td className="mono text-xs">
                        {param.name}
                        {param.required ? <span className="ml-1 text-bad">*</span> : null}
                      </td>
                      <td className="text-xs text-muted">{param.type}</td>
                      <td className="hidden text-xs text-muted sm:table-cell">{param.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="hint">
              Aliases must be unique and cannot collide with reserved routes (login, docs, app, pricing, api, p, and similar). The API returns 409
              when a code is taken.
            </p>
          </section>

          <section id="list" className="scroll-mt-24">
            <h3 className="font-display text-lg font-bold">List links</h3>
            <p className="mt-1 mono text-xs text-muted">GET /api/v1/links</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Query parameters: <span className="mono">q</span>, <span className="mono">status</span> (active, inactive, expired, limit),{" "}
              <span className="mono">page</span>, <span className="mono">size</span> (max 100) and <span className="mono">sort</span> (newest,
              oldest, clicks, clicks_asc, alias).
            </p>
            <CodeBlock code={code.list} label="Request" />
            <CodeBlock code={code.listResponse} label="Response" />
          </section>

          <section id="single" className="scroll-mt-24">
            <h3 className="font-display text-lg font-bold">Get a link with analytics</h3>
            <p className="mt-1 mono text-xs text-muted">GET /api/v1/links/&#123;code&#125;</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Returns the serialized link plus a 30-day analytics snapshot: totals, daily series, countries, devices and referrers.
            </p>
            <CodeBlock code={code.single} label="Request" />
            <CodeBlock code={code.singleResponse} label="Response" />
          </section>

          <section id="redirects" className="scroll-mt-24">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold">
              <Codesandbox size={17} className="text-brand-ink" /> Redirect behavior
            </h2>
            <div className="mt-3 space-y-4 text-sm leading-relaxed text-muted">
              <div>
                <p className="font-semibold text-ink">GET /&#123;code&#125;</p>
                <p>
                  Resolves the code, checks status, enforces password unlocks, optionally splits traffic between variants, applies UTM parameters
                  and records the click. Bot user agents are counted separately and excluded from analytics. A 302 is returned for normal visits.
                </p>
              </div>
              <ul className="space-y-2">
                <li>• <span className="text-ink">Paused</span> links return a 410 HTML page explaining the link is disabled.</li>
                <li>• <span className="text-ink">Expired</span> links and links past their click limit also return 410.</li>
                <li>• <span className="text-ink">Password</span>-protected links show a form; unlocked devices get a signed cookie.</li>
                <li>• Adding <span className="mono">?qr=&#123;qrId&#125;</span> attributes the visit to that QR code.</li>
              </ul>
            </div>
          </section>

          <section id="qr" className="scroll-mt-24">
            <h3 className="font-display text-lg font-bold">QR images & CSV export</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              <span className="mono">GET /api/qrcodes/&#123;id&#125;/image</span> returns an SVG for one of your QR codes; add{" "}
              <span className="mono">?download=1</span> for a file download. Both endpoints require a session, so call them from the browser rather
              than a server-to-server job.
            </p>
            <CodeBlock code={code.export} label="Export clicks" />
          </section>

          <section id="limits" className="scroll-mt-24">
            <h2 className="font-display text-xl font-bold">Rate limits</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              API creation is limited to 240 requests per minute per key and IP. Login and registration have stricter limits to slow down abuse.
              When you exceed a limit the API responds with <span className="mono">429</span> and a <span className="mono">Retry-After</span>{" "}
              header; retry after the indicated delay with exponential backoff.
            </p>
          </section>

          <section id="errors" className="scroll-mt-24">
            <h2 className="font-display text-xl font-bold">Errors</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Errors use a single envelope with a human-readable message:
            </p>
            <CodeBlock code={`{ "error": "That alias is already taken" }`} label="Error envelope" />
            <div className="mt-3 overflow-hidden rounded-xl border border-line">
              <table className="table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th className="hidden sm:table-cell">Meaning</th>
                    <th>Example</th>
                  </tr>
                </thead>
                <tbody>
                  {ERRORS.map((row) => (
                    <tr key={row.status}>
                      <td className="mono text-xs">{row.status}</td>
                      <td className="hidden text-xs text-muted sm:table-cell">{row.meaning}</td>
                      <td className="text-xs text-muted">{row.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="object" className="scroll-mt-24">
            <h2 className="font-display text-xl font-bold">Link object</h2>
            <div className="mt-3 overflow-hidden rounded-xl border border-line">
              <table className="table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Type</th>
                    <th className="hidden sm:table-cell">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["id", "string", "Stable identifier used in dashboard URLs."],
                    ["code", "string", "The short code under your domain."],
                    ["shortUrl", "string", "Fully-qualified short URL."],
                    ["url", "string", "Destination after UTM processing."],
                    ["title", "string | null", "Display label."],
                    ["tags", "string[]", "Filter labels."],
                    ["clicks", "number", "Total recorded clicks."],
                    ["isActive", "boolean", "Pause switch."],
                    ["passwordProtected", "boolean", "True when a password is set."],
                    ["expiresAt", "number | null", "Epoch milliseconds."],
                    ["maxClicks", "number | null", "Click cap."],
                    ["campaignId", "string | null", "Campaign reference."],
                    ["createdAt", "number", "Epoch milliseconds."],
                  ].map(([field, type, notes]) => (
                    <tr key={field}>
                      <td className="mono text-xs">{field}</td>
                      <td className="text-xs text-muted">{type}</td>
                      <td className="hidden text-xs text-muted sm:table-cell">{notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="card card-pad flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Ready to build?</p>
              <p className="mt-1 text-xs text-muted">Create a key and copy a working cURL snippet from your dashboard.</p>
            </div>
            <Link href={user ? "/app/api" : "/register"} className="btn btn-primary btn-sm shrink-0">
              {user ? "Open API & keys" : "Create an account"} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function CodeBlock({ code, label }: { code: string; label: string }) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-line bg-[#05080f]">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</span>
        <CopyButton text={code} className="text-slate-400 hover:text-white" />
      </div>
      <pre className="scroll-thin overflow-x-auto px-4 py-3 text-xs leading-relaxed text-slate-300">
        <code>{code}</code>
      </pre>
    </div>
  );
}
