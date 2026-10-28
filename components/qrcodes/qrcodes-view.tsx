"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Download,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  QrCode as QrIcon,
  ScanLine,
  Trash2,
} from "@/components/icons";
import { Modal } from "@/components/modal";
import { EmptyState, PageHeader } from "@/components/ui";
import { cn, formatNumber, timeAgo } from "@/lib/utils";

export interface QrItem {
  id: string;
  linkId: string;
  name: string;
  fg: string;
  bg: string;
  margin: number;
  ecc: string;
  logo: string | null;
  scans: number;
  createdAt: number;
  code: string;
  title: string | null;
  shortUrl: string;
}

export interface QrLinkOption {
  id: string;
  code: string;
  title: string | null;
  shortUrl: string;
}

const FG_PRESETS = ["#04060a", "#111827", "#1b36b8", "#2f55f0", "#3f4a5f", "#7f1d1d", "#a86300"];
const BG_PRESETS = ["#ffffff", "#f8fafc", "#eef2ff", "#f2f7ea", "#fdf6e8"];

export function QrCodesView({
  codes,
  links,
  limit,
  baseUrl,
  openWithLink,
}: {
  codes: QrItem[];
  links: QrLinkOption[];
  limit: number;
  baseUrl: string;
  openWithLink?: string;
}) {
  const [creating, setCreating] = useState(Boolean(openWithLink));
  const [presetLink, setPresetLink] = useState(openWithLink ?? "");
  const [editing, setEditing] = useState<QrItem | null>(null);
  const [deleting, setDeleting] = useState<QrItem | null>(null);

  const totalScans = codes.reduce((sum, code) => sum + code.scans, 0);
  const atLimit = codes.length >= limit;

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="QR Codes"
        description="Branded, trackable QR codes for print, packaging and events. Every scan is attributed in analytics."
        actions={
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setCreating(true)}
            disabled={atLimit || links.length === 0}
            title={links.length === 0 ? "Create a link first" : undefined}
          >
            <Plus size={14} /> New QR code
          </button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card card-pad">
          <div className="stat-label">QR codes</div>
          <div className="stat-value mt-2">
            {codes.length}
            <span className="text-base font-normal text-muted"> / {limit}</span>
          </div>
          <div className="stat-sub mt-1">{atLimit ? "Plan limit reached — upgrade for more" : `${limit - codes.length} remaining`}</div>
        </div>
        <div className="card card-pad">
          <div className="stat-label">Total scans</div>
          <div className="stat-value mt-2">{formatNumber(totalScans)}</div>
          <div className="stat-sub mt-1">Attributed QR traffic</div>
        </div>
        <div className="card card-pad">
          <div className="stat-label">Most scanned</div>
          <div className="stat-value mt-2 truncate">{codes.slice().sort((a, b) => b.scans - a.scans)[0]?.name ?? "—"}</div>
          <div className="stat-sub mt-1">
            {codes.length ? `${formatNumber(codes.slice().sort((a, b) => b.scans - a.scans)[0]?.scans ?? 0)} scans` : "No codes yet"}
          </div>
        </div>
      </div>

      {codes.length === 0 ? (
        <div className="card p-8">
          <EmptyState
            icon={<QrIcon size={20} />}
            title="No QR codes yet"
            description="Pick one of your short links and we'll generate a scannable, branded QR code with full scan tracking."
            action={
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setCreating(true)}
                disabled={links.length === 0}
              >
                <Plus size={14} /> Create your first QR code
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {codes.map((code) => (
            <QrCard key={code.id} code={code} onEdit={() => setEditing(code)} onDelete={() => setDeleting(code)} />
          ))}
        </div>
      )}

      <p className="mt-4 flex items-center gap-2 text-xs text-muted">
        <ScanLine size={12} /> Scans are logged with device, location and unique-visitor detection, just like clicks.
      </p>

      <QrModal
        open={creating}
        onClose={() => setCreating(false)}
        links={links}
        qr={null}
        baseUrl={baseUrl}
        presetLink={presetLink}
      />
      <QrModal open={Boolean(editing)} onClose={() => setEditing(null)} links={links} qr={editing} baseUrl={baseUrl} />
      <DeleteQrModal code={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

function QrCard({ code, onEdit, onDelete }: { code: QrItem; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="card card-hover overflow-hidden">
      <div className="relative flex items-center justify-center border-b border-line bg-card2 p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/qrcodes/${code.id}/image`}
          alt={`QR code for ${code.name}`}
          className="h-36 w-36 rounded-lg bg-white object-contain shadow-lg"
          loading="lazy"
        />
        <div className="absolute right-2 top-2">
          <button type="button" className="icon-btn h-7 w-7" onClick={() => setOpen((value) => !value)} aria-label="QR actions">
            <MoreHorizontal size={16} />
          </button>
          {open ? (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-8 z-40 w-44 rounded-xl border border-line bg-panel p-2 text-left shadow-2xl">
                <a
                  href={`/api/qrcodes/${code.id}/image?download=1`}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted transition hover:bg-card2 hover:text-ink"
                >
                  <Download size={13} /> Download SVG
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onEdit();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted transition hover:bg-card2 hover:text-ink"
                >
                  <Pencil size={13} /> Edit design
                </button>
                <Link
                  href={`/app/links/${code.linkId}`}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted transition hover:bg-card2 hover:text-ink"
                >
                  <ScanLine size={13} /> Scan analytics
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
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
      <div className="p-4">
        <div className="truncate text-sm font-semibold">{code.name}</div>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="code-chip">/{code.code}</span>
          <span className="text-xs text-muted">{timeAgo(code.createdAt)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs text-muted">
            <ScanLine size={13} /> {formatNumber(code.scans)} scans
          </span>
          <a
            href={`/api/qrcodes/${code.id}/image?download=1`}
            className="btn btn-outline btn-sm"
            title="Download SVG"
          >
            <Download size={13} /> SVG
          </a>
        </div>
      </div>
    </div>
  );
}

function QrModal({
  open,
  onClose,
  links,
  qr,
  baseUrl,
  presetLink,
}: {
  open: boolean;
  onClose: () => void;
  links: QrLinkOption[];
  qr: QrItem | null;
  baseUrl: string;
  presetLink?: string;
}) {
  const router = useRouter();
  const [linkId, setLinkId] = useState("");
  const [name, setName] = useState("");
  const [fg, setFg] = useState(FG_PRESETS[0]);
  const [bg, setBg] = useState(BG_PRESETS[0]);
  const [margin, setMargin] = useState(2);
  const [ecc, setEcc] = useState("M");
  const [logo, setLogo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLinkId(qr?.linkId || presetLink || links[0]?.id || "");
    setName(qr?.name ?? "");
    setFg(qr?.fg ?? FG_PRESETS[0]);
    setBg(qr?.bg ?? BG_PRESETS[0]);
    setMargin(qr?.margin ?? 2);
    setEcc(qr?.ecc ?? "M");
    setLogo(qr?.logo ?? "");
    setBusy(false);
    setError(null);
  }, [open, qr, links, presetLink]);

  const selected = useMemo(() => {
    if (qr && linkId === qr.linkId) return { code: qr.code, shortUrl: qr.shortUrl };
    return links.find((link) => link.id === linkId) ?? null;
  }, [links, linkId, qr]);

  const previewUrl = useMemo(() => {
    if (!open || !selected) return "";
    const params = new URLSearchParams({
      code: selected.code,
      fg,
      bg,
      margin: String(margin),
      ecc,
    });
    if (logo.trim()) params.set("logo", logo.trim());
    return `/api/qrcodes/preview?${params.toString()}`;
  }, [open, selected, fg, bg, margin, ecc, logo]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!linkId) {
      setError("Choose a link to encode");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(qr ? `/api/qrcodes/${qr.id}` : "/api/qrcodes", {
        method: qr ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ linkId, name: name.trim() || "QR code", fg, bg, margin, ecc, logo }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not save the QR code");
      onClose();
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save the QR code");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={qr ? "Edit QR code" : "Design a QR code"}
      subtitle={qr ? `/${qr.code} · ${formatNumber(qr.scans)} scans so far` : "Live preview updates as you customize the design."}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="qr-form" className="btn btn-primary" disabled={busy || !linkId}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : qr ? <Pencil size={15} /> : <QrIcon size={15} />}
            {qr ? "Save design" : "Create QR code"}
          </button>
        </>
      }
    >
      <form id="qr-form" onSubmit={submit} className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <div>
          <div
            className="flex aspect-square items-center justify-center rounded-2xl border border-line p-4"
            style={{ background: bg }}
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="QR preview" className="h-full w-full object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-xs" style={{ color: fg, opacity: 0.6 }}>
                <QrIcon size={40} />
                Choose a link
              </div>
            )}
          </div>
          <p className="mt-2 text-center text-xs text-muted">
            Encodes <span className="font-mono">{selected ? `${baseUrl.replace(/^https?:\/\//, "")}/${selected.code}` : "—"}</span> with scan tracking.
          </p>
        </div>

        <div>
          <div className="field">
            <label className="label" htmlFor="qr-link">
              Link
            </label>
            <select
              id="qr-link"
              className="select"
              value={linkId}
              onChange={(event) => setLinkId(event.target.value)}
              disabled={Boolean(qr)}
            >
              {!links.some((link) => link.id === linkId) && qr ? <option value={qr.linkId}>/{qr.code}</option> : null}
              {links.map((link) => (
                <option key={link.id} value={link.id}>
                  /{link.code} {link.title ? `— ${link.title}` : ""}
                </option>
              ))}
            </select>
            {qr ? <p className="hint">The encoded link can’t change after the QR code is created.</p> : null}
          </div>

          <div className="field">
            <label className="label" htmlFor="qr-name">
              Name
            </label>
            <input
              id="qr-name"
              className="input"
              placeholder="Menu table tent"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={60}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="field">
              <span className="label">Foreground</span>
              <div className="flex flex-wrap items-center gap-2">
                {FG_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFg(color)}
                    className={cn("h-6 w-6 rounded-full border-2 transition", fg === color ? "border-ink scale-110" : "border-transparent")}
                    style={{ background: color }}
                    aria-label={`Foreground ${color}`}
                  />
                ))}
                <input
                  type="color"
                  value={fg}
                  onChange={(event) => setFg(event.target.value)}
                  className="h-6 w-8 cursor-pointer rounded border border-line bg-transparent"
                  aria-label="Custom foreground"
                />
              </div>
            </div>
            <div className="field">
              <span className="label">Background</span>
              <div className="flex flex-wrap items-center gap-2">
                {BG_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setBg(color)}
                    className={cn("h-6 w-6 rounded-full border-2 transition", bg === color ? "border-ink scale-110" : "border-line")}
                    style={{ background: color }}
                    aria-label={`Background ${color}`}
                  />
                ))}
                <input
                  type="color"
                  value={bg}
                  onChange={(event) => setBg(event.target.value)}
                  className="h-6 w-8 cursor-pointer rounded border border-line bg-transparent"
                  aria-label="Custom background"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="field">
              <label className="label" htmlFor="qr-margin">
                Quiet zone
              </label>
              <select id="qr-margin" className="select" value={margin} onChange={(event) => setMargin(Number(event.target.value))}>
                {[0, 1, 2, 3, 4, 6, 8].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="qr-ecc">
                Error correction
              </label>
              <select id="qr-ecc" className="select" value={ecc} onChange={(event) => setEcc(event.target.value)}>
                {["L", "M", "Q", "H"].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="qr-logo">
                Center label
              </label>
              <input
                id="qr-logo"
                className="input"
                placeholder="LS"
                value={logo}
                maxLength={6}
                onChange={(event) => setLogo(event.target.value)}
              />
            </div>
          </div>
          <p className="hint">Use error correction Q or H when adding a center label so the code stays scannable.</p>

          {error ? <div className="alert alert-error mt-3">{error}</div> : null}
        </div>
      </form>
    </Modal>
  );
}

function DeleteQrModal({ code, onClose }: { code: QrItem | null; onClose: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBusy(false);
    setError(null);
  }, [code]);

  async function remove() {
    if (!code) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/qrcodes/${code.id}`, { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not delete the QR code");
      onClose();
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete the QR code");
      setBusy(false);
    }
  }

  return (
    <Modal
      open={Boolean(code)}
      onClose={onClose}
      title="Delete QR code?"
      subtitle={code?.name}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={remove} disabled={busy}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Delete
          </button>
        </>
      }
    >
      <p className="text-sm text-muted">
        Existing printed codes stop working immediately. Scan history stays in analytics for the linked short link.
      </p>
      {error ? <div className="alert alert-error mt-4">{error}</div> : null}
    </Modal>
  );
}
