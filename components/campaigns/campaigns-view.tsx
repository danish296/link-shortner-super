"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Loader2, Megaphone, MoreHorizontal, Pencil, Plus, Trash2 } from "@/components/icons";
import { Modal } from "@/components/modal";
import { EmptyState, PageHeader, SectionCard } from "@/components/ui";
import { cn, formatNumber, timeAgo } from "@/lib/utils";

export interface CampaignItem {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: number;
  links: number;
  clicks: number;
}

const COLORS = ["#2f55f0", "#c9f94e", "#3ddc97", "#ffc53d", "#ff6b81", "#8fa6ff", "#233a8f", "#93a0b8"];

export function CampaignsView({
  campaigns,
  limit,
  usage,
}: {
  campaigns: CampaignItem[];
  limit: number;
  usage: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<CampaignItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<CampaignItem | null>(null);

  const totalLinks = campaigns.reduce((sum, item) => sum + item.links, 0);
  const totalClicks = campaigns.reduce((sum, item) => sum + item.clicks, 0);
  const atLimit = usage >= limit;

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Campaigns"
        description="Group links by channel or launch, then compare performance side by side."
        actions={
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setCreating(true)}
            disabled={atLimit}
            title={atLimit ? "Campaign limit reached on your plan" : undefined}
          >
            <Plus size={14} /> New campaign
          </button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card card-pad">
          <div className="stat-label">Campaigns</div>
          <div className="stat-value mt-2">
            {usage}
            <span className="text-base font-normal text-muted"> / {limit}</span>
          </div>
          <div className="stat-sub mt-1">{atLimit ? "Plan limit reached — upgrade for more" : `${limit - usage} remaining on your plan`}</div>
        </div>
        <div className="card card-pad">
          <div className="stat-label">Links in campaigns</div>
          <div className="stat-value mt-2">{formatNumber(totalLinks)}</div>
          <div className="stat-sub mt-1">Across all campaigns</div>
        </div>
        <div className="card card-pad">
          <div className="stat-label">Clicks attributed</div>
          <div className="stat-value mt-2">{formatNumber(totalClicks)}</div>
          <div className="stat-sub mt-1">Clicks on campaign links, all time</div>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="card p-8">
          <EmptyState
            icon={<Megaphone size={20} />}
            title="No campaigns yet"
            description="Create a campaign to organize links around a launch, channel or client."
            action={
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>
                <Plus size={14} /> Create campaign
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign) => (
            <SectionCard
              key={campaign.id}
              title={campaign.name}
              subtitle={campaign.description || "No description"}
              className="card-hover"
              action={<CampaignMenu campaign={campaign} onEdit={() => setEditing(campaign)} onDelete={() => setDeleting(campaign)} />}
            >
              <div className="mb-4 flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
                  style={{ background: campaign.color }}
                >
                  {campaign.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="text-xs text-muted">Created {timeAgo(campaign.created_at)}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-line bg-card2 px-3 py-2">
                  <div className="text-lg font-semibold">{formatNumber(campaign.links)}</div>
                  <div className="text-xs uppercase tracking-wider text-muted">links</div>
                </div>
                <div className="rounded-lg border border-line bg-card2 px-3 py-2">
                  <div className="text-lg font-semibold">{formatNumber(campaign.clicks)}</div>
                  <div className="text-xs uppercase tracking-wider text-muted">clicks</div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Link href={`/app/links?campaignId=${campaign.id}`} className="btn btn-outline btn-sm flex-1">
                  View links
                </Link>
                <Link href={`/app/links?new=1&campaign=${campaign.id}`} className="btn btn-primary btn-sm flex-1">
                  <Plus size={13} /> Add link
                </Link>
              </div>
              <Link
                href={`/app/analytics?campaign=${campaign.id}`}
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-ink hover:underline"
              >
                Campaign analytics <ArrowUpRight size={11} />
              </Link>
            </SectionCard>
          ))}
        </div>
      )}

      <CampaignModal open={creating} onClose={() => setCreating(false)} campaign={null} />
      <CampaignModal open={Boolean(editing)} onClose={() => setEditing(null)} campaign={editing} />
      <DeleteCampaignModal campaign={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

function CampaignMenu({
  campaign,
  onEdit,
  onDelete,
}: {
  campaign: CampaignItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" className="icon-btn h-7 w-7" onClick={() => setOpen((value) => !value)} aria-label="Campaign actions">
        <MoreHorizontal size={16} />
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-40 w-40 rounded-xl border border-line bg-panel p-2 text-left shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted transition hover:bg-card2 hover:text-ink"
            >
              <Pencil size={13} /> Edit
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-bad transition hover:bg-bad/10"
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </>
      ) : null}
      <span className="sr-only">{campaign.name}</span>
    </div>
  );
}

function CampaignModal({
  open,
  onClose,
  campaign,
}: {
  open: boolean;
  onClose: () => void;
  campaign: CampaignItem | null;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(campaign?.name ?? "");
    setDescription(campaign?.description ?? "");
    setColor(campaign?.color ?? COLORS[0]);
    setBusy(false);
    setError(null);
  }, [open, campaign]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(campaign ? `/api/campaigns/${campaign.id}` : "/api/campaigns", {
        method: campaign ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, description, color }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not save the campaign");
      onClose();
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save the campaign");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={campaign ? "Edit campaign" : "New campaign"}
      subtitle="Campaigns group links so you can compare channels and launches."
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="campaign-form" className="btn btn-primary" disabled={busy}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : campaign ? <Pencil size={15} /> : <Plus size={15} />}
            {campaign ? "Save changes" : "Create campaign"}
          </button>
        </>
      }
    >
      <form id="campaign-form" onSubmit={submit}>
        <div className="field">
          <label className="label" htmlFor="campaign-name">
            Name
          </label>
          <input
            id="campaign-name"
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Spring launch 2026"
            minLength={2}
            maxLength={60}
            required
            autoFocus
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="campaign-description">
            Description <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="campaign-description"
            className="textarea !min-h-20"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={200}
            placeholder="Instagram + email push for the new collection"
          />
        </div>
        <div className="field !mb-0">
          <span className="label">Accent color</span>
          <div className="flex flex-wrap items-center gap-2">
            {COLORS.map((swatch) => (
              <button
                key={swatch}
                type="button"
                onClick={() => setColor(swatch)}
                className={cn(
                  "h-7 w-7 rounded-full border-2 transition",
                  color === swatch ? "border-ink scale-110" : "border-transparent opacity-80 hover:opacity-100"
                )}
                style={{ background: swatch }}
                aria-label={`Use color ${swatch}`}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              className="h-7 w-9 cursor-pointer rounded border border-line bg-transparent"
              aria-label="Custom color"
            />
          </div>
        </div>
        {error ? <div className="alert alert-error mt-4">{error}</div> : null}
      </form>
    </Modal>
  );
}

function DeleteCampaignModal({ campaign, onClose }: { campaign: CampaignItem | null; onClose: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBusy(false);
    setError(null);
  }, [campaign]);

  async function remove() {
    if (!campaign) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}`, { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not delete the campaign");
      onClose();
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete the campaign");
      setBusy(false);
    }
  }

  return (
    <Modal
      open={Boolean(campaign)}
      onClose={onClose}
      title="Delete campaign?"
      subtitle={campaign?.name}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={remove} disabled={busy}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Delete campaign
          </button>
        </>
      }
    >
      <p className="text-sm text-muted">
        The {campaign?.links ?? 0} links in this campaign are kept and become uncategorized. Click history is not affected.
      </p>
      {error ? <div className="alert alert-error mt-4">{error}</div> : null}
    </Modal>
  );
}
