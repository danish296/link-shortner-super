"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Check,
  Copy,
  Globe,
  Loader2,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  ShieldCheck,
  Trash2,
} from "@/components/icons";
import { Modal } from "@/components/modal";
import { EmptyState, PageHeader } from "@/components/ui";
import { cn, formatNumber, timeAgo } from "@/lib/utils";

export interface DomainItem {
  id: string;
  hostname: string;
  verified: boolean;
  isActive: boolean;
  token: string;
  createdAt: number;
  links: number;
}

interface CreatedDomain {
  id: string;
  hostname: string;
  token: string;
}

export function DomainsView({
  domains,
  limit,
  usage,
}: {
  domains: DomainItem[];
  limit: number;
  usage: number;
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [pending, setPending] = useState<CreatedDomain | null>(null);
  const [deleting, setDeleting] = useState<DomainItem | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; message: string } | null>(null);

  const verified = domains.filter((domain) => domain.verified).length;
  const atLimit = usage >= limit;

  async function verifyById(id: string, hostname: string, simulate = false) {
    setVerifying(id);
    setNotice(null);
    try {
      const response = await fetch(`/api/domains/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: simulate ? "simulate" : "verify" }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Verification failed");
      setNotice({ tone: "ok", message: `${hostname} is verified. You can attach links to it now.` });
      setPending(null);
      router.refresh();
    } catch (verifyError) {
      setNotice({ tone: "error", message: verifyError instanceof Error ? verifyError.message : "Verification failed" });
    } finally {
      setVerifying(null);
    }
  }

  async function toggle(domain: DomainItem) {
    setVerifying(domain.id);
    setNotice(null);
    try {
      const response = await fetch(`/api/domains/${domain.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: domain.isActive ? "pause" : "resume" }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Could not update the domain");
      }
      router.refresh();
    } catch (toggleError) {
      setNotice({ tone: "error", message: toggleError instanceof Error ? toggleError.message : "Could not update the domain" });
    } finally {
      setVerifying(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Domains"
        description="Serve short links from your own brand domain instead of the default host."
        actions={
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setAddOpen(true)}
            disabled={atLimit}
            title={atLimit ? "Domain limit reached on your plan" : undefined}
          >
            <Plus size={14} /> Add domain
          </button>
        }
      />

      <div className="card mb-4 flex flex-col gap-3 border-brand/20 bg-brand/5 p-4 sm:flex-row sm:items-center">
        <span className="feature-icon h-10 w-10 shrink-0">
          <ShieldCheck size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">Verify ownership before attaching links</div>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">
            Add a TXT record at <span className="code-chip">_linkshort.yourdomain.com</span> with the token we
            generate, then hit verify. This build records branded short URLs and marks links as custom-domain routed.
          </p>
        </div>
        <a href="/docs#domains" className="btn btn-outline btn-sm shrink-0">
          Setup guide
        </a>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card card-pad">
          <div className="stat-label">Custom domains</div>
          <div className="stat-value mt-2">
            {usage}
            <span className="text-base font-normal text-muted"> / {limit}</span>
          </div>
          <div className="stat-sub mt-1">{limit === 0 ? "Upgrade to connect a domain" : `${limit - usage} remaining`}</div>
        </div>
        <div className="card card-pad">
          <div className="stat-label">Verified</div>
          <div className="stat-value mt-2">{verified}</div>
          <div className="stat-sub mt-1">Ready for links</div>
        </div>
        <div className="card card-pad">
          <div className="stat-label">Links on custom domains</div>
          <div className="stat-value mt-2">{formatNumber(domains.reduce((sum, domain) => sum + domain.links, 0))}</div>
          <div className="stat-sub mt-1">Across all connected hosts</div>
        </div>
      </div>

      {notice ? (
        <div className={cn("alert mb-4", notice.tone === "ok" ? "alert-ok" : "alert-error")}>
          <span>{notice.message}</span>
        </div>
      ) : null}

      {domains.length === 0 ? (
        <div className="card p-8">
          <EmptyState
            icon={<Globe size={20} />}
            title={limit === 0 ? "Custom domains are a paid feature" : "No domains connected"}
            description={
              limit === 0
                ? "Upgrade to Basic or higher to connect your own short domain and keep every link on-brand."
                : "Connect a subdomain like go.yourbrand.com to start creating branded short links."
            }
            action={
              limit === 0 ? (
                <a href="/app/billing" className="btn btn-primary btn-sm">
                  Upgrade plan
                </a>
              ) : (
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setAddOpen(true)}>
                  <Plus size={14} /> Add your first domain
                </button>
              )
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {domains.map((domain) => (
            <DomainCard
              key={domain.id}
              domain={domain}
              busy={verifying === domain.id}
              onVerify={() => verifyById(domain.id, domain.hostname)}
              onSimulate={() => verifyById(domain.id, domain.hostname, true)}
              onToggle={() => toggle(domain)}
              onDelete={() => setDeleting(domain)}
              onShowDns={() => setPending({ id: domain.id, hostname: domain.hostname, token: domain.token })}
            />
          ))}
        </div>
      )}

      <AddDomainModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(created) => {
          setAddOpen(false);
          setPending(created);
          router.refresh();
        }}
        onLimit={() => setNotice({ tone: "error", message: "You've reached the domain limit on your plan." })}
      />

      <DnsModal
        domain={pending}
        onClose={() => setPending(null)}
        onVerify={() => {
          if (pending) verifyById(pending.id, pending.hostname);
        }}
        verifying={Boolean(pending && verifying === pending.id)}
      />

      <DeleteDomainModal domain={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

function DomainCard({
  domain,
  busy,
  onVerify,
  onSimulate,
  onToggle,
  onDelete,
  onShowDns,
}: {
  domain: DomainItem;
  busy: boolean;
  onVerify: () => void;
  onSimulate: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onShowDns: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="card card-pad">
      <div className="flex items-start gap-3">
        <span className={cn("feature-icon h-10 w-10 shrink-0", !domain.verified && "!border-warn/25 !bg-warn/10 !text-warn")}>
          {domain.verified ? <BadgeCheck size={18} /> : <Globe size={18} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-display text-sm font-semibold">{domain.hostname}</h2>
            <span className={cn("badge", domain.verified ? "badge-ok" : "badge-warn")}>
              {domain.verified ? (domain.isActive ? "Verified" : "Paused") : "Pending DNS"}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {formatNumber(domain.links)} links · added {timeAgo(domain.createdAt)}
          </p>
        </div>
        <div className="relative">
          <button type="button" className="icon-btn h-7 w-7" onClick={() => setOpen((value) => !value)} aria-label="Domain actions">
            <MoreHorizontal size={16} />
          </button>
          {open ? (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-8 z-40 w-48 rounded-xl border border-line bg-panel p-2 text-left shadow-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onShowDns();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted transition hover:bg-card2 hover:text-ink"
                >
                  <ShieldCheck size={13} /> DNS instructions
                </button>
                {domain.verified ? (
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onToggle();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted transition hover:bg-card2 hover:text-ink"
                  >
                    {domain.isActive ? <Pause size={13} /> : <Play size={13} />}
                    {domain.isActive ? "Pause domain" : "Resume domain"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onVerify();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted transition hover:bg-card2 hover:text-ink"
                  >
                    <BadgeCheck size={13} /> Verify now
                  </button>
                )}
                <div className="my-1 border-t border-line" />
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onDelete();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-bad transition hover:bg-bad/10"
                >
                  <Trash2 size={13} /> Remove domain
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-line bg-card2 px-3 py-2">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted">Short links</span>
          <span className="font-mono text-ink">{domain.hostname}/<span className="text-muted">code</span></span>
        </div>
      </div>

      {!domain.verified ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-primary btn-sm" onClick={onVerify} disabled={busy}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />} Verify DNS
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={onSimulate} disabled={busy} title="Development only">
            Simulate verification
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onShowDns}>
            View record
          </button>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2">
          <a href="/app/links?new=1" className="btn btn-outline btn-sm">
            <Plus size={13} /> Add a link
          </a>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onToggle} disabled={busy}>
            {domain.isActive ? "Pause" : "Resume"}
          </button>
        </div>
      )}
    </div>
  );
}

function DnsModal({
  domain,
  onClose,
  onVerify,
  verifying,
}: {
  domain: CreatedDomain | null;
  onClose: () => void;
  onVerify: () => void;
  verifying: boolean;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    setCopied(null);
  }, [domain]);

  async function copy(value: string, kind: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  }

  const rows = domain
    ? [
        { kind: "type", label: "Type", value: "TXT" },
        { kind: "name", label: "Name", value: `_linkshort.${domain.hostname}` },
        { kind: "value", label: "Value", value: domain.token },
      ]
    : [];

  return (
    <Modal
      open={Boolean(domain)}
      onClose={onClose}
      title="Verify your domain"
      subtitle={domain?.hostname}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={verifying}>
            Close
          </button>
          <button type="button" className="btn btn-primary" onClick={onVerify} disabled={verifying}>
            {verifying ? <Loader2 size={15} className="animate-spin" /> : <BadgeCheck size={15} />} I’ve added the record
          </button>
        </>
      }
    >
      <p className="text-sm text-muted">
        Create the following DNS record with your provider. It can take a few minutes to propagate.
      </p>
      <div className="mt-4 overflow-hidden rounded-xl border border-line">
        {rows.map((row, index) => (
          <div
            key={row.kind}
            className={cn(
              "flex items-center justify-between gap-3 bg-card2 px-3 py-3",
              index > 0 && "border-t border-line"
            )}
          >
            <span className="w-14 shrink-0 text-xs font-bold uppercase tracking-wider text-muted">{row.label}</span>
            <span className="min-w-0 flex-1 break-all font-mono text-xs">{row.value}</span>
            <button
              type="button"
              className="icon-btn h-6 w-6 shrink-0"
              onClick={() => copy(row.value, row.kind)}
              aria-label={`Copy ${row.label}`}
            >
              {copied === row.kind ? <Check size={13} className="text-ok" /> : <Copy size={13} />}
            </button>
          </div>
        ))}
      </div>
      <p className="hint">
        In this local build, links resolve on the app host. Verification unlocks branding the domain on links and the custom-domain badge
        throughout the dashboard.
      </p>
    </Modal>
  );
}

function AddDomainModal({
  open,
  onClose,
  onCreated,
  onLimit,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (domain: CreatedDomain) => void;
  onLimit: () => void;
}) {
  const [hostname, setHostname] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setHostname("");
    setBusy(false);
    setError(null);
  }, [open]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/domains", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hostname }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; id?: string; hostname?: string; token?: string };
      if (response.status === 402) {
        onClose();
        onLimit();
        return;
      }
      if (!response.ok || !data.id || !data.hostname || !data.token) throw new Error(data.error || "Could not add the domain");
      onCreated({ id: data.id, hostname: data.hostname, token: data.token });
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Could not add the domain");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a custom domain"
      subtitle="Use a subdomain like go.yourbrand.com for shorter, on-brand links."
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="domain-form" className="btn btn-primary" disabled={busy}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Add domain
          </button>
        </>
      }
    >
      <form id="domain-form" onSubmit={submit}>
        <div className="field">
          <label className="label" htmlFor="domain-host">
            Domain
          </label>
          <input
            id="domain-host"
            className="input font-mono"
            placeholder="go.yourbrand.com"
            value={hostname}
            onChange={(event) => setHostname(event.target.value)}
            required
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
          <p className="hint">Enter a hostname without https:// or a path. Don’t include the protocol.</p>
        </div>
        {error ? <div className="alert alert-error">{error}</div> : null}
      </form>
    </Modal>
  );
}

function DeleteDomainModal({ domain, onClose }: { domain: DomainItem | null; onClose: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBusy(false);
    setError(null);
  }, [domain]);

  async function remove() {
    if (!domain) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/domains/${domain.id}`, { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not remove the domain");
      onClose();
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not remove the domain");
      setBusy(false);
    }
  }

  return (
    <Modal
      open={Boolean(domain)}
      onClose={onClose}
      title="Remove domain?"
      subtitle={domain?.hostname}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={remove} disabled={busy}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Remove domain
          </button>
        </>
      }
    >
      <p className="text-sm text-muted">
        {domain?.links ?? 0} links will fall back to the default domain. Click history stays intact.
      </p>
      {error ? <div className="alert alert-error mt-4">{error}</div> : null}
    </Modal>
  );
}
