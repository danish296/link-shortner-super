"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Link2, Loader2, Sparkles } from "@/components/icons";
import { normalizeUrl, slugify } from "@/lib/utils";

export function HeroShortener({ baseHost }: { baseHost: string }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ code: string; target: string } | null>(null);
  const [busy, setBusy] = useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const target = normalizeUrl(url);
      setBusy(true);
      const seed = slugify(new URL(target).hostname.replace(/^www\./, "").split(".")[0] || "link");
      const code = `${seed.slice(0, 8)}-${Math.random().toString(36).slice(2, 6)}`;
      setPreview({ code, target });
    } catch {
      setError("Enter a full URL, for example https://example.com/launch");
      setPreview(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 w-full max-w-xl">
      <form
        onSubmit={submit}
        className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-2 sm:flex-row sm:items-center"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2">
          <Link2 size={16} className="shrink-0 text-brand-ink" />
          <input
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              setPreview(null);
            }}
            placeholder="Paste a long URL"
            aria-label="Long URL"
            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            inputMode="url"
            autoComplete="off"
          />
        </div>
        <button type="submit" className="btn btn-primary btn-sm shrink-0 sm:px-6" disabled={busy || url.trim().length === 0}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Shorten
        </button>
      </form>

      {error ? <p className="mt-2 text-xs text-bad">{error}</p> : null}

      {preview ? (
        <div className="mt-3 flex flex-col gap-3 rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="mono truncate text-sm text-ink">
              {baseHost}/<span className="text-brand-ink">{preview.code}</span>
            </p>
            <p className="mt-1 text-xs text-muted">Preview only. Create an account to activate it.</p>
          </div>
          <Link href={`/register?url=${encodeURIComponent(preview.target)}`} className="btn btn-primary btn-sm shrink-0">
            Claim this link <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted">Free plan includes 100 links a month. No credit card required.</p>
      )}
    </div>
  );
}
