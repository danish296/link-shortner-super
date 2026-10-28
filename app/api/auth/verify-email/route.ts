import { NextResponse } from "next/server";
import { get, run, type Row } from "@/lib/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  if (!token) return NextResponse.redirect(new URL("/login?verify=invalid", url.origin));
  const user = get<Row>("SELECT id FROM users WHERE verify_token = ?", token);
  if (!user) return NextResponse.redirect(new URL("/login?verify=invalid", url.origin));
  run("UPDATE users SET email_verified = 1, verify_token = NULL WHERE id = ?", String(user.id));
  return NextResponse.redirect(new URL("/app/dashboard?verified=1", url.origin));
}
