"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
];

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

function isCurrent(pathname: string, href: string): boolean {
  if (href === "/pricing") return pathname === "/pricing";
  if (href === "/docs") return pathname === "/docs" || pathname.startsWith("/docs/");
  return false;
}

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="fixed inset-x-0 top-4 z-40 flex justify-center px-4">
        <div className="flex items-center gap-1 rounded-full border border-line bg-bg/70 p-2 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <Link href="/" aria-label="LinkShort home" className="flex items-center px-2">
            <Logo size={28} />
          </Link>

          <nav aria-label="Main" className="hidden items-center md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="nav-link"
                aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <span className="mx-1 hidden h-6 w-px bg-line md:block" aria-hidden="true" />

          <ThemeToggle className="hidden md:inline-flex" />

          <div className="hidden items-center gap-1 md:flex">
            {signedIn ? (
              <Link href="/app/dashboard" className="btn btn-primary btn-sm">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn btn-ghost btn-sm">
                  Sign in
                </Link>
                <Link href="/register" className="btn btn-primary btn-sm">
                  Start free
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="icon-btn md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            <span className="relative block h-4 w-5" aria-hidden="true">
              <span
                className={cn(
                  "absolute left-0 top-1 block h-0.5 w-5 rounded-full bg-current transition-transform duration-500",
                  EASE,
                  open && "translate-y-1 rotate-45",
                )}
              />
              <span
                className={cn(
                  "absolute left-0 top-2 block h-0.5 w-5 rounded-full bg-current transition-opacity duration-300",
                  EASE,
                  open && "opacity-0",
                )}
              />
              <span
                className={cn(
                  "absolute left-0 top-3 block h-0.5 w-5 rounded-full bg-current transition-transform duration-500",
                  EASE,
                  open ? "-translate-y-1 -rotate-45" : "",
                )}
              />
            </span>
          </button>
        </div>
      </header>

      <div
        id="mobile-menu"
        className={cn(
          "fixed inset-0 z-30 bg-bg/90 backdrop-blur-2xl transition-opacity duration-500 md:hidden",
          EASE,
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!open}
      >
        <nav aria-label="Mobile" className="flex h-full flex-col justify-center gap-1 px-6 pt-24">
          {NAV.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              style={{ transitionDelay: open ? `${index * 60}ms` : "0ms" }}
              className={cn(
                "text-2xl font-semibold text-ink transition-[opacity,transform] duration-500",
                EASE,
                open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
              )}
              aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}

          <div
            style={{ transitionDelay: open ? `${NAV.length * 60}ms` : "0ms" }}
            className={cn(
              "mt-6 flex flex-col gap-2 transition-[opacity,transform] duration-500",
              EASE,
              open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
            )}
          >
            {signedIn ? (
              <Link href="/app/dashboard" onClick={() => setOpen(false)} className="btn btn-primary btn-block">
                Open dashboard
              </Link>
            ) : (
              <>
                <Link href="/register" onClick={() => setOpen(false)} className="btn btn-primary btn-block">
                  Start free
                </Link>
                <Link href="/login" onClick={() => setOpen(false)} className="btn btn-outline btn-block">
                  Sign in
                </Link>
              </>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
              <span className="text-sm text-muted">Theme</span>
              <ThemeToggle className="md:hidden" />
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
