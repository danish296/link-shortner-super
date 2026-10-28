import Link from "next/link";
import { Check } from "@/components/icons";
import { PLANS, PLAN_ORDER } from "@/lib/plans";
import { cn } from "@/lib/utils";

export function PricingGrid({ signedIn, ctaSuffix }: { signedIn: boolean; ctaSuffix?: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {PLAN_ORDER.map((id) => {
        const plan = PLANS[id];
        const href = signedIn ? "/app/billing" : `/register?plan=${id}${ctaSuffix ?? ""}`;
        return (
          <div key={id} className={cn("plan-card", plan.popular && "popular")}>
            <div>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold">{plan.name}</p>
                {plan.popular ? (
                  <span className="rounded-full border border-brand/40 bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand-ink">
                    Most popular
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-muted">{plan.tagline}</p>
              <div className="mt-4 flex items-end gap-1">
                <span className="text-3xl font-semibold tracking-tight">${plan.price}</span>
                <span className="pb-1 text-xs text-muted">/ month</span>
              </div>
            </div>

            <ul className="flex-1 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm leading-relaxed text-muted">
                  <Check size={16} className="mt-0.5 shrink-0 text-ok" />
                  {feature}
                </li>
              ))}
            </ul>

            <Link href={href} className={cn("btn btn-sm btn-block", plan.popular ? "btn-primary" : "btn-outline")}>
              {plan.price === 0 ? "Start for free" : `Choose ${plan.name}`}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
