"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pause, Pencil, Play, Trash2 } from "@/components/icons";
import type { LinkListItem } from "./links-view";
import type { LinkFormCampaign, LinkFormDomain } from "./link-form";
import { LinkForm } from "./link-form";
import { Modal } from "@/components/modal";

export function LinkDetailActions({
  link,
  campaigns,
  domains,
  baseUrl,
}: {
  link: LinkListItem;
  campaigns: LinkFormCampaign[];
  domains: LinkFormDomain[];
  baseUrl: string;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setToggling(true);
    try {
      await fetch(`/api/links/${link.id}/toggle`, { method: "POST" });
      router.refresh();
    } finally {
      setToggling(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/links/${link.id}`, { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not delete the link");
      router.push("/app/links");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete the link");
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="btn btn-outline btn-sm" onClick={toggle} disabled={toggling}>
        {toggling ? <Loader2 size={14} className="animate-spin" /> : link.isActive ? <Pause size={14} /> : <Play size={14} />}
        {link.isActive ? "Pause" : "Resume"}
      </button>
      <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditOpen(true)}>
        <Pencil size={14} /> Edit
      </button>
      <button type="button" className="icon-btn !border-line" onClick={() => setDeleteOpen(true)} aria-label="Delete link">
        <Trash2 size={15} />
      </button>

      <LinkForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        baseUrl={baseUrl}
        campaigns={campaigns}
        domains={domains}
        link={link}
      />

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this link?"
        subtitle={`/${link.code} → ${link.url}`}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setDeleteOpen(false)} disabled={busy}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" onClick={remove} disabled={busy}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Delete permanently
            </button>
          </>
        }
      >
        <p className="text-sm text-muted">
          The redirect stops working immediately and every recorded click is removed from analytics. This cannot be undone.
        </p>
        {error ? <div className="alert alert-error mt-4">{error}</div> : null}
      </Modal>
    </>
  );
}
