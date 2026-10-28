import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { getBaseUrl } from "@/lib/server-url";
import { QrCodesView, type QrItem, type QrLinkOption } from "@/components/qrcodes/qrcodes-view";

export const dynamic = "force-dynamic";

export default async function QrCodesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const openWithLink = (Array.isArray(params.link) ? params.link[0] : params.link) ?? "";
  const base = await getBaseUrl();
  const plan = getPlan(user.plan);

  const rows = all<{
    id: string;
    link_id: string;
    name: string;
    fg: string;
    bg: string;
    margin: number;
    ecc: string;
    logo: string | null;
    scans: number;
    created_at: number;
    code: string;
    title: string | null;
  }>(
    `SELECT q.id, q.link_id, q.name, q.fg, q.bg, q.margin, q.ecc, q.logo, q.scans, q.created_at, l.code, l.title
     FROM qrcodes q JOIN links l ON l.id = q.link_id
     WHERE q.user_id = ? ORDER BY q.created_at DESC`,
    user.id
  );

  const codes: QrItem[] = rows.map((row) => ({
    id: row.id,
    linkId: row.link_id,
    name: row.name,
    fg: row.fg,
    bg: row.bg,
    margin: row.margin,
    ecc: row.ecc,
    logo: row.logo,
    scans: row.scans,
    createdAt: row.created_at,
    code: row.code,
    title: row.title,
    shortUrl: `${base}/${row.code}`,
  }));

  const links: QrLinkOption[] = all<{ id: string; code: string; title: string | null }>(
    "SELECT id, code, title FROM links WHERE user_id = ? ORDER BY created_at DESC LIMIT 200",
    user.id
  ).map((row) => ({ ...row, shortUrl: `${base}/${row.code}` }));

  return (
    <QrCodesView
      codes={codes}
      links={links}
      limit={plan.qrcodes}
      baseUrl={base}
      openWithLink={openWithLink || undefined}
    />
  );
}
