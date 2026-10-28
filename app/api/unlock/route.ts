import { NextResponse } from "next/server";
import { getLinkByCode } from "@/lib/links";
import { grantUnlock, verifyPassword } from "@/lib/auth";
import { ApiError, rateLimit, clientIp } from "@/lib/http";

export async function POST(req: Request) {
  const origin = new URL(req.url).origin;
  let code = "";
  try {
    const form = await req.formData();
    code = String(form.get("code") ?? "");
    const password = String(form.get("password") ?? "");
    const link = getLinkByCode(code);
    if (!link) return NextResponse.redirect(new URL("/", origin), 303);
    if (!link.password_hash) return NextResponse.redirect(new URL(`/${link.code}`, origin), 303);

    rateLimit(`unlock:${clientIp(req.headers)}:${link.id}`, 8, 60_000);

    if (!(await verifyPassword(password, link.password_hash))) {
      return NextResponse.redirect(new URL(`/${link.code}?e=1`, origin), 303);
    }

    await grantUnlock(link.code, link.password_hash);
    return NextResponse.redirect(new URL(`/${link.code}`, origin), 303);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.redirect(new URL(code ? `/${code}?e=${status === 429 ? 2 : 1}` : "/", origin), 303);
  }
}
