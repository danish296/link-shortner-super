"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  ExternalLink,
  Globe2,
  Heading2,
  Link2,
  Loader2,
  Save,
  Share2,
  Trash2,
  Type,
} from "@/components/icons";
import { ACCENTS, THEMES } from "./pages-view";
import { CopyButton } from "@/components/copy-button";
import { PageHeader, SectionCard } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface EditorPage {
  id: string;
  slug: string;
  title: string;
  bio: string | null;
  avatar: string | null;
  theme: string;
  accent: string;
  isPublished: boolean;
  views: number;
}

export interface EditorBlock {
  id?: string;
  type: "link" | "social" | "heading" | "text";
  title: string;
  subtitle: string;
  url: string;
}

interface EditableBlock extends EditorBlock {
  key: string;
}

let blockSeq = 0;
function nextKey(): string {
  blockSeq += 1;
  return `new-${blockSeq}-${Date.now().toString(36)}`;
}

function toEditable(blocks: EditorBlock[]): EditableBlock[] {
  return blocks.map((block, index) => ({ ...block, key: block.id ?? `idx-${index}-${nextKey()}` }));
}

function payload(blocks: EditableBlock[]): EditorBlock[] {
  return blocks.map((block) => ({
    id: block.id,
    type: block.type,
    title: block.title,
    subtitle: block.subtitle,
    url: block.type === "link" || block.type === "social" ? block.url : "",
  }));
}

const BLOCK_META = {
  link: { label: "Link button", icon: Link2 },
  social: { label: "Social button", icon: Share2 },
  heading: { label: "Heading", icon: Heading2 },
  text: { label: "Text block", icon: Type },
} as const;

export function PageEditor({ page, blocks, baseUrl }: { page: EditorPage; blocks: EditorBlock[]; baseUrl: string }) {
  const router = useRouter();
  const [title, setTitle] = useState(page.title);
  const [slug, setSlug] = useState(page.slug);
  const [bio, setBio] = useState(page.bio ?? "");
  const [avatar, setAvatar] = useState(page.avatar ?? "");
  const [theme, setTheme] = useState(page.theme);
  const [accent, setAccent] = useState(page.accent);
  const [isPublished, setIsPublished] = useState(page.isPublished);
  const [items, setItems] = useState<EditableBlock[]>(() => toEditable(blocks));
  const [snapshot, setSnapshot] = useState(() =>
    JSON.stringify({ title: page.title, slug: page.slug, bio: page.bio ?? "", avatar: page.avatar ?? "", theme: page.theme, accent: page.accent, isPublished: page.isPublished, blocks: payload(toEditable(blocks)) })
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const current = JSON.stringify({ title, slug, bio, avatar, theme, accent, isPublished, blocks: payload(items) });
  const dirty = current !== snapshot;
  const publicUrl = `${baseUrl}/p/${slug}`;

  function updateItem(key: string, patch: Partial<EditableBlock>) {
    setItems((list) => list.map((item) => (item.key === key ? { ...item, ...patch } : item)));
    setSaved(false);
  }

  function move(key: string, direction: -1 | 1) {
    setItems((list) => {
      const index = list.findIndex((item) => item.key === key);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= list.length) return list;
      const next = list.slice();
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setSaved(false);
  }

  function addBlock(type: EditorBlock["type"]) {
    setItems((list) => [
      ...list,
      {
        key: nextKey(),
        type,
        title: type === "heading" ? "New heading" : type === "text" ? "" : type === "social" ? "Instagram" : "My link",
        subtitle: "",
        url: "",
      },
    ]);
    setSaved(false);
  }

  function removeBlock(key: string) {
    setItems((list) => list.filter((item) => item.key !== key));
    setSaved(false);
  }

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const response = await fetch(`/api/pages/${page.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          bio,
          avatar,
          theme,
          accent,
          isPublished,
          blocks: payload(items),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; slug?: string };
      if (!response.ok) throw new Error(data.error || "Could not save the page");
      if (data.slug) setSlug(data.slug);
      setSnapshot(
        JSON.stringify({
          title,
          slug: data.slug ?? slug,
          bio,
          avatar,
          theme,
          accent,
          isPublished,
          blocks: payload(items),
        })
      );
      setSaved(true);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save the page");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Link href="/app/pages" className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-muted transition hover:text-ink">
        <ArrowLeft size={14} /> All bio pages
      </Link>

      <PageHeader
        eyebrow={isPublished ? "Published" : "Draft · hidden from visitors"}
        title="Edit bio page"
        description={`Live at ${publicUrl.replace(/^https?:\/\//, "")} · ${page.views.toLocaleString()} lifetime views`}
        actions={
          <>
            <a href={`/p/${slug}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
              <ExternalLink size={14} /> Open page
            </a>
            <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={busy || !dirty}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {dirty ? "Save changes" : saved ? "Saved" : "No changes"}
            </button>
          </>
        }
      />

      {error ? <div className="alert alert-error mb-4">{error}</div> : null}
      {saved && !dirty ? <div className="alert alert-ok mb-4">Page saved. Changes are already live.</div> : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <SectionCard title="Profile" subtitle="The identity at the top of your page">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[110px_1fr]">
              <div className="sm:col-span-2">
                <div className="field">
                  <label className="label" htmlFor="editor-title">
                    Page title
                  </label>
                  <input
                    id="editor-title"
                    className="input"
                    value={title}
                    maxLength={80}
                    onChange={(event) => {
                      setTitle(event.target.value);
                      setSaved(false);
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="editor-avatar">
                  Avatar
                </label>
                <input
                  id="editor-avatar"
                  className="input text-center font-semibold uppercase"
                  value={avatar}
                  maxLength={3}
                  placeholder="AM"
                  onChange={(event) => {
                    setAvatar(event.target.value.toUpperCase());
                    setSaved(false);
                  }}
                />
                <p className="hint">Up to 3 letters.</p>
              </div>
              <div>
                <label className="label" htmlFor="editor-bio">
                  Bio
                </label>
                <textarea
                  id="editor-bio"
                  className="textarea !min-h-20"
                  value={bio}
                  maxLength={300}
                  placeholder="Designer, builder. Making the web a little nicer."
                  onChange={(event) => {
                    setBio(event.target.value);
                    setSaved(false);
                  }}
                />
              </div>
            </div>

            <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="editor-slug">
                  Page URL
                </label>
                <div className="flex items-stretch overflow-hidden rounded-xl border border-line bg-[var(--input-bg)] focus-within:border-brand/60">
                  <span className="flex shrink-0 items-center border-r border-line px-3 font-mono text-xs text-muted">/p/</span>
                  <input
                    id="editor-slug"
                    className="min-w-0 flex-1 bg-transparent px-3 py-3 font-mono text-sm outline-none"
                    value={slug}
                    maxLength={40}
                    onChange={(event) => {
                      setSlug(
                        event.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, "-")
                          .replace(/^-+|-+$/g, "")
                      );
                      setSaved(false);
                    }}
                  />
                </div>
              </div>
              <div className="flex items-end gap-2 pb-0.5">
                <CopyButton text={publicUrl} label="Copy URL" />
                <a href={`/p/${slug}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                  <Globe2 size={14} /> Preview
                </a>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Design" subtitle="Themes and accent color">
            <span className="label">Theme preset</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {THEMES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setTheme(option.id);
                    setSaved(false);
                  }}
                  className={cn(
                    "flex h-16 flex-col justify-between rounded-xl border p-3 text-left transition",
                    `page-theme-${option.id}`,
                    theme === option.id ? "border-brand ring-2 ring-brand/30" : "border-line hover:border-line-strong"
                  )}
                >
                  <span className="text-xs font-semibold">{option.label}</span>
                  <span className="flex flex-col gap-1">
                    <span className="h-1.5 w-10 rounded-full bg-current opacity-40" />
                    <span className="h-1.5 w-7 rounded-full bg-current opacity-25" />
                  </span>
                </button>
              ))}
            </div>

            <span className="label mt-4">Accent color</span>
            <div className="flex flex-wrap items-center gap-2">
              {ACCENTS.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => {
                    setAccent(swatch);
                    setSaved(false);
                  }}
                  className={cn(
                    "h-7 w-7 rounded-full border-2 transition",
                    accent === swatch ? "border-ink scale-110" : "border-transparent opacity-80 hover:opacity-100"
                  )}
                  style={{ background: swatch }}
                  aria-label={`Accent ${swatch}`}
                />
              ))}
              <input
                type="color"
                value={accent}
                onChange={(event) => {
                  setAccent(event.target.value);
                  setSaved(false);
                }}
                className="h-7 w-9 cursor-pointer rounded border border-line bg-transparent"
                aria-label="Custom accent"
              />
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-line bg-card2 px-3 py-3">
              <div>
                <div className="text-xs font-semibold">{isPublished ? "Page is live" : "Page is paused"}</div>
                <div className="text-xs text-muted">{isPublished ? "Anyone with the link can view it." : "Visitors see a paused notice."}</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isPublished}
                className={cn("switch", isPublished && "on")}
                onClick={() => {
                  setIsPublished((value) => !value);
                  setSaved(false);
                }}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Blocks"
            subtitle="Buttons, headings and text shown on your page"
            action={
              <Link href="/app/analytics" className="text-xs font-semibold text-brand-ink hover:underline">
                <span className="inline-flex items-center gap-1">
                  <BarChart3 size={12} /> Block analytics
                </span>
              </Link>
            }
          >
            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-card2 px-4 py-8 text-center">
                <p className="text-xs text-muted">Add your first block below — buttons are tracked automatically.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => {
                  const meta = BLOCK_META[item.type];
                  const Icon = meta.icon;
                  return (
                    <div key={item.key} className="rounded-xl border border-line bg-card2 p-3">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="feature-icon h-7 w-7 rounded-lg">
                          <Icon size={13} />
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-muted">{meta.label}</span>
                        <div className="ml-auto flex items-center gap-1">
                          <button
                            type="button"
                            className="icon-btn h-6 w-6"
                            onClick={() => move(item.key, -1)}
                            disabled={index === 0}
                            aria-label="Move up"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn h-6 w-6"
                            onClick={() => move(item.key, 1)}
                            disabled={index === items.length - 1}
                            aria-label="Move down"
                          >
                            <ArrowDown size={12} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn h-6 w-6 hover:!text-bad"
                            onClick={() => removeBlock(item.key)}
                            aria-label="Remove block"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {item.type === "heading" ? (
                        <input
                          className="input input-sm"
                          value={item.title}
                          placeholder="Heading text"
                          onChange={(event) => updateItem(item.key, { title: event.target.value })}
                        />
                      ) : item.type === "text" ? (
                        <textarea
                          className="textarea !min-h-16 !text-xs"
                          value={item.subtitle}
                          placeholder="Say something to your visitors…"
                          onChange={(event) => updateItem(item.key, { subtitle: event.target.value })}
                        />
                      ) : (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <input
                            className="input input-sm"
                            value={item.title}
                            placeholder={item.type === "social" ? "Instagram" : "Button label"}
                            onChange={(event) => updateItem(item.key, { title: event.target.value })}
                          />
                          <input
                            className="input input-sm font-mono !text-xs"
                            value={item.url}
                            placeholder="https://instagram.com/you"
                            onChange={(event) => updateItem(item.key, { url: event.target.value })}
                            spellCheck={false}
                          />
                          <input
                            className="input input-sm sm:col-span-2"
                            value={item.subtitle}
                            placeholder="Optional subtitle shown under the label"
                            onChange={(event) => updateItem(item.key, { subtitle: event.target.value })}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {(Object.keys(BLOCK_META) as Array<keyof typeof BLOCK_META>).map((type) => {
                const Icon = BLOCK_META[type].icon;
                return (
                  <button
                    key={type}
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => addBlock(type)}
                    disabled={items.length >= 30}
                  >
                    <Icon size={13} /> Add {BLOCK_META[type].label.toLowerCase()}
                  </button>
                );
              })}
            </div>
            <p className="hint mt-2">Up to 30 blocks. Buttons route through LinkShort so every tap is counted.</p>
          </SectionCard>
        </div>

        <div className="xl:sticky xl:top-20 xl:self-start">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-3 py-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Live preview</span>
              <span className="text-xs text-muted">/p/{slug || "…"}</span>
            </div>
            <div className={cn("p-4", `page-theme-${theme}`)}>
              <div className="mx-auto max-w-[280px] pb-4 pt-2 text-center">
                <div
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold text-white shadow-lg"
                  style={{ background: accent }}
                >
                  {avatar || title.slice(0, 2).toUpperCase() || "LS"}
                </div>
                <div className="mt-3 truncate font-display text-base font-semibold">{title || "Your name"}</div>
                {bio ? <p className="mt-2 whitespace-pre-line text-xs leading-relaxed opacity-70">{bio}</p> : null}

                <div className="mt-4 space-y-2 text-left">
                  {items.map((item) => {
                    if (item.type === "heading") {
                      return (
                        <div key={item.key} className="pt-2 text-center text-xs font-bold uppercase tracking-wider opacity-70">
                          {item.title || "Heading"}
                        </div>
                      );
                    }
                    if (item.type === "text") {
                      return (
                        <p key={item.key} className="whitespace-pre-line text-center text-xs leading-relaxed opacity-65">
                          {item.subtitle || "Text block"}
                        </p>
                      );
                    }
                    return (
                      <div
                        key={item.key}
                        className="rounded-xl border px-3 py-3 text-center text-xs font-semibold transition hover:opacity-90"
                        style={
                          item.type === "social"
                            ? { borderColor: `${accent}55`, color: accent }
                            : { background: accent, borderColor: accent, color: "#fff" }
                        }
                      >
                        <div className="truncate">{item.title || "Button"}</div>
                        {item.subtitle ? <div className="mt-0.5 truncate text-xs font-normal opacity-80">{item.subtitle}</div> : null}
                      </div>
                    );
                  })}
                  {items.length === 0 ? <p className="py-6 text-center text-xs opacity-50">No blocks yet</p> : null}
                </div>

                <div className="mt-6 text-xs uppercase tracking-widest opacity-40">Made with LinkShort</div>
              </div>
            </div>
          </div>

          <div className="card mt-4 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">{dirty ? "Unsaved changes" : "All changes saved"}</span>
              <span className="flex items-center gap-1 text-muted">
                <span className={cn("h-1.5 w-1.5 rounded-full", dirty ? "bg-warn" : "bg-ok")} />
                {dirty ? "Draft" : "Synced"}
              </span>
            </div>
            <button type="button" className="btn btn-primary btn-sm mt-2 w-full" onClick={save} disabled={busy || !dirty}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save page
            </button>
            {dirty ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm mt-1 w-full"
                onClick={() => {
                  setTitle(page.title);
                  setSlug(page.slug);
                  setBio(page.bio ?? "");
                  setAvatar(page.avatar ?? "");
                  setTheme(page.theme);
                  setAccent(page.accent);
                  setIsPublished(page.isPublished);
                  setItems(toEditable(blocks));
                  setSaved(false);
                  setError(null);
                }}
              >
                Discard changes
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
