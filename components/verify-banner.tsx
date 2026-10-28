"use client";

import Link from "next/link";
import { useState } from "react";
import { MailWarning, Loader2 } from "@/components/icons";

export function VerifyBanner() {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resend() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = (await response.json()) as { verifyUrl?: string; error?: string };
      if (!response.ok) throw new Error(data.error || "Could not create a verification link");
      if (data.verifyUrl) setUrl(data.verifyUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="alert alert-warn mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <MailWarning size={16} className="mt-0.5 shrink-0" />
        <div>
          <span className="font-semibold">Verify your email to secure your account.</span>{" "}
          <span className="opacity-80">This demo doesn&apos;t send email — generate the link and open it directly.</span>
          {error ? <div className="mt-1 text-xs text-bad">{error}</div> : null}
        </div>
      </div>
      {url ? (
        <Link href={url} className="btn btn-outline btn-sm shrink-0">
          Open verification link
        </Link>
      ) : (
        <button type="button" className="btn btn-outline btn-sm shrink-0" onClick={resend} disabled={busy}>
          {busy ? <Loader2 size={13} className="animate-spin" /> : null}
          Generate link
        </button>
      )}
    </div>
  );
}
