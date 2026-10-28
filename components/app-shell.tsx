"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  Code2,
  CreditCard,
  Globe,
  LayoutDashboard,
  Link2,
  LogOut,
  Megaphone,
  Menu,
  PanelsTopLeft,
  Plus,
  QrCode,
  Search,
  Settings,
  Sparkles,
  X,
} from "@/components/icons";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { cn, initials } from "@/lib/utils";

export interface ShellUser {
  name: string;
  email: string;
  plan: string;
  emailVerified: boolean;
}

const NAV_GROUPS: Array<{
  label: string;
  items: Array<{ href: string; label: string; icon: typeof LayoutDashboard }>;
}> = [
  {
    label: "Workspace",
    items: [
      { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/app/links", label: "Links", icon: Link2 },
      { href: "/app/campaigns", label: "Campaigns", icon: Megaphone },
      { href: "/app/qrcodes", label: "QR Codes", icon: QrCode },
      { href: "/app/pages", label: "Bio Pages", icon: PanelsTopLeft },
      { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/app/domains", label: "Domains", icon: Globe },
    ],
  },
  {
    label: "Developers",
    items: [
      { href: "/app/api", label: "API & Keys", icon: Code2 },
      { href: "/docs", label: "Documentation", icon: BookOpen },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/app/billing", label: "Billing", icon: CreditCard },
      { href: "/app/settings", label: "Settings", icon: Settings },
    ],
  },
];

const TITLES: Array<[string, string]> = [
  ["/app/dashboard", "Dashboard"],
  ["/app/links", "Links"],
  ["/app/campaigns", "Campaigns"],
  ["/app/qrcodes", "QR Codes"],
  ["/app/pages", "Bio Pages"],
  ["/app/analytics", "Analytics"],
  ["/app/domains", "Domains"],
  ["/app/api", "API & Developers"],
  ["/app/billing", "Billing & Plan"],
  ["/app/settings", "Settings"],
];

const SUBTITLES: Record<string, string> = {
  Dashboard: "Your links, campaigns and traffic at a glance",
  Links: "Create, manage and measure every short link",
  Campaigns: "Group links into trackable campaigns",
  "QR Codes": "Branded QR codes that track scans",
  "Bio Pages": "Bio pages on your own URL",
  Analytics: "Understand where your clicks come from",
  Domains: "Connect your brand’s short domain",
  "API & Developers": "Build integrations on top of LinkShort",
  "Billing & Plan": "Manage your subscription and usage",
  Settings: "Profile, security and preferences",
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/app/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarBody({
  user,
  planName,
  linksUsed,
  linksLimit,
  pathname,
  onNavigate,
  onLogout,
}: {
  user: ShellUser;
  planName: string;
  linksUsed: number;
  linksLimit: number;
  pathname: string;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  const pct = linksLimit > 0 ? Math.min(100, Math.round((linksUsed / linksLimit) * 100)) : 0;
  const tone = pct >= 90 ? "bad" : pct >= 70 ? "warn" : "";

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center border-b border-line px-6">
        <Link href="/app/dashboard" onClick={onNavigate} aria-label="LinkShort dashboard">
          <Logo />
        </Link>
      </div>

      <nav className="scroll-thin flex-1 overflow-y-auto px-3 py-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="side-group-label">{group.label}</div>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn("side-link", isActive(pathname, item.href) && "active")}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="shrink-0 space-y-3 p-3">
        <div className="rounded-xl border border-line bg-card p-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
              <Sparkles size={12} /> {planName}
            </span>
            <span className="text-xs text-muted">plan</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted">
            <span>Links this month</span>
            <span className="mono text-ink">
              {linksUsed.toLocaleString()}/{linksLimit.toLocaleString()}
            </span>
          </div>
          <div className={cn("meter mt-2", tone)}>
            <span style={{ "--meter-fill": Math.max(pct, 2) / 100 } as React.CSSProperties} />
          </div>
          {planName.toLowerCase() !== "growth" ? (
            <Link href="/app/billing" onClick={onNavigate} className="btn btn-primary btn-sm mt-3 w-full">
              Upgrade plan
            </Link>
          ) : (
            <div className="mt-3 rounded-lg bg-ok/10 px-2 py-2 text-center text-xs font-semibold text-ok">
              Highest tier unlocked
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-line bg-card px-3 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
            {initials(user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold">{user.name}</div>
            <div className="truncate text-xs text-muted">{user.email}</div>
          </div>
          <button type="button" onClick={onLogout} className="icon-btn h-7 w-7" title="Log out" aria-label="Log out">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function UserMenu({ user, onLogout }: { user: ShellUser; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border border-line p-1 pr-2 transition hover:border-line-strong"
        aria-label="Account menu"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
          {initials(user.name)}
        </span>
        <ChevronDown size={13} className="text-muted" />
      </button>
      {open ? (
        <div className="absolute right-0 top-12 z-50 w-60 rounded-xl border border-line bg-panel p-2 shadow-2xl">
          <div className="border-b border-line px-3 py-2">
            <div className="truncate text-xs font-semibold">{user.name}</div>
            <div className="truncate text-xs text-muted">{user.email}</div>
            <span className="badge badge-brand mt-2">{user.plan}</span>
          </div>
          {[
            { href: "/app/settings", label: "Settings", icon: Settings },
            { href: "/app/billing", label: "Billing", icon: CreditCard },
            { href: "/app/api", label: "API keys", icon: Code2 },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="mt-0.5 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted transition hover:bg-card2 hover:text-ink"
              >
                <Icon size={14} /> {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={onLogout}
            className="mt-1 flex w-full items-center gap-2 rounded-lg border-t border-line px-3 py-2 text-xs text-bad transition hover:bg-bad/10"
          >
            <LogOut size={14} /> Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function AppShell({
  user,
  planName,
  linksUsed,
  linksLimit,
  children,
}: {
  user: ShellUser;
  planName: string;
  linksUsed: number;
  linksLimit: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  const title = TITLES.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? "Workspace";
  const subtitle = SUBTITLES[title] ?? "";

  return (
    <>
      <aside className="sidebar hidden lg:flex">
        <SidebarBody
          user={user}
          planName={planName}
          linksUsed={linksUsed}
          linksLimit={linksLimit}
          pathname={pathname}
          onLogout={logout}
        />
      </aside>

      {drawer ? (
        <div className="drawer lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <div className="drawer-panel relative z-10">
            <button
              type="button"
              className="icon-btn absolute right-2 top-4 z-20"
              onClick={() => setDrawer(false)}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            <SidebarBody
              user={user}
              planName={planName}
              linksUsed={linksUsed}
              linksLimit={linksLimit}
              pathname={pathname}
              onNavigate={() => setDrawer(false)}
              onLogout={logout}
            />
          </div>
        </div>
      ) : null}

      <div className="app-main min-h-screen">
        <header className="topbar">
          <button type="button" className="icon-btn lg:hidden" onClick={() => setDrawer(true)} aria-label="Open menu">
            <Menu size={18} />
          </button>

          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{title}</div>
            <div className="hidden truncate text-xs text-muted sm:block">{subtitle}</div>
          </div>

          <form action="/app/links" className="relative ml-4 hidden w-64 md:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input name="q" placeholder="Search links…" className="input input-sm pl-10" aria-label="Search links" />
          </form>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-line px-3 py-1 text-xs text-muted xl:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-ok" /> All systems operational
            </span>
            <Link href="/docs" className="icon-btn hidden sm:inline-flex" title="API documentation">
              <BookOpen size={16} />
            </Link>
            <ThemeToggle />
            <Link href="/app/links?new=1" className="btn btn-primary btn-sm">
              <Plus size={14} /> <span className="hidden sm:inline">New link</span>
            </Link>
            <UserMenu user={user} onLogout={logout} />
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-[1400px] p-6 md:p-6">{children}</main>
      </div>
    </>
  );
}
