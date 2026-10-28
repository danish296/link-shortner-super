import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { usageFor } from "@/lib/quota";
import { BillingView, type InvoiceItem } from "@/components/billing/billing-view";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const user = await requireUser();
  const usage = usageFor(user.id);
  const invoices = all<InvoiceItem>(
    "SELECT id, plan, amount_cents, status, created_at FROM invoices WHERE user_id = ? ORDER BY created_at DESC LIMIT 24",
    user.id
  );

  return (
    <BillingView
      currentPlan={user.plan}
      autoRenew={Boolean(user.auto_renew)}
      planSince={user.plan_since}
      usage={usage}
      invoices={invoices}
    />
  );
}
