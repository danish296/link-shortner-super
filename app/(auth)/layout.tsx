import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container-x flex h-16 items-center justify-between">
        <Link href="/" aria-label="LinkShort home">
          <Logo size={28} />
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/docs" className="nav-link hidden sm:inline-flex">
            Docs
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main id="main" className="container-x flex flex-1 items-center justify-center py-8 sm:py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="container-x flex flex-wrap items-center justify-center gap-4 py-8 text-xs text-muted">
        <span>© {new Date().getFullYear()} LinkShort</span>
        <Link href="/terms" className="hover:text-ink">
          Terms
        </Link>
        <Link href="/privacy" className="hover:text-ink">
          Privacy
        </Link>
        <Link href="/cookies" className="hover:text-ink">
          Cookies
        </Link>
      </footer>
    </div>
  );
}
