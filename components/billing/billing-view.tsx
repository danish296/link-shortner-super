"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CreditCard, Loader2, Receipt, Sparkles } from "@/components/icons";
import { Modal } from "@/components/modal";
import { Meter, PageHeader, SectionCard } from "@/components/ui";
import { PLANS, PLAN_ORDER, type PlanId } from "@/lib/plans";
import { cn, formatDate, formatMoney, formatNumber } from "@/lib/utils";

export interface InvoiceItem {
  id: string;
  plan: string;
  amount_cents: number;
  status: string;
  created_at: number;
}

export interface BillingUsage {
  linksThisMonth: number;
  qrcodes: number;
  campaigns: number;
  pages: number;
  domains: number;
}

export function BillingView({
  currentPlan,
  autoRenew,
  planSince,
  usage,
  invoices,
}: {
  currentPlan: PlanId;
  autoRenew: boolean;
  planSince: number | null;
  usage: BillingUsage;
  invoices: InvoiceItem[];
}) {
  const router = useRouter();
  const plan = PLANS[currentPlan];
  const [renew, setRenew] = useState(autoRenew);
  const [savingRenew, setSavingRenew] = useState(false);
  const [target, setTarget] = useState<PlanId | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rows: Array<{ label: string; used: number; limit: number; suffix?: string }> = [
    { label: "Links this month", used: usage.linksThisMonth, limit: plan.linksPerMonth, suffix: "/mo" },
    { label: "QR codes", used: usage.qrcodes, limit: plan.qrcodes },
    { label: "Campaigns", used: usage.campaigns, limit: plan.campaigns },
    { label: "Bio pages", used: usage.pages, limit: plan.pages },
    { label: "Custom domains", used: usage.domains, limit: plan.domains },
  ];

  async function toggleRenew() {
    const next = !renew;
    setRenew(next);
    setSavingRenew(true);
    try {
      const response = await fetch("/api/billing/auto-renew", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      if (!response.ok) throw new Error("Could not update auto-renew");
      router.refresh();
    } catch {
      setRenew(!next);
    } finally {
      setSavingRenew(false);
    }
  }

  async function checkout() {
    if (!target) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: target }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not change your plan");
      setTarget(null);
      router.refresh();
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Could not change your plan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Billing & plan"
        description="Manage your subscription, monitor usage and review invoices."
        actions={
          <a href="/pricing" className="btn btn-outline btn-sm">
            Compare plans
          </a>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="card card-pad relative overflow-hidden">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand/20 blur-3xl" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="badge badge-brand">
                  <Sparkles size={11} /> Current plan
                </span>
                <h2 className="mt-3 font-display text-2xl font-bold">{plan.name}</h2>
                <p className="mt-1 text-sm text-muted">{plan.tagline}</p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-3xl font-bold">{formatMoney(plan.price * 100)}</span>
                  <span className="text-xs text-muted">/ month</span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {planSince ? `On this plan since ${formatDate(planSince)}` : "Free forever"}
                  {plan.price > 0 ? (renew ? " · renews monthly" : " · cancels at period end") : ""}
                </p>
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <div className="flex items-center gap-2 rounded-xl border border-line bg-card2 px-3 py-2">
                  <div className="text-xs">
                    <div className="font-semibold">Auto renew</div>
                    <div className="text-muted">{renew ? "Enabled" : "Disabled"}</div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={renew}
                    className={cn("switch", renew && "on")}
                    onClick={toggleRenew}
                    disabled={savingRenew || plan.price === 0}
                    title={plan.price === 0 ? "Free plans don't renew" : undefined}
                  />
                </div>
                <span className="flex items-center gap-1 text-xs text-muted">
                  <CreditCard size={11} /> Demo billing — no card is charged
                </span>
              </div>
            </div>

            <div className="relative mt-6 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {rows.map((row) => {
                const unlimited = row.limit >= 100000;
                return (
                  <div key={row.label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted">{row.label}</span>
                      <span className="mono text-ink">
                        {formatNumber(row.used)}
                        {unlimited ? "" : ` / ${formatNumber(row.limit)}${row.suffix ?? ""}`}
                      </span>
                    </div>
                    <Meter value={row.used} max={unlimited ? Math.max(row.used, 1) : Math.max(row.limit, 1)} />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {PLAN_ORDER.map((id) => {
              const option = PLANS[id];
              const isCurrent = id === currentPlan;
              return (
                <div key={id} className={cn("plan-card relative flex flex-col", option.popular && "popular")}>
                  {option.popular ? <span className="badge badge-brand absolute right-3 top-3">Popular</span> : null}
                  <div className="font-display text-sm font-bold">{option.name}</div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-display text-2xl font-bold">{formatMoney(option.price * 100)}</span>
                    <span className="text-xs text-muted">/mo</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{option.tagline}</p>
                  <ul className="mt-3 flex-1 space-y-2">
                    {option.features.slice(0, 4).map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-xs text-muted">
                        <Check size={11} className="mt-0.5 shrink-0 text-ok" /> {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className={cn("btn btn-sm mt-4 w-full", isCurrent ? "btn-outline" : "btn-primary")}
                    disabled={isCurrent}
                    onClick={() => {
                      setTarget(id);
                      setError(null);
                    }}
                  >
                    {isCurrent ? "Current plan" : option.price > plan.price ? "Upgrade" : "Switch plan"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <SectionCard title="Usage this month" subtitle="Quotas reset on the 1st">
            <div className="space-y-3 text-xs">
              {rows.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-2">
                  <span className="text-muted">{row.label}</span>
                  <span className="mono">
                    {formatNumber(row.used)}
                    {row.limit >= 100000 ? "" : ` / ${formatNumber(row.limit)}`}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg border border-line bg-card2 px-3 py-2 text-xs leading-relaxed text-muted">
              Need higher limits or annual billing?{" "}
              <a href="mailto:sales@linkshort.local" className="font-semibold text-brand-ink hover:underline">
                Talk to sales
              </a>
              .
            </div>
          </SectionCard>

          <SectionCard title="Payment method" subtitle="Demo environment">
            <div className="flex items-center gap-3 rounded-xl border border-line bg-card2 p-3">
              <span className="feature-icon h-9 w-9">
                <CreditCard size={15} />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-semibold">No card on file</div>
                <div className="text-xs text-muted">Checkout is simulated in this build.</div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      <SectionCard title="Invoices" subtitle="Receipts for every plan change" className="mt-4" bodyClassName="p-0">
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <Receipt size={22} className="text-muted" />
            <p className="text-xs text-muted">No invoices yet. Paid plan changes generate a receipt instantly.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Plan</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="mono text-xs text-muted">INV-{invoice.id.slice(0, 8).toUpperCase()}</td>
                    <td className="whitespace-nowrap text-xs">{formatDate(invoice.created_at)}</td>
                    <td className="text-xs">{PLANS[invoice.plan as PlanId]?.name ?? invoice.plan}</td>
                    <td className="text-right mono text-xs">{formatMoney(invoice.amount_cents)}</td>
                    <td className="text-right">
                      <span className="badge badge-ok">{invoice.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <Modal
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        title={target ? `Switch to ${PLANS[target].name}` : ""}
        subtitle="Demo checkout — your plan changes instantly and no payment is taken."
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setTarget(null)} disabled={busy}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={checkout} disabled={busy}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
              Confirm {target ? formatMoney(PLANS[target].price * 100) : ""}
            </button>
          </>
        }
      >
        {target ? (
          <div>
            <div className="rounded-xl border border-line bg-card2 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">{PLANS[target].name}</span>
                <span className="mono">{formatMoney(PLANS[target].price * 100)}/mo</span>
              </div>
              <ul className="mt-2 space-y-1">
                {PLANS[target].features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-xs text-muted">
                    <Check size={11} className="mt-0.5 shrink-0 text-ok" /> {feature}
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-3 text-xs text-muted">
              {PLANS[target].price > PLANS[currentPlan].price
                ? "You'll get the higher quota immediately."
                : "Your data is kept — lower limits only affect future creation."}
            </p>
            {error ? <div className="alert alert-error mt-3">{error}</div> : null}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
