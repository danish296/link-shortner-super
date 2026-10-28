"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownWideNarrow,
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Layers,
  Link2,
  Loader2,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Plus,
  QrCode,
  Search,
  Trash2,
  Upload,
} from "@/components/icons";
import { LinkForm, type LinkFormCampaign, type LinkFormDomain, type LinkFormLink } from "./link-form";
import { Modal } from "@/components/modal";
import { CopyButton } from "@/components/copy-button";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { cn, formatDate, formatNumber, timeAgo } from "@/lib/utils";

export interface LinkListItem extends LinkFormLink {
  clicks: number;
  status: "active" | "inactive" | "expired" | "limit";
  createdAt: number;
  campaignName: string | null;
  campaignColor: string | null;
  domainHost: string | null;
}

interface Filters {
  q: string;
  status: string;
  sort: string;
  campaignId: string;
}

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Paused" },
  { value: "expired", label: "Expired" },
  { value: "limit", label: "Limit reached" },
];

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "clicks", label: "Most clicks" },
  { value: "clicks_asc", label: "Fewest clicks" },
  { value: "alias", label: "Alias A–Z" },
];

function hrefWith(filters: Filters, patch: Partial<Filters>, page?: number): string {
  const params = new URLSearchParams();
  const next = { ...filters, ...patch };
  if (next.q) params.set("q", next.q);
  if (next.status && next.status !== "all") params.set("status", next.status);
  if (next.sort && next.sort !== "newest") params.set("sort", next.sort);
  if (next.campaignId) params.set("campaignId", next.campaignId);
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/app/links?${query}` : "/app/links";
}

export function LinksView({
  rows,
  total,
  page,
  pages,
  filters,
  campaigns,
  domains,
  baseUrl,
  openNew,
  campaignsLimit,
  defaultCampaignId,
  defaultUrl,
}: {
  rows: LinkListItem[];
  total: number;
  page: number;
  pages: number;
  filters: Filters;
  campaigns: LinkFormCampaign[];
  domains: LinkFormDomain[];
  baseUrl: string;
  openNew: boolean;
  campaignsLimit: number;
  defaultCampaignId?: string;
  defaultUrl?: string;
}) {
  const router = useRouter();
  const [newOpen, setNewOpen] = useState(openNew);
  const [editing, setEditing] = useState<LinkListItem | null>(null);
  const [deleting, setDeleting] = useState<LinkListItem | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [search, setSearch] = useState(filters.q);

  useEffect(() => {
    setSearch(filters.q);
  }, [filters.q]);

  useEffect(() => {
    if (openNew) setNewOpen(true);
  }, [openNew]);

  function closeNew() {
    setNewOpen(false);
    if (openNew) router.replace(hrefWith(filters, {}));
  }

  const activeFilterCount = [filters.q, filters.status !== "all" ? filters.status : "", filters.campaignId].filter(Boolean).length;

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Links"
        description="Every short link you own, with live click counts, campaigns and advanced routing."
        actions={
          <>
            <a href="/api/export/clicks?days=30" className="btn btn-outline btn-sm">
              <Download size={14} /> Export CSV
            </a>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setBulkOpen(true)}>
              <Upload size={14} /> Bulk shorten
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setNewOpen(true)}>
              <Plus size={14} /> New link
            </button>
          </>
        }
      />

      <div className="card">
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
          <form action="/app/links" className="relative w-full lg:max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              name="q"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search alias, URL, title or tag…"
              className="input input-sm pl-10"
              aria-label="Search links"
            />
            {filters.status !== "all" ? <input type="hidden" name="status" value={filters.status} /> : null}
            {filters.sort !== "newest" ? <input type="hidden" name="sort" value={filters.sort} /> : null}
            {filters.campaignId ? <input type="hidden" name="campaignId" value={filters.campaignId} /> : null}
          </form>

          <div className="scroll-thin -mx-1 flex items-center gap-1 overflow-x-auto px-1">
            {STATUS_TABS.map((tab) => {
              const active = filters.status === tab.value;
              return (
                <Link
                  key={tab.value}
                  href={hrefWith(filters, { status: tab.value })}
                  className={cn(
                    "whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition",
                    active ? "bg-brand/15 text-brand-ink" : "text-muted hover:bg-card2 hover:text-ink"
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2 lg:ml-auto">
            <label htmlFor="link-sort" className="flex items-center gap-2 whitespace-nowrap text-xs text-muted">
              <ArrowDownWideNarrow size={13} /> Sort
            </label>
            <select
              id="link-sort"
              className="select input-sm w-auto"
              value={filters.sort}
              onChange={(event) => router.push(hrefWith(filters, { sort: event.target.value }))}
            >
              {SORTS.map((sort) => (
                <option key={sort.value} value={sort.value}>
                  {sort.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Link2 size={20} />}
              title={activeFilterCount > 0 ? "No links match those filters" : "No links yet"}
              description={
                activeFilterCount > 0
                  ? "Try a different search term or clear the filters to see everything."
                  : "Create your first short link — it takes about ten seconds."
              }
              action={
                activeFilterCount > 0 ? (
                  <Link href="/app/links" className="btn btn-outline btn-sm">
                    Clear filters
                  </Link>
                ) : (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setNewOpen(true)}>
                    <Plus size={14} /> Create a link
                  </button>
                )
              }
            />
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Link</th>
                  <th className="hidden xl:table-cell">Destination</th>
                  <th className="hidden md:table-cell">Campaign</th>
                  <th className="text-right">Clicks</th>
                  <th className="hidden sm:table-cell">Status</th>
                  <th className="hidden lg:table-cell">Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="max-w-[260px]">
                      <div className="flex items-center gap-2">
                        <Link href={`/app/links/${row.id}`} className="truncate font-medium text-ink hover:text-brand-ink">
                          {row.title || `/${row.code}`}
                        </Link>
                        {row.passwordProtected ? (
                          <span className="badge badge-muted !py-0 text-xs" title="Password protected">
                            locked
                          </span>
                        ) : null}
                        {row.domainHost ? <span className="badge badge-brand !py-0 text-xs">custom</span> : null}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <a
                          href={row.shortUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate font-mono text-xs text-muted hover:text-brand-ink"
                        >
                          {row.shortUrl.replace(/^https?:\/\//, "")}
                        </a>
                        <CopyButton text={row.shortUrl} className="!h-5 !w-5 !border-0 !bg-transparent !p-0" />
                      </div>
                      {row.tags.length > 0 ? (
                        <div className="mt-1 hidden items-center gap-1 sm:flex">
                          {row.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="badge badge-muted !py-0 text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </td>
                    <td className="hidden max-w-[220px] xl:table-cell">
                      <div className="truncate text-xs text-muted" title={row.url}>
                        {row.url.replace(/^https?:\/\//, "")}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        {row.expiresAt ? (
                          <span className="text-xs text-muted" title={formatDate(row.expiresAt)}>
                            until {formatDate(row.expiresAt)}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="hidden md:table-cell">
                      {row.campaignName ? (
                        <span className="badge" style={{ background: `${row.campaignColor}22`, color: row.campaignColor ?? undefined }}>
                          {row.campaignName}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                    <td className="text-right">
                      <Link href={`/app/links/${row.id}`} className="mono text-sm font-semibold hover:text-brand-ink">
                        {formatNumber(row.clicks)}
                      </Link>
                      {row.maxClicks ? <div className="text-xs text-muted">of {formatNumber(row.maxClicks)}</div> : null}
                    </td>
                    <td className="hidden sm:table-cell">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="hidden whitespace-nowrap text-xs text-muted lg:table-cell">{timeAgo(row.createdAt)}</td>
                    <td className="w-10 text-right">
                      <RowMenu
                        row={row}
                        onEdit={() => setEditing(row)}
                        onDelete={() => setDeleting(row)}
                        onChanged={() => router.refresh()}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col items-center justify-between gap-3 border-t border-line px-4 py-3 sm:flex-row">
          <p className="text-xs text-muted">
            Showing <span className="text-ink">{rows.length}</span> of <span className="text-ink">{formatNumber(total)}</span> links
            {filters.q ? ` matching “${filters.q}”` : ""}
          </p>
          <Pagination page={page} pages={pages} filters={filters} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted">
        <span className="flex items-center gap-2">
          <Layers size={12} /> {formatNumber(total)} links total
        </span>
        <span className="flex items-center gap-2">
          <BarChart3 size={12} /> {formatNumber(rows.reduce((sum, row) => sum + row.clicks, 0))} clicks on this page
        </span>
        <span className="flex items-center gap-2">
          <QrCode size={12} /> {campaigns.length}/{campaignsLimit} campaigns used
        </span>
        <span className="ml-auto hidden items-center gap-2 sm:flex">
          <ExternalLink size={12} /> Links resolve instantly at the shortest path
        </span>
      </div>

      <LinkForm
        open={newOpen}
        onClose={closeNew}
        baseUrl={baseUrl}
        campaigns={campaigns}
        domains={domains}
        link={null}
        defaultCampaignId={defaultCampaignId}
        defaultUrl={defaultUrl}
      />
      <LinkForm
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        baseUrl={baseUrl}
        campaigns={campaigns}
        domains={domains}
        link={editing}
      />
      <DeleteLinkModal
        link={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={() => {
          setDeleting(null);
          router.refresh();
        }}
      />
      <BulkModal
        open={bulkOpen}
        onClose={() => {
          setBulkOpen(false);
          router.refresh();
        }}
        campaigns={campaigns}
      />
    </>
  );
}

function Pagination({ page, pages, filters }: { page: number; pages: number; filters: Filters }) {
  if (pages <= 1) return null;
  const numbers: number[] = [];
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const end = Math.min(pages, start + 4);
  for (let i = start; i <= end; i += 1) numbers.push(i);

  return (
    <div className="flex items-center gap-1">
      {page > 1 ? (
        <Link href={hrefWith(filters, {}, page - 1)} className="icon-btn h-7 w-7" aria-label="Previous page">
          <ChevronLeft size={15} />
        </Link>
      ) : (
        <span className="icon-btn h-7 w-7 pointer-events-none opacity-40">
          <ChevronLeft size={15} />
        </span>
      )}
      {numbers.map((number) => (
        <Link
          key={number}
          href={hrefWith(filters, {}, number)}
          className={cn(
            "flex h-7 min-w-7 items-center justify-center rounded-lg px-2 text-xs font-semibold transition",
            number === page ? "bg-brand/15 text-brand-ink" : "text-muted hover:bg-card2 hover:text-ink"
          )}
        >
          {number}
        </Link>
      ))}
      {page < pages ? (
        <Link href={hrefWith(filters, {}, page + 1)} className="icon-btn h-7 w-7" aria-label="Next page">
          <ChevronRight size={15} />
        </Link>
      ) : (
        <span className="icon-btn h-7 w-7 pointer-events-none opacity-40">
          <ChevronRight size={15} />
        </span>
      )}
    </div>
  );
}

function RowMenu({
  row,
  onEdit,
  onDelete,
  onChanged,
}: {
  row: LinkListItem;
  onEdit: () => void;
  onDelete: () => void;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(row.shortUrl);
    } catch {
      // clipboard can be blocked; the link stays visible for manual copy
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  async function toggle() {
    setBusy(true);
    try {
      await fetch(`/api/links/${row.id}/toggle`, { method: "POST" });
      onChanged();
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        className="icon-btn h-7 w-7"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Actions for /${row.code}`}
      >
        <MoreHorizontal size={16} />
      </button>
      {open ? (
        <div className="absolute right-0 top-8 z-40 w-48 rounded-xl border border-line bg-panel p-2 text-left shadow-2xl">
          <button
            type="button"
            onClick={copy}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted transition hover:bg-card2 hover:text-ink"
          >
            {copied ? <Check size={13} className="text-ok" /> : <Copy size={13} />} {copied ? "Copied" : "Copy short link"}
          </button>
          <Link
            href={`/app/links/${row.id}`}
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted transition hover:bg-card2 hover:text-ink"
          >
            <BarChart3 size={13} /> View analytics
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted transition hover:bg-card2 hover:text-ink"
          >
            <Pencil size={13} /> Edit link
          </button>
          <Link
            href={`/app/qrcodes?link=${row.id}`}
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted transition hover:bg-card2 hover:text-ink"
          >
            <QrCode size={13} /> Create QR code
          </Link>
          <button
            type="button"
            onClick={toggle}
            disabled={busy}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted transition hover:bg-card2 hover:text-ink"
          >
            {row.isActive ? <Pause size={13} /> : <Play size={13} />}
            {row.isActive ? "Pause link" : "Resume link"}
            {busy ? <Loader2 size={12} className="ml-auto animate-spin" /> : null}
          </button>
          <div className="my-1 border-t border-line" />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-bad transition hover:bg-bad/10"
          >
            <Trash2 size={13} /> Delete link
          </button>
        </div>
      ) : null}
    </div>
  );
}

function DeleteLinkModal({
  link,
  onClose,
  onDeleted,
}: {
  link: LinkListItem | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBusy(false);
    setError(null);
  }, [link]);

  async function remove() {
    if (!link) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/links/${link.id}`, { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not delete the link");
      onDeleted();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete the link");
      setBusy(false);
    }
  }

  return (
    <Modal
      open={Boolean(link)}
      onClose={onClose}
      title="Delete this link?"
      subtitle={link ? `/${link.code} → ${link.url}` : undefined}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={remove} disabled={busy}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Delete permanently
          </button>
        </>
      }
    >
      <p className="text-sm text-muted">
        This removes the redirect and all {formatNumber(link?.clicks ?? 0)} recorded clicks from your analytics. This action cannot be
        undone.
      </p>
      {error ? <div className="alert alert-error mt-4">{error}</div> : null}
    </Modal>
  );
}

interface BulkResult {
  created: Array<{ url: string; code: string; shortUrl: string }>;
  failed: Array<{ url: string; error: string }>;
}

function BulkModal({
  open,
  onClose,
  campaigns,
}: {
  open: boolean;
  onClose: () => void;
  campaigns: LinkFormCampaign[];
}) {
  const [text, setText] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkResult | null>(null);

  useEffect(() => {
    if (!open) return;
    setText("");
    setCampaignId("");
    setTags("");
    setBusy(false);
    setError(null);
    setResult(null);
  }, [open]);

  const lines = useMemo(() => text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean), [text]);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/links/bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, campaignId: campaignId || null, tags }),
      });
      const data = (await response.json().catch(() => ({}))) as BulkResult & { error?: string };
      if (!response.ok) throw new Error(data.error || "Bulk shorten failed");
      setResult({ created: data.created ?? [], failed: data.failed ?? [] });
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : "Bulk shorten failed");
    } finally {
      setBusy(false);
    }
  }

  const csv = result
    ? ["original_url,short_url", ...result.created.map((item) => `${item.url},${item.shortUrl}`)].join("\n")
    : "";

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={result ? "Bulk shorten complete" : "Bulk shorten links"}
      subtitle={result ? undefined : "Paste up to 50 URLs, one per line. Each gets a unique short link."}
      footer={
        result ? (
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={submit} disabled={busy || lines.length === 0}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              Shorten {lines.length > 0 ? `${lines.length} URL${lines.length === 1 ? "" : "s"}` : ""}
            </button>
          </>
        )
      }
    >
      {result ? (
        <div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-ok/25 bg-ok/10 p-3 text-center">
              <div className="font-display text-2xl font-bold text-ok">{result.created.length}</div>
              <div className="text-xs text-muted">links created</div>
            </div>
            <div className={cn("rounded-xl border p-3 text-center", result.failed.length ? "border-bad/25 bg-bad/10" : "border-line bg-card2")}>
              <div className={cn("font-display text-2xl font-bold", result.failed.length ? "text-bad" : "text-muted")}>
                {result.failed.length}
              </div>
              <div className="text-xs text-muted">failed</div>
            </div>
          </div>

          {result.created.length > 0 ? (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold">Created links</span>
                <CopyButton text={csv} label="Copy CSV" />
              </div>
              <div className="scroll-thin max-h-64 space-y-2 overflow-y-auto rounded-xl border border-line bg-card2 p-2">
                {result.created.map((item) => (
                  <div key={item.code} className="flex items-center gap-2 rounded-lg bg-panel px-3 py-2">
                    <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink">{item.shortUrl}</span>
                    <CopyButton text={item.shortUrl} className="!h-6 !w-6 !p-0" />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {result.failed.length > 0 ? (
            <div className="mt-4 space-y-2 rounded-xl border border-bad/20 bg-bad/5 p-3">
              {result.failed.map((item, index) => (
                <div key={`${item.url}-${index}`} className="text-xs">
                  <span className="break-all text-muted">{item.url}</span>
                  <span className="ml-2 text-bad">— {item.error}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div>
          <div className="field">
            <label className="label" htmlFor="bulk-urls">
              URLs
            </label>
            <textarea
              id="bulk-urls"
              className="textarea !min-h-48 font-mono !text-xs"
              placeholder={"https://example.com/page-one\nhttps://example.com/page-two\nexample.com/page-three"}
              value={text}
              onChange={(event) => setText(event.target.value)}
              spellCheck={false}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="bulk-campaign">
                Campaign
              </label>
              <select id="bulk-campaign" className="select" value={campaignId} onChange={(event) => setCampaignId(event.target.value)}>
                <option value="">No campaign</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="bulk-tags">
                Tags
              </label>
              <input id="bulk-tags" className="input" placeholder="import, q4" value={tags} onChange={(event) => setTags(event.target.value)} />
            </div>
          </div>
          <p className="hint mt-2">Aliases are generated automatically. Invalid URLs are reported and skipped.</p>
          {error ? <div className="alert alert-error mt-3">{error}</div> : null}
        </div>
      )}
    </Modal>
  );
}
