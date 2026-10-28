import { NextResponse } from "next/server";
import { get, run } from "@/lib/db";
import { isUnlocked } from "@/lib/auth";
import { applyUtm, getLinkByCode, linkStatus } from "@/lib/links";
import { renderErrorPage, renderPasswordPage, renderRedirectPage } from "@/lib/html";
import { logLinkClick } from "@/lib/track";

export const dynamic = "force-dynamic";

function page(body: string, status: number): NextResponse {
  return new NextResponse(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "referrer-policy": "no-referrer",
    },
  });
}

export async function GET(req: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const url = new URL(req.url);

  if (!/^[A-Za-z0-9_-]{1,64}$/.test(code)) {
    return page(renderErrorPage({ badge: "404", title: "Link not found", message: "This short link doesn't exist." }), 404);
  }

  const link = getLinkByCode(code);
  if (!link) {
    return page(
      renderErrorPage({
        badge: "404",
        title: "Link not found",
        message: "This short link doesn't exist or has been deleted. Check the address you were given.",
      }),
      404
    );
  }

  const status = linkStatus(link);
  if (status === "inactive") {
    return page(
      renderErrorPage({
        badge: "Disabled",
        title: "This link is paused",
        message: "The owner has temporarily deactivated this short link. Please check back later.",
      }),
      410
    );
  }
  if (status === "expired") {
    return page(
      renderErrorPage({
        badge: "Expired",
        title: "This link has expired",
        message: "This short link is no longer available. Reach out to the owner for a fresh one.",
      }),
      410
    );
  }
  if (status === "limit") {
    return page(
      renderErrorPage({
        badge: "Limit reached",
        title: "This link hit its click limit",
        message: "The maximum number of visits for this link has been reached, so it is now closed.",
      }),
      410
    );
  }

  if (link.password_hash) {
    const unlocked = await isUnlocked(link.code, link.password_hash);
    if (!unlocked) {
      const errorFlag = url.searchParams.get("e");
      const hasError = errorFlag === "1" || errorFlag === "2";
      return page(renderPasswordPage(link.code, link.title || link.code, hasError), 401);
    }
  }

  const qrParam = url.searchParams.get("qr");
  let qrId: string | null = null;
  if (qrParam) {
    const qr = get<{ id: string }>("SELECT id FROM qrcodes WHERE id = ? AND link_id = ?", qrParam, link.id);
    if (qr) qrId = qr.id;
  }
  const isQr = Boolean(qrId) || url.searchParams.get("src") === "qr";

  let destination = link.url;
  let variant: "A" | "B" | null = null;
  if (link.variant_b) {
    const chooseB = Math.random() * 100 < Number(link.ab_weight || 50);
    variant = chooseB ? "B" : "A";
    if (chooseB) destination = link.variant_b;
  }
  destination = applyUtm(destination, link);

  const capacity = run(
    "UPDATE links SET click_count = click_count + 1 WHERE id = ? AND (max_clicks IS NULL OR click_count < max_clicks)",
    link.id
  );
  if (Number(capacity.changes) !== 1) {
    return page(
      renderErrorPage({
        badge: "Limit reached",
        title: "This link hit its click limit",
        message: "The maximum number of visits for this link has been reached, so it is now closed.",
      }),
      410
    );
  }

  logLinkClick(link, req.headers, { isQr, variant, qrId });

  if (link.pixel_meta || link.pixel_google || link.pixel_tiktok) {
    return page(
      renderRedirectPage(destination, {
        meta: link.pixel_meta,
        google: link.pixel_google,
        tiktok: link.pixel_tiktok,
      }),
      200
    );
  }

  return NextResponse.redirect(destination, {
    status: 302,
    headers: { "cache-control": "no-store" },
  });
}
