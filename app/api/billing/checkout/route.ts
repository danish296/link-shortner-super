import { NextResponse } from "next/server";
import { get, run, uid } from "@/lib/db";
import { requireApiUser, type User } from "@/lib/auth";
import { ApiError, assertSameOrigin, errorResponse, readJson } from "@/lib/http";
import { getPlan, isPlanId, PLANS } from "@/lib/plans";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    const body = await readJson(req);
    const planId = body.plan;
    if (!isPlanId(planId)) throw new ApiError(400, "Unknown plan");

    const plan = PLANS[planId];
    const current: User = get<User>("SELECT * FROM users WHERE id = ?", user.id) as User;
    if (current.plan === planId) throw new ApiError(400, "You're already on this plan");

    run("UPDATE users SET plan = ?, plan_since = ?, auto_renew = 1 WHERE id = ?", planId, Date.now(), user.id);

    if (plan.price > 0) {
      run(
        "INSERT INTO invoices (id, user_id, plan, amount_cents, status, created_at) VALUES (?, ?, ?, ?, 'PAID', ?)",
        uid(), user.id, planId, plan.price * 100, Date.now()
      );
    }

    return NextResponse.json({ ok: true, plan: planId, planName: plan.name });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET() {
  try {
    const user = await requireApiUser();
    const plan = getPlan(user.plan);
    return NextResponse.json({ plan: user.plan, name: plan.name, autoRenew: Boolean(user.auto_renew) });
  } catch (error) {
    return errorResponse(error);
  }
}
