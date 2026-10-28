import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-ink">{eyebrow}</p>
          ) : null}
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {description ? <p className="mt-2 max-w-2xl text-sm text-muted">{description}</p> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  accent = "brand",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  accent?: "brand" | "accent" | "ok" | "warn" | "bad";
}) {
  const accentClass = {
    brand: "",
    accent: "!border-accent/30 !bg-accent/15 !text-accent-fg",
    ok: "!border-ok/25 !bg-ok/10 !text-ok",
    warn: "!border-warn/25 !bg-warn/10 !text-warn",
    bad: "!border-bad/25 !bg-bad/10 !text-bad",
  }[accent];

  return (
    <div className="card card-pad">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="stat-label">{label}</div>
          <div className="stat-value mt-2">{value}</div>
          {sub ? <div className="stat-sub mt-2">{sub}</div> : null}
        </div>
        {icon ? <div className={cn("feature-icon", accentClass)}>{icon}</div> : null}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      {icon ? <div className="empty-icon">{icon}</div> : null}
      <div className="font-display text-base font-semibold text-ink">{title}</div>
      {description ? <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function StatusBadge({ status }: { status: "active" | "inactive" | "expired" | "limit" }) {
  const map = {
    active: { className: "badge-ok", label: "Active" },
    inactive: { className: "badge-muted", label: "Paused" },
    expired: { className: "badge-warn", label: "Expired" },
    limit: { className: "badge-bad", label: "Limit reached" },
  }[status];
  return <span className={cn("badge", map.className)}>{map.label}</span>;
}

export function Meter({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const tone = pct >= 90 ? "bad" : pct >= 70 ? "warn" : "";
  return (
    <div className={cn("meter", tone, className)}>
      <span style={{ "--meter-fill": Math.max(pct, 1) / 100 } as React.CSSProperties} />
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("card", className)}>
      <div className="card-header">
        <div>
          <h2 className="card-title">{title}</h2>
          {subtitle ? <p className="mt-1 text-xs text-muted">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className={cn("p-6", bodyClassName)}>{children}</div>
    </section>
  );
}
