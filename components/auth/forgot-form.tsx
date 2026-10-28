"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, Loader2, Mail } from "@/components/icons";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ message: string; resetUrl: string | null } | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/password-reset-request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string; resetUrl?: string | null };
      if (!response.ok) throw new Error(data.error || "Could not start the reset");
      setResult({ message: data.message ?? "Check your inbox for a reset link.", resetUrl: data.resetUrl ?? null });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not start the reset");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card card-pad">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Reset your password</h1>
      <p className="mt-2 text-sm text-muted">
        Enter the email on your account. If it exists, we&apos;ll generate a single-use reset link.
      </p>

      {result ? (
        <div className="mt-4 space-y-3">
          <div className="alert alert-ok">{result.message}</div>
          {result.resetUrl ? (
            <div className="rounded-xl border border-line bg-card2 px-4 py-3">
              <p className="text-xs font-semibold text-muted">Demo mode — no email is sent. Use this link:</p>
              <Link href={result.resetUrl} className="mono mt-1 block break-all text-xs text-brand-ink hover:underline">
                {result.resetUrl}
              </Link>
            </div>
          ) : null}
          <Link href="/login" className="btn btn-outline btn-block btn-sm">
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6">
          <div className="field">
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          {error ? <div className="alert alert-error mb-3">{error}</div> : null}

          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />} Send reset link
          </button>

          <Link href="/login" className="btn btn-ghost btn-block btn-sm mt-2">
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        </form>
      )}

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-line bg-card2 px-4 py-3 text-xs leading-relaxed text-muted">
        <KeyRound size={13} className="mt-0.5 shrink-0 text-brand-ink" />
        Reset links expire after one hour and sign out every other session when used.
      </div>
    </div>
  );
}
