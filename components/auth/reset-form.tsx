"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, LockKeyhole } from "@/components/icons";

export function ResetForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not reset your password");
      setDone(true);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Could not reset your password");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="card card-pad text-center">
        <h1 className="font-display text-xl font-semibold">Missing reset token</h1>
        <p className="mt-2 text-sm text-muted">
          This page needs a token from a reset link. Request a new one and try again.
        </p>
        <Link href="/forgot-password" className="btn btn-primary btn-block mt-4">
          Request a reset link <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="card card-pad text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ok/15 text-ok">
          <CheckCircle2 size={24} />
        </span>
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">Password updated</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Your password has been changed and other sessions have been signed out.
        </p>
        <Link href="/login" className="btn btn-primary btn-block mt-4">
          Sign in with the new password <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div className="card card-pad">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Choose a new password</h1>
      <p className="mt-2 text-sm text-muted">Minimum eight characters. This signs out every other session.</p>

      <form onSubmit={submit} className="mt-6">
        <div className="field">
          <label htmlFor="password" className="label">New password</label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </div>
        <div className="field">
          <label htmlFor="confirm" className="label">Confirm new password</label>
          <input
            id="confirm"
            type="password"
            className="input"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            placeholder="Repeat your password"
            autoComplete="new-password"
            required
          />
        </div>

        {error ? <div className="alert alert-error mb-3">{error}</div> : null}

        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <LockKeyhole size={15} />} Update password
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-muted">
        Remembered it after all?{" "}
        <Link href="/login" className="text-brand-ink hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
