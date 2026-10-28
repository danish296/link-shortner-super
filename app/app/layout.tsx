import { requireUser } from "@/lib/auth";
import { getPlan } from "@/lib/plans";
import { usageFor } from "@/lib/quota";
import { AppShell } from "@/components/app-shell";
import { VerifyBanner } from "@/components/verify-banner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const plan = getPlan(user.plan);
  const usage = usageFor(user.id);

  return (
    <AppShell
      user={{ name: user.name, email: user.email, plan: user.plan, emailVerified: Boolean(user.email_verified) }}
      planName={plan.name}
      linksUsed={usage.linksThisMonth}
      linksLimit={plan.linksPerMonth}
    >
      {user.email_verified ? null : <VerifyBanner />}
      {children}
    </AppShell>
  );
}
