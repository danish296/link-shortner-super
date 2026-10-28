"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, ChevronDown, Globe, Link2, Loader2, Plus, ShieldCheck, Sparkles, Wand2 } from "@/components/icons";
import { Modal } from "@/components/modal";
import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";

export interface LinkFormCampaign {
  id: string;
  name: string;
  color: string;
}

export interface LinkFormDomain {
  id: string;
  hostname: string;
}

export interface LinkFormLink {
  id: string;
  code: string;
  shortUrl: string;
  url: string;
  title: string | null;
  tags: string[];
  campaignId: string | null;
  domainId: string | null;
  passwordProtected: boolean;
  expiresAt: number | null;
  maxClicks: number | null;
  isActive: boolean;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  pixelMeta: string | null;
  pixelGoogle: string | null;
  pixelTiktok: string | null;
  variantB: string | null;
  abWeight: number;
}

interface FormState {
  url: string;
  alias: string;
  title: string;
  tags: string;
  campaignId: string;
  domainId: string;
  password: string;
  expiresAt: string;
  maxClicks: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  pixelMeta: string;
  pixelGoogle: string;
  pixelTiktok: string;
  variantB: string;
  abWeight: string;
  isActive: boolean;
}

const EMPTY: FormState = {
  url: "",
  alias: "",
  title: "",
  tags: "",
  campaignId: "",
  domainId: "",
  password: "",
  expiresAt: "",
  maxClicks: "",
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  utmTerm: "",
  utmContent: "",
  pixelMeta: "",
  pixelGoogle: "",
  pixelTiktok: "",
  variantB: "",
  abWeight: "50",
  isActive: true,
};

const ALIAS_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";

function randomAlias(length = 7): string {
  let out = "";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i += 1) out += ALIAS_ALPHABET[bytes[i] % ALIAS_ALPHABET.length];
  return out;
}

function toLocalInput(ts: number | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLink(link: LinkFormLink): FormState {
  return {
    url: link.url,
    alias: link.code,
    title: link.title ?? "",
    tags: link.tags.join(", "),
    campaignId: link.campaignId ?? "",
    domainId: link.domainId ?? "",
    password: "",
    expiresAt: toLocalInput(link.expiresAt),
    maxClicks: link.maxClicks ? String(link.maxClicks) : "",
    utmSource: link.utmSource ?? "",
    utmMedium: link.utmMedium ?? "",
    utmCampaign: link.utmCampaign ?? "",
    utmTerm: link.utmTerm ?? "",
    utmContent: link.utmContent ?? "",
    pixelMeta: link.pixelMeta ?? "",
    pixelGoogle: link.pixelGoogle ?? "",
    pixelTiktok: link.pixelTiktok ?? "",
    variantB: link.variantB ?? "",
    abWeight: String(link.abWeight ?? 50),
    isActive: link.isActive,
  };
}

function hasAdvanced(state: FormState): boolean {
  return Boolean(
    state.password ||
      state.expiresAt ||
      state.maxClicks ||
      state.utmSource ||
      state.utmMedium ||
      state.utmCampaign ||
      state.utmTerm ||
      state.utmContent ||
      state.pixelMeta ||
      state.pixelGoogle ||
      state.pixelTiktok ||
      state.variantB
  );
}

export function LinkForm({
  open,
  onClose,
  baseUrl,
  campaigns,
  domains,
  link,
  defaultCampaignId,
  defaultUrl,
}: {
  open: boolean;
  onClose: () => void;
  baseUrl: string;
  campaigns: LinkFormCampaign[];
  domains: LinkFormDomain[];
  link?: LinkFormLink | null;
  defaultCampaignId?: string;
  defaultUrl?: string;
}) {
  const router = useRouter();
  const editing = Boolean(link);
  const [state, setState] = useState<FormState>(EMPTY);
  const [advanced, setAdvanced] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ shortUrl: string; code: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    const next = link ? fromLink(link) : { ...EMPTY, url: defaultUrl ?? "", campaignId: defaultCampaignId ?? "" };
    setState(next);
    setAdvanced(link ? hasAdvanced(next) : false);
    setBusy(false);
    setError(null);
    setCreated(null);
  }, [open, link, defaultCampaignId, defaultUrl]);

  const host = useMemo(() => {
    const selected = domains.find((domain) => domain.id === state.domainId);
    if (selected) return selected.hostname;
    try {
      return new URL(baseUrl).host;
    } catch {
      return baseUrl.replace(/^https?:\/\//, "");
    }
  }, [baseUrl, domains, state.domainId]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);

    const payload: Record<string, unknown> = {
      url: state.url.trim(),
      alias: state.alias.trim() || undefined,
      title: state.title.trim(),
      tags: state.tags,
      campaignId: state.campaignId || null,
      domainId: state.domainId || null,
      expiresAt: state.expiresAt ? new Date(state.expiresAt).getTime() : null,
      maxClicks: state.maxClicks ? Number(state.maxClicks) : null,
      utmSource: state.utmSource,
      utmMedium: state.utmMedium,
      utmCampaign: state.utmCampaign,
      utmTerm: state.utmTerm,
      utmContent: state.utmContent,
      variantB: state.variantB,
      abWeight: Number(state.abWeight) || 50,
      isActive: state.isActive,
    };

    if (!editing) {
      payload.password = state.password;
      payload.pixelMeta = state.pixelMeta;
      payload.pixelGoogle = state.pixelGoogle;
      payload.pixelTiktok = state.pixelTiktok;
    } else {
      if (state.password.trim()) payload.password = state.password;
      if (state.pixelMeta !== (link?.pixelMeta ?? "")) payload.pixelMeta = state.pixelMeta;
      if (state.pixelGoogle !== (link?.pixelGoogle ?? "")) payload.pixelGoogle = state.pixelGoogle;
      if (state.pixelTiktok !== (link?.pixelTiktok ?? "")) payload.pixelTiktok = state.pixelTiktok;
    }

    try {
      const response = await fetch(editing ? `/api/links/${link?.id}` : "/api/links", {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        link?: { shortUrl: string; code: string };
      };
      if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");

      if (editing) {
        router.refresh();
        onClose();
        return;
      }

      if (data.link) {
        setCreated({ shortUrl: data.link.shortUrl, code: data.link.code });
        router.refresh();
      } else {
        onClose();
        router.refresh();
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={editing ? "Edit short link" : "Create a short link"}
      subtitle={
        editing
          ? `Editing /${link?.code} — changes apply instantly to every existing share.`
          : "Shorten a URL, then fine-tune where it sends and how it is tracked."
      }
      footer={
        created ? null : (
          <>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" form="link-form" className="btn btn-primary" disabled={busy}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : editing ? <Sparkles size={15} /> : <Plus size={15} />}
              {editing ? "Save changes" : "Shorten link"}
            </button>
          </>
        )
      }
    >
      {created ? (
        <div className="py-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ok/15 text-ok">
            <Link2 size={22} />
          </div>
          <h3 className="mt-4 font-display text-lg font-semibold">Your link is live</h3>
          <p className="mt-1 text-xs text-muted">Share it anywhere — every click is tracked in real time.</p>
          <div className="mx-auto mt-4 flex max-w-md items-center gap-2 rounded-xl border border-line bg-card2 p-2 pl-3">
            <span className="min-w-0 flex-1 truncate text-left font-mono text-sm text-ink">{created.shortUrl}</span>
            <CopyButton text={created.shortUrl} label="Copy" />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                setCreated(null);
                setState((current) => ({ ...EMPTY, campaignId: current.campaignId }));
              }}
            >
              <Plus size={14} /> Create another
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                onClose();
                router.refresh();
              }}
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <form id="link-form" onSubmit={submit}>
          <div className="field">
            <label className="label" htmlFor="link-url">
              Destination URL
            </label>
            <div className="relative">
              <Link2 size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                id="link-url"
                className="input pl-10"
                placeholder="https://example.com/landing-page"
                value={state.url}
                onChange={(event) => set("url", event.target.value)}
                required
                autoFocus
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="field">
              <label className="label" htmlFor="link-alias">
                Short link
              </label>
              <div className="flex items-stretch overflow-hidden rounded-xl border border-line bg-[var(--input-bg)] focus-within:border-brand/60 focus-within:ring-4 focus-within:ring-brand/10">
                <span className="flex max-w-[45%] shrink-0 items-center gap-1 border-r border-line px-3 text-xs text-muted">
                  <Globe size={11} className="shrink-0" />
                  <span className="truncate font-mono">{host}/</span>
                </span>
                <input
                  id="link-alias"
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-ink outline-none placeholder:text-muted/70"
                  placeholder="auto-generated"
                  value={state.alias}
                  onChange={(event) => set("alias", event.target.value.replace(/\s/g, ""))}
                  pattern="[a-zA-Z0-9_-]{3,32}"
                  title="3–32 characters: letters, numbers, - or _"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  className="flex shrink-0 items-center gap-1 border-l border-line px-3 text-xs font-medium text-muted transition hover:bg-card2 hover:text-ink"
                  onClick={() => set("alias", randomAlias())}
                  title="Generate a random alias"
                >
                  <Wand2 size={12} /> Random
                </button>
              </div>
              <p className="hint">Letters, numbers, dashes and underscores. Leave empty to auto-generate.</p>
            </div>

            <div className="field">
              <label className="label" htmlFor="link-campaign">
                Campaign
              </label>
              <select
                id="link-campaign"
                className="select"
                value={state.campaignId}
                onChange={(event) => set("campaignId", event.target.value)}
              >
                <option value="">No campaign</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
              <p className="hint">Group links to compare performance.</p>
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="link-title">
              Title <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="link-title"
              className="input"
              placeholder="Spring launch — Instagram bio"
              value={state.title}
              onChange={(event) => set("title", event.target.value)}
              maxLength={120}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="field">
              <label className="label" htmlFor="link-tags">
                Tags
              </label>
              <input
                id="link-tags"
                className="input"
                placeholder="social, launch"
                value={state.tags}
                onChange={(event) => set("tags", event.target.value)}
              />
              <p className="hint">Comma separated.</p>
            </div>
            <div className="field">
              <label className="label" htmlFor="link-domain">
                Domain
              </label>
              <select
                id="link-domain"
                className="select"
                value={state.domainId}
                onChange={(event) => set("domainId", event.target.value)}
                disabled={domains.length === 0}
              >
                <option value="">Default domain</option>
                {domains.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.hostname}
                  </option>
                ))}
              </select>
              <p className="hint">{domains.length === 0 ? "Connect a custom domain to use one." : "Use a verified brand domain."}</p>
            </div>
          </div>

          {editing ? (
            <div className="mb-4 flex items-center justify-between rounded-xl border border-line bg-card2 px-3 py-3">
              <div>
                <div className="text-xs font-semibold">Link is {state.isActive ? "active" : "paused"}</div>
                <div className="text-xs text-muted">Paused links stop redirecting but keep their history.</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={state.isActive}
                className={cn("switch", state.isActive && "on")}
                onClick={() => set("isActive", !state.isActive)}
              />
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setAdvanced((value) => !value)}
            className="mb-3 flex w-full items-center justify-between rounded-xl border border-line bg-card2 px-3 py-3 text-xs font-semibold transition hover:border-line-strong"
            aria-expanded={advanced}
          >
            <span className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-brand-ink" /> Advanced options
              <span className="font-normal text-muted">passwords · expiry · UTM · A/B · pixels</span>
            </span>
            <ChevronDown size={15} className={cn("text-muted transition", advanced && "rotate-180")} />
          </button>

          {advanced ? (
            <div className="space-y-4 rounded-xl border border-line bg-card2 p-4">
              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Access &amp; limits</div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="label" htmlFor="link-password">
                      Password
                    </label>
                    <input
                      id="link-password"
                      type="password"
                      className="input"
                      placeholder={editing && link?.passwordProtected ? "Leave empty to keep" : "Optional"}
                      value={state.password}
                      onChange={(event) => set("password", event.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="link-expiry">
                      Expires
                    </label>
                    <input
                      id="link-expiry"
                      type="datetime-local"
                      className="input"
                      value={state.expiresAt}
                      onChange={(event) => set("expiresAt", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="link-max-clicks">
                      Click limit
                    </label>
                    <input
                      id="link-max-clicks"
                      type="number"
                      min={1}
                      max={1000000}
                      className="input"
                      placeholder="Unlimited"
                      value={state.maxClicks}
                      onChange={(event) => set("maxClicks", event.target.value)}
                    />
                  </div>
                </div>
                {editing && link?.passwordProtected ? (
                  <p className="hint">This link is password protected. Enter a new password to replace it.</p>
                ) : null}
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
                  <CalendarClock size={12} /> UTM parameters
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {(
                    [
                      ["utmSource", "utm_source", "instagram"],
                      ["utmMedium", "utm_medium", "social"],
                      ["utmCampaign", "utm_campaign", "spring_launch"],
                      ["utmTerm", "utm_term", "keyword"],
                      ["utmContent", "utm_content", "story_cta"],
                    ] as const
                  ).map(([key, label, placeholder]) => (
                    <div key={key} className={key === "utmSource" ? "col-span-2 sm:col-span-1" : ""}>
                      <label className="label font-mono !text-xs" htmlFor={`link-${key}`}>
                        {label}
                      </label>
                      <input
                        id={`link-${key}`}
                        className="input"
                        placeholder={placeholder}
                        value={state[key]}
                        onChange={(event) => set(key, event.target.value)}
                        spellCheck={false}
                      />
                    </div>
                  ))}
                </div>
                <p className="hint">Appended to the destination URL when someone clicks, without touching your share link.</p>
              </div>

              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">A/B split test</div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_150px]">
                  <div>
                    <label className="label" htmlFor="link-variant-b">
                      Variant B URL
                    </label>
                    <input
                      id="link-variant-b"
                      className="input"
                      placeholder="https://example.com/alternative-landing"
                      value={state.variantB}
                      onChange={(event) => set("variantB", event.target.value)}
                      spellCheck={false}
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="link-ab-weight">
                      Variant B traffic · {state.abWeight}%
                    </label>
                    <input
                      id="link-ab-weight"
                      type="range"
                      min={1}
                      max={99}
                      value={state.abWeight}
                      onChange={(event) => set("abWeight", event.target.value)}
                      className="h-9 w-full accent-brand"
                    />
                  </div>
                </div>
                <p className="hint">Visitors are assigned randomly. Split performance appears in link analytics.</p>
              </div>

              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Retargeting pixels</div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {(
                    [
                      ["pixelMeta", "Meta pixel ID"],
                      ["pixelGoogle", "Google Ads label"],
                      ["pixelTiktok", "TikTok pixel ID"],
                    ] as const
                  ).map(([key, placeholder]) => (
                    <div key={key}>
                      <label className="label" htmlFor={`link-${key}`}>
                        {placeholder}
                      </label>
                      <input
                        id={`link-${key}`}
                        className="input font-mono !text-xs"
                        placeholder="Optional"
                        value={state[key]}
                        onChange={(event) => set(key, event.target.value)}
                        spellCheck={false}
                      />
                    </div>
                  ))}
                </div>
                <p className="hint">A brief branded interstitial fires the pixel before forwarding the visitor.</p>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="alert alert-error mt-4" role="alert">
              <span>{error}</span>
              {error.toLowerCase().includes("plan") ? (
                <a href="/app/billing" className="ml-1 font-semibold underline">
                  View plans
                </a>
              ) : null}
            </div>
          ) : null}

          {!editing ? <p className="mt-3 text-center text-xs text-muted">Your destination is validated — only http and https URLs are accepted.</p> : null}
        </form>
      )}
    </Modal>
  );
}
