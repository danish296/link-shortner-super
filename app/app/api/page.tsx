import { requireUser } from "@/lib/auth";
import { getPlan } from "@/lib/plans";
import { getBaseUrl } from "@/lib/server-url";
import { ApiView } from "@/components/api/api-view";

export const dynamic = "force-dynamic";

export default async function ApiPage() {
  const user = await requireUser();
  return <ApiView apiKey={user.api_key} baseUrl={await getBaseUrl()} planName={getPlan(user.plan).name} />;
}
