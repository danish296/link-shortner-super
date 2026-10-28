"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, ExternalLink, Eye, Link2, Loader2, MoreHorizontal, PanelsTopLeft, Pencil, Plus, Trash2 } from "@/components/icons";
import { Modal } from "@/components/modal";
import { CopyButton } from "@/components/copy-button";
import { EmptyState, PageHeader } from "@/components/ui";
import { cn, formatNumber, timeAgo } from "@/lib/utils";

export interface PageItem {
  id: string;
  slug: string;
  title: string;
  bio: string | null;
  avatar: string | null;
  theme: string;
  accent: string;
  isPublished: boolean;
  views: number;
  blocks: number;
  blockClicks: number;
  updatedAt: number;
  publicUrl: string;
}

export const THEMES = [
  { id: "midnight", label: "Midnight" },
  { id: "aurora", label: "Aurora" },
  { id: "sunset", label: "Sunset" },
  { id: "ocean", label: "Ocean" },
  { id: "mono", label: "Mono" },
  { id: "candy", label: "Candy" },
];

export const ACCENTS = ["#2f55f0", "#1b36b8", "#0e9f6e", "#0f766e", "#a86300", "#cf2f4d", "#233a8f", "#475569"];

export function PagesView({ pages, limit, usage }: { pages: PageItem[]; limit: number; usage: number }) {
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<PageItem | null>(null);

  const atLimit = usage >= limit;
  const totalViews = pages.reduce((sum, page) => sum + page.views, 0);
  const totalClicks = pages.reduce((sum, page) => sum + page.blockClicks, 0);

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Bio Pages"
        description="A link in bio page that matches your brand, hosted at /p/your-name with per-button click tracking."
        actions={
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setCreating(true)}
            disabled={atLimit}
            title={atLimit ? "Bio page limit reached on your plan" : undefined}
          >
            <Plus size={14} /> New page
          </button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card card-pad">
          <div className="stat-label">Bio pages</div>
          <div className="stat-value mt-2">
            {usage}
            <span className="text-base font-normal text-muted"> / {limit}</span>
          </div>
          <div className="stat-sub mt-1">{atLimit ? "Plan limit reached — upgrade for more" : `${limit - usage} remaining`}</div>
        </div>
        <div className="card card-pad">
          <div className="stat-label">Page views</div>
          <div className="stat-value mt-2">{formatNumber(totalViews)}</div>
          <div className="stat-sub mt-1">Across all live pages</div>
        </div>
        <div className="card card-pad">
          <div className="stat-label">Button clicks</div>
          <div className="stat-value mt-2">{formatNumber(totalClicks)}</div>
          <div className="stat-sub mt-1">Tracked through the redirect layer</div>
        </div>
      </div>

      {pages.length === 0 ? (
        <div className="card p-8">
          <EmptyState
            icon={<PanelsTopLeft size={20} />}
            title="No bio pages yet"
            description="Create a mobile first page for your social bios, with buttons that track every tap."
            action={
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>
                <Plus size={14} /> Create a bio page
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pages.map((page) => (
            <div key={page.id} className="card card-hover overflow-hidden">
              <div className={cn("relative flex h-32 items-end p-4", `page-theme-${page.theme}`)}>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white shadow-lg"
                  style={{ background: page.accent }}
                >
                  {page.avatar || page.title.slice(0, 2).toUpperCase()}
                </div>
                <div className="ml-3 min-w-0 flex-1 pb-0.5">
                  <div className="truncate text-sm font-semibold">{page.title}</div>
                  <div className="truncate text-xs opacity-70">/p/{page.slug}</div>
                </div>
                <span className={cn("badge mb-1 shrink-0", page.isPublished ? "badge-ok" : "badge-muted")}>
                  {page.isPublished ? "Live" : "Paused"}
                </span>
              </div>
              <div className="p-4">
                <p className="line-clamp-2 min-h-8 text-xs text-muted">{page.bio || "No bio yet"}</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg border border-line bg-card2 py-2">
                    <div className="text-sm font-semibold">{formatNumber(page.views)}</div>
                    <div className="text-xs uppercase tracking-wider text-muted">views</div>
                  </div>
                  <div className="rounded-lg border border-line bg-card2 py-2">
                    <div className="text-sm font-semibold">{page.blocks}</div>
                    <div className="text-xs uppercase tracking-wider text-muted">blocks</div>
                  </div>
                  <div className="rounded-lg border border-line bg-card2 py-2">
                    <div className="text-sm font-semibold">{formatNumber(page.blockClicks)}</div>
                    <div className="text-xs uppercase tracking-wider text-muted">clicks</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Link href={`/app/pages/${page.id}`} className="btn btn-primary btn-sm flex-1">
                    <Pencil size={13} /> Edit page
                  </Link>
                  <CopyButton text={page.publicUrl} className="!px-2" />
                  <a
                    href={`/p/${page.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="icon-btn !border-line h-8 w-8"
                    aria-label="Open public page"
                  >
                    <ExternalLink size={14} />
                  </a>
                  <PageMenu page={page} onDelete={() => setDeleting(page)} />
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                  <Eye size={11} /> Updated {timeAgo(page.updatedAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <NewPageModal open={creating} onClose={() => setCreating(false)} />
      <DeletePageModal page={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

function PageMenu({ page, onDelete }: { page: PageItem; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" className="icon-btn !border-line h-8 w-8" onClick={() => setOpen((value) => !value)} aria-label="Page actions">
        <MoreHorizontal size={15} />
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-40 w-44 rounded-xl border border-line bg-panel p-2 text-left shadow-2xl">
            <Link
              href={`/app/analytics?page=${page.id}`}
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted transition hover:bg-card2 hover:text-ink"
            >
              <BarChart3 size={13} /> Page analytics
            </Link>
            <Link
              href={`/app/links?q=${encodeURIComponent(page.slug)}`}
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted transition hover:bg-card2 hover:text-ink"
            >
              <Link2 size={13} /> Related links
            </Link>
            <div className="my-1 border-t border-line" />
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-bad transition hover:bg-bad/10"
            >
              <Trash2 size={13} /> Delete page
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function NewPageModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [theme, setTheme] = useState("midnight");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setSlug("");
    setTheme("midnight");
    setBusy(false);
    setError(null);
  }, [open]);

  function autoSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/pages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, slug: slug || autoSlug(title), theme }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; id?: string };
      if (response.status === 402) throw new Error(data.error || "You've reached the bio page limit on your plan");
      if (!response.ok || !data.id) throw new Error(data.error || "Could not create the page");
      router.push(`/app/pages/${data.id}`);
      router.refresh();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create the page");
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New bio page"
      subtitle="Pick a name and theme — you can customize everything next."
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="new-page-form" className="btn btn-primary" disabled={busy}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Create page
          </button>
        </>
      }
    >
      <form id="new-page-form" onSubmit={submit}>
        <div className="field">
          <label className="label" htmlFor="page-title">
            Page title
          </label>
          <input
            id="page-title"
            className="input"
            placeholder="Alex Morgan"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (!slug) setSlug(autoSlug(event.target.value));
            }}
            minLength={2}
            maxLength={80}
            required
            autoFocus
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="page-slug">
            Page URL
          </label>
          <div className="flex items-stretch overflow-hidden rounded-xl border border-line bg-[var(--input-bg)] focus-within:border-brand/60">
            <span className="flex shrink-0 items-center border-r border-line px-3 font-mono text-xs text-muted">/p/</span>
            <input
              id="page-slug"
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none"
              placeholder="alexmorgan"
              value={slug}
              onChange={(event) => setSlug(autoSlug(event.target.value))}
              minLength={3}
              maxLength={40}
              spellCheck={false}
            />
          </div>
          <p className="hint">Lowercase letters, numbers and dashes. Must be unique.</p>
        </div>
        <div>
          <span className="label">Theme</span>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setTheme(option.id)}
                className={cn(
                  "flex h-14 flex-col justify-between rounded-lg border p-2 text-left transition",
                  `page-theme-${option.id}`,
                  theme === option.id ? "border-brand ring-2 ring-brand/30" : "border-line hover:border-line-strong"
                )}
              >
                <span className="text-xs font-semibold">{option.label}</span>
                <span className="flex gap-1">
                  <span className="h-1.5 w-6 rounded-full bg-current opacity-40" />
                  <span className="h-1.5 w-4 rounded-full bg-current opacity-25" />
                </span>
              </button>
            ))}
          </div>
        </div>
        {error ? <div className="alert alert-error mt-3">{error}</div> : null}
      </form>
    </Modal>
  );
}

function DeletePageModal({ page, onClose }: { page: PageItem | null; onClose: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBusy(false);
    setError(null);
  }, [page]);

  async function remove() {
    if (!page) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/pages/${page.id}`, { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not delete the page");
      onClose();
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete the page");
      setBusy(false);
    }
  }

  return (
    <Modal
      open={Boolean(page)}
      onClose={onClose}
      title="Delete bio page?"
      subtitle={page ? `/p/${page.slug}` : undefined}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={remove} disabled={busy}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Delete page
          </button>
        </>
      }
    >
      <p className="text-sm text-muted">The public URL stops working and block click records are deleted. This cannot be undone.</p>
      {error ? <div className="alert alert-error mt-4">{error}</div> : null}
    </Modal>
  );
}
