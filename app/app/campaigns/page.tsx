import { requireUser } from "@/lib/auth";
import { getPlan } from "@/lib/plans";
import { usageFor } from "@/lib/quota";
import { campaignSummaries } from "@/lib/stats";
import { CampaignsView } from "@/components/campaigns/campaigns-view";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const user = await requireUser();
  const plan = getPlan(user.plan);
  const usage = usageFor(user.id);
  const campaigns = campaignSummaries(user.id);

  return <CampaignsView campaigns={campaigns} limit={plan.campaigns} usage={usage.campaigns} />;
}
