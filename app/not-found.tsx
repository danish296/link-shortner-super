import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-screen flex-col">
      <header className="container-x flex h-16 items-center">
        <Link href="/" aria-label="LinkShort home">
          <Logo size={28} />
        </Link>
      </header>

      <div className="container-x flex flex-1 flex-col items-center justify-center py-16 text-center">
        <p className="mono text-sm text-brand-ink">404</p>
        <h1 className="mt-4 max-w-[680px] text-3xl font-semibold tracking-tight sm:text-4xl">
          This link does not point anywhere
        </h1>
        <p className="mt-4 max-w-[680px] text-base leading-relaxed text-muted">
          The page may have moved, or the short code was mistyped. Short links that were deleted stop resolving as well.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link href="/" className="btn btn-primary">
            Back to home <ArrowRight size={16} />
          </Link>
          <Link href="/app/dashboard" className="btn btn-outline">
            Open dashboard
          </Link>
        </div>
      </div>

      <footer className="container-x flex items-center justify-center gap-6 py-8 text-xs text-muted">
        <Link href="/docs" className="hover:text-ink">
          Documentation
        </Link>
        <Link href="/pricing" className="hover:text-ink">
          Pricing
        </Link>
        <Link href="/terms" className="hover:text-ink">
          Terms
        </Link>
      </footer>
    </main>
  );
}
