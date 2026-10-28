import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { usageFor } from "@/lib/quota";
import { DomainsView, type DomainItem } from "@/components/domains/domains-view";

export const dynamic = "force-dynamic";

export default async function DomainsPage() {
  const user = await requireUser();
  const plan = getPlan(user.plan);
  const usage = usageFor(user.id);

  const rows = all<{
    id: string;
    hostname: string;
    verified: number;
    is_active: number;
    token: string;
    created_at: number;
    links: number;
  }>(
    `SELECT d.id, d.hostname, d.verified, d.is_active, d.token, d.created_at,
            (SELECT COUNT(*) FROM links l WHERE l.domain_id = d.id) AS links
     FROM domains d WHERE d.user_id = ? ORDER BY d.created_at DESC`,
    user.id
  );

  const domains: DomainItem[] = rows.map((row) => ({
    id: row.id,
    hostname: row.hostname,
    verified: Boolean(row.verified),
    isActive: Boolean(row.is_active),
    token: row.token,
    createdAt: row.created_at,
    links: Number(row.links),
  }));

  return <DomainsView domains={domains} limit={plan.domains} usage={usage.domains} />;
}
