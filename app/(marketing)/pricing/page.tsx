import Link from "next/link";
import { ArrowRight, Check, Minus } from "@/components/icons";
import { PricingGrid } from "@/components/marketing/pricing-grid";
import { getCurrentUser } from "@/lib/auth";
import { PLANS, PLAN_ORDER, type PlanId } from "@/lib/plans";
import { cn, formatNumber } from "@/lib/utils";

export const metadata = {
  title: "Pricing",
  description: "Simple monthly pricing for short links, QR codes, campaign tracking and link analytics. Start free.",
};

const BOOLEAN_ROWS: Array<{ label: string; enabled: (plan: PlanId) => boolean }> = [
  { label: "Custom QR colors & logo", enabled: (plan) => plan !== "FREE" },
  { label: "SVG QR download", enabled: () => true },
  { label: "A/B testing", enabled: (plan) => plan === "PRO" || plan === "GROWTH" },
  { label: "Retargeting pixels", enabled: (plan) => plan === "PRO" || plan === "GROWTH" },
  { label: "CSV click export", enabled: () => true },
  { label: "REST API access", enabled: () => true },
  { label: "Priority support", enabled: (plan) => plan === "PRO" || plan === "GROWTH" },
  { label: "Dedicated support", enabled: (plan) => plan === "GROWTH" },
];

const FAQ = [
  {
    q: "What counts as a link?",
    a: "Every short URL you create counts once toward your monthly allowance, including links created through the API. Editing an existing link is free.",
  },
  {
    q: "What happens to my links if I downgrade?",
    a: "Nothing breaks. Links keep redirecting and analytics stay visible for your new plan's retention window. You just get fewer new links, QR codes, campaigns and domains per month.",
  },
  {
    q: "How long is analytics retained?",
    a: "Free keeps 7 days, Basic 30, Pro 90 and Growth 365. Older clicks are not deleted — they become visible again if you upgrade.",
  },
  {
    q: "Do you charge per click?",
    a: "No. Click tracking is included on every plan, and Pro and Growth have unlimited tracked clicks.",
  },
  {
    q: "Can I cancel at any time?",
    a: "Yes. Billing is monthly with no long-term contract. Turn off auto-renew from the billing page whenever you like.",
  },
];

export default async function PricingPage() {
  const user = await getCurrentUser();
  const currentPlan = user ? (user.plan as PlanId) : null;

  return (
    <>
      <section className="border-b border-line bg-panel">
        <div className="container-x py-16 text-center">
          <span className="section-eyebrow">Pricing</span>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Simple plans, serious links</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted">
            Every plan includes click tracking, QR codes, campaigns, bio pages and API access. Pay monthly, cancel whenever, no hidden
            per-click fees.
          </p>
          <p className="mt-4 text-xs text-muted">
            Prices in USD. This is a demo build — checkout upgrades your plan instantly without charging a card.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container-x">
          {currentPlan ? (
            <p className="mb-4 text-center text-xs text-muted">
              You are on the <span className="badge badge-brand">{PLANS[currentPlan].name}</span> plan.{" "}
              <Link href="/app/billing" className="text-brand-ink hover:underline">
                Manage billing
              </Link>
            </p>
          ) : null}
          <PricingGrid signedIn={Boolean(user)} />
        </div>
      </section>

      <section className="border-y border-line bg-panel py-12">
        <div className="container-x">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-semibold tracking-tight">Compare plans</h2>
            <p className="mt-2 text-sm text-muted">The short version of what each tier unlocks.</p>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-card">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-[34%]">Feature</th>
                    {PLAN_ORDER.map((id) => (
                      <th key={id} className={cn("text-center", PLANS[id].popular && "text-brand-ink")}>
                        <span className="block text-xs font-bold">{PLANS[id].name}</span>
                        <span className="block text-xs font-normal text-muted">${PLANS[id].price}/mo</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-medium">Short links per month</td>
                    {PLAN_ORDER.map((id) => (
                      <td key={id} className="text-center mono text-xs">{formatNumber(PLANS[id].linksPerMonth)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="font-medium">QR codes</td>
                    {PLAN_ORDER.map((id) => (
                      <td key={id} className="text-center mono text-xs">{formatNumber(PLANS[id].qrcodes)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="font-medium">Campaigns</td>
                    {PLAN_ORDER.map((id) => (
                      <td key={id} className="text-center mono text-xs">{formatNumber(PLANS[id].campaigns)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="font-medium">Bio pages</td>
                    {PLAN_ORDER.map((id) => (
                      <td key={id} className="text-center mono text-xs">{formatNumber(PLANS[id].pages)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="font-medium">Custom domains</td>
                    {PLAN_ORDER.map((id) => (
                      <td key={id} className="text-center mono text-xs">{PLANS[id].domains === 0 ? "—" : PLANS[id].domains}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="font-medium">Analytics history</td>
                    {PLAN_ORDER.map((id) => (
                      <td key={id} className="text-center mono text-xs">{PLANS[id].analyticsDays} days</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="font-medium">Tracked clicks</td>
                    {PLAN_ORDER.map((id) => (
                      <td key={id} className="text-center text-xs text-muted">
                        {id === "FREE" ? "1,000 / mo" : "Unlimited"}
                      </td>
                    ))}
                  </tr>
                  {BOOLEAN_ROWS.map((row) => (
                    <tr key={row.label}>
                      <td className="font-medium">{row.label}</td>
                      {PLAN_ORDER.map((id) => (
                        <td key={id} className="text-center">
                          {row.enabled(id) ? (
                            <Check size={15} className="mx-auto text-ok" aria-label="Included" />
                          ) : (
                            <Minus size={15} className="mx-auto text-muted/40" aria-label="Not included" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td />
                    {PLAN_ORDER.map((id) => (
                      <td key={id} className="text-center">
                        <Link
                          href={user ? "/app/billing" : `/register?plan=${id}`}
                          className={cn("btn btn-sm", PLANS[id].popular ? "btn-primary" : "btn-outline")}
                        >
                          {PLANS[id].price === 0 ? "Start free" : "Choose plan"}
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-x grid gap-10 lg:grid-cols-[0.8fr_1.4fr]">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">Pricing questions</h2>
            <p className="mt-2 text-sm text-muted">
              Need a custom volume? The Growth plan is a good starting point — every plan shares the same feature set.
            </p>
            <Link href={user ? "/app/billing" : "/register"} className="btn btn-primary btn-sm mt-4">
              {user ? "Manage my plan" : "Create an account"} <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {FAQ.map((item) => (
              <details key={item.q} className="group rounded-xl border border-line bg-card px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold">
                  {item.q}
                  <span className="text-muted transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-xs leading-relaxed text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
