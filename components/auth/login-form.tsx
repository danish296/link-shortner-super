"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, LogIn, Sparkles } from "@/components/icons";

export function LoginForm({ next, prefillEmail }: { next?: string; prefillEmail?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(prefillEmail ?? "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoFilled, setDemoFilled] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not sign you in");
      router.push(next && next.startsWith("/") ? next : "/app/dashboard");
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Could not sign you in");
      setBusy(false);
    }
  }

  function fillDemo() {
    setEmail("demo@linkshort.app");
    setPassword("demo1234");
    setDemoFilled(true);
    setError(null);
  }

  return (
    <div className="card card-pad">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-sm text-muted">Sign in to manage your links, QR codes and analytics.</p>

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
        <div className="field">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="label">Password</label>
            <Link href="/forgot-password" className="mb-2 text-xs text-brand-ink hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </div>

        {error ? <div className="alert alert-error mb-3">{error}</div> : null}

        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />} Sign in
        </button>
      </form>

      <div className="mt-4 rounded-xl border border-line bg-card2 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ink">Try the demo workspace</p>
            <p className="mono mt-0.5 truncate text-xs text-muted">demo@linkshort.app · demo1234</p>
          </div>
          <button type="button" className="btn btn-outline btn-sm shrink-0" onClick={fillDemo}>
            <Sparkles size={13} /> Use demo
          </button>
        </div>
        {demoFilled ? <p className="mt-2 text-xs text-ok">Credentials filled — press Sign in.</p> : null}
      </div>

      <p className="mt-4 text-center text-xs text-muted">
        New to LinkShort?{" "}
        <Link href="/register" className="font-semibold text-brand-ink hover:underline">
          Create an account <ArrowRight size={11} className="inline" />
        </Link>
      </p>
    </div>
  );
}
