"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, Loader2, MailCheck, UserPlus } from "@/components/icons";
import { cn } from "@/lib/utils";

export function RegisterForm({ planName, claimedUrl }: { planName: string | null; claimedUrl: string | null }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ verifyUrl: string | null } | null>(null);

  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (!terms) {
      setError("Please accept the terms to continue");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; verifyUrl?: string };
      if (!response.ok) throw new Error(data.error || "Could not create your account");
      setCreated({ verifyUrl: data.verifyUrl ?? null });
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : "Could not create your account");
    } finally {
      setBusy(false);
    }
  }

  function continueToApp() {
    const target = claimedUrl ? `/app/links?new=1&url=${encodeURIComponent(claimedUrl)}` : "/app/dashboard";
    router.push(target);
    router.refresh();
  }

  if (created) {
    return (
      <div className="card card-pad text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ok/15 text-ok">
          <BadgeCheck size={24} />
        </span>
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">You&apos;re in</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Your account is ready. We would normally email a verification link — in this demo you can use it directly below.
        </p>

        {claimedUrl ? (
          <p className="mono mt-4 truncate rounded-lg border border-line bg-card2 px-3 py-2 text-xs text-muted">
            {claimedUrl}
          </p>
        ) : null}

        <div className="mt-4 space-y-2">
          {created.verifyUrl ? (
            <a href={created.verifyUrl} className="btn btn-outline btn-block btn-sm">
              <MailCheck size={14} /> Verify my email
            </a>
          ) : null}
          <button type="button" className="btn btn-primary btn-block" onClick={continueToApp}>
            {claimedUrl ? "Continue and shorten my link" : "Go to dashboard"} <ArrowRight size={15} />
          </button>
        </div>

        <p className="mt-4 text-xs text-muted">
          You can verify later from the banner in your dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="card card-pad">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-2 text-sm text-muted">Start free — 100 links per month, no card required.</p>
        </div>
        {planName ? <span className="badge badge-brand shrink-0">{planName} selected</span> : null}
      </div>

      <form onSubmit={submit} className="mt-6">
        <div className="field">
          <label htmlFor="name" className="label">Full name</label>
          <input
            id="name"
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Alex Morgan"
            autoComplete="name"
            required
            minLength={2}
          />
        </div>
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
        <div className="field">
          <label htmlFor="password" className="label">Password</label>
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
          <div className="mt-2 flex items-center gap-2">
            {[1, 2, 3].map((level) => (
              <span
                key={level}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  strength >= level ? (level === 1 ? "bg-bad" : level === 2 ? "bg-warn" : "bg-ok") : "bg-white/10"
                )}
              />
            ))}
            <span className="ml-1 text-xs text-muted">
              {strength === 0 ? "8+ characters" : strength === 1 ? "Weak" : strength === 2 ? "Good" : "Strong"}
            </span>
          </div>
        </div>
        <div className="field">
          <label htmlFor="confirm" className="label">Confirm password</label>
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

        <label className="mb-3 flex items-start gap-2 text-xs leading-relaxed text-muted">
          <input type="checkbox" className="checkbox mt-0.5" checked={terms} onChange={(event) => setTerms(event.target.checked)} />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="text-brand-ink hover:underline">terms of service</Link> and{" "}
            <Link href="/privacy" className="text-brand-ink hover:underline">privacy policy</Link>.
          </span>
        </label>

        {error ? <div className="alert alert-error mb-3">{error}</div> : null}

        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />} Create account
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-ink hover:underline">
          Sign in <ArrowRight size={11} className="inline" />
        </Link>
      </p>
    </div>
  );
}
