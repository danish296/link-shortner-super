"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Code2, Eye, EyeOff, KeyRound, Loader2, RefreshCw, ShieldCheck, Sparkles } from "@/components/icons";
import { CopyButton } from "@/components/copy-button";
import { Modal } from "@/components/modal";
import { PageHeader, SectionCard } from "@/components/ui";
import { cn } from "@/lib/utils";

const ENDPOINTS = [
  { method: "POST", path: "/api/v1/shorten", description: "Create a short link with optional alias, UTM tags, password and expiry." },
  { method: "GET", path: "/api/v1/links", description: "List links with search, status filters and pagination." },
  { method: "GET", path: "/api/v1/links/{code}", description: "Fetch a single link plus its 30-day analytics." },
  { method: "GET", path: "/api/export/clicks?days=30", description: "Download a CSV of tracked clicks (session auth)." },
];

export function ApiView({ apiKey, baseUrl, planName }: { apiKey: string | null; baseUrl: string; planName: string }) {
  const router = useRouter();
  const [revealed, setRevealed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const masked = apiKey ? `${apiKey.slice(0, 12)}${"•".repeat(Math.max(apiKey.length - 16, 8))}${apiKey.slice(-4)}` : null;
  const shown = apiKey ? (revealed ? apiKey : masked) : "";

  const createSnippet = `curl -X POST "${baseUrl}/api/v1/shorten" \\
  -H "Authorization: Bearer ${apiKey ?? "ls_live_your_key"}" \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://example.com/launch","alias":"spring"}'`;

  const responseSnippet = `{
  "id": "lk_3f9a…",
  "code": "spring",
  "shortUrl": "${baseUrl}/spring",
  "url": "https://example.com/launch",
  "clicks": 0,
  "isActive": true,
  "createdAt": 1770000000000
}`;

  const listSnippet = `curl "${baseUrl}/api/v1/links?status=active&size=10" \\
  -H "Authorization: Bearer ${apiKey ?? "ls_live_your_key"}"`;

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/account/api-key", { method: "POST" });
      const data = (await response.json().catch(() => ({}))) as { error?: string; apiKey?: string };
      if (!response.ok || !data.apiKey) throw new Error(data.error || "Could not generate a key");
      setRevealed(true);
      setConfirmOpen(false);
      router.refresh();
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "Could not generate a key");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Developers"
        title="API & keys"
        description="Create links and pull analytics from your own stack with a simple REST API."
        actions={
          <a href="/docs" className="btn btn-outline btn-sm">
            <Code2 size={14} /> Read documentation
          </a>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <SectionCard
            title="API key"
            subtitle={`${planName} plan · 240 requests per minute`}
            action={
              apiKey ? (
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirmOpen(true)}>
                  <RefreshCw size={13} /> Regenerate
                </button>
              ) : null
            }
          >
            {apiKey ? (
              <>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-card2 px-3 py-3">
                    <KeyRound size={15} className="shrink-0 text-brand-ink" />
                    <span className={cn("min-w-0 flex-1 truncate font-mono text-xs", !revealed && "select-none")}>{shown}</span>
                    <button
                      type="button"
                      className="icon-btn h-6 w-6 shrink-0"
                      onClick={() => setRevealed((value) => !value)}
                      aria-label={revealed ? "Hide API key" : "Reveal API key"}
                    >
                      {revealed ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                  <CopyButton text={apiKey} label="Copy key" className="shrink-0" />
                </div>
                <p className="hint">
                  Send as <span className="mono">Authorization: Bearer …</span>. Keep it secret — anyone with this key can create links on
                  your account.
                </p>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-line bg-card2 px-4 py-6 text-center">
                <KeyRound size={20} className="mx-auto text-muted" />
                <p className="mt-2 text-xs text-muted">No API key yet. Generate one to start using the REST API.</p>
                <button type="button" className="btn btn-primary btn-sm mt-3" onClick={generate} disabled={busy}>
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Generate API key
                </button>
              </div>
            )}
            {error ? <div className="alert alert-error mt-3">{error}</div> : null}
          </SectionCard>

          <SectionCard title="Create your first link" subtitle="One HTTP request, no SDK required" bodyClassName="p-0">
            <div className="border-b border-line">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-xs font-semibold text-muted">cURL</span>
                <CopyButton text={createSnippet} />
              </div>
              <pre className="scroll-thin overflow-x-auto border-t border-line bg-[#05080f] px-4 py-3 text-xs leading-relaxed text-slate-300">
                <code>{createSnippet}</code>
              </pre>
            </div>
            <div className="border-b border-line">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-xs font-semibold text-muted">201 Created</span>
                <CopyButton text={responseSnippet} />
              </div>
              <pre className="scroll-thin overflow-x-auto border-t border-line bg-[#05080f] px-4 py-3 text-xs leading-relaxed text-slate-300">
                <code>{responseSnippet}</code>
              </pre>
            </div>
            <div>
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-xs font-semibold text-muted">List links</span>
                <CopyButton text={listSnippet} />
              </div>
              <pre className="scroll-thin overflow-x-auto border-t border-line bg-[#05080f] px-4 py-3 text-xs leading-relaxed text-slate-300">
                <code>{listSnippet}</code>
              </pre>
            </div>
          </SectionCard>

          <SectionCard title="Endpoints" subtitle="Everything the dashboard can do" bodyClassName="p-0">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Path</th>
                    <th className="hidden sm:table-cell">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {ENDPOINTS.map((endpoint) => (
                    <tr key={endpoint.path}>
                      <td>
                        <span className={cn("badge font-mono", endpoint.method === "POST" ? "badge-brand" : "badge-muted")}>
                          {endpoint.method}
                        </span>
                      </td>
                      <td className="font-mono text-xs">{endpoint.path}</td>
                      <td className="hidden text-xs text-muted sm:table-cell">{endpoint.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Authentication" subtitle="Bearer tokens">
            <div className="space-y-3 text-xs leading-relaxed text-muted">
              <p>Every /api/v1 request must include your key in the Authorization header.</p>
              <pre className="code overflow-x-auto text-xs">Authorization: Bearer ls_live_…</pre>
              <p>Missing or invalid keys return 401. Quota exhaustion returns 402 with an upgrade message.</p>
            </div>
          </SectionCard>

          <SectionCard title="Rate limits" subtitle="Fair use, per key">
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted">Requests</span>
                <span className="mono">240 / min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Burst</span>
                <span className="mono">60</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Scope</span>
                <span>Per API key</span>
              </div>
            </div>
            <p className="hint">Exceeding the limit returns 429 with a Retry-After header.</p>
          </SectionCard>

          <SectionCard title="Errors" subtitle="Consistent JSON envelopes">
            <pre className="code overflow-x-auto text-xs">{`{
  "error": "That alias is already taken"
}`}</pre>
            <p className="hint">All errors include an HTTP status and a human readable message.</p>
          </SectionCard>

          <div className="card card-pad">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <ShieldCheck size={14} className="text-ok" /> Security notes
            </div>
            <ul className="mt-2 space-y-2 text-xs leading-relaxed text-muted">
              <li>• Keys are shown once — store them in a secret manager.</li>
              <li>• Regenerating instantly revokes the old key.</li>
              <li>• Requests are rate limited per key and IP.</li>
            </ul>
          </div>
        </div>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={apiKey ? "Regenerate API key?" : "Generate API key?"}
        subtitle="The previous key stops working immediately."
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmOpen(false)} disabled={busy}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={generate} disabled={busy}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} {apiKey ? "Regenerate key" : "Generate key"}
            </button>
          </>
        }
      >
        <p className="text-sm text-muted">
          Any integration using the current key will start receiving 401 responses. Update your environment variables after generating a new
          one.
        </p>
      </Modal>
    </>
  );
}
