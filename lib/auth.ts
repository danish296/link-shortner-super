import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import {
  createHmac,
  randomBytes,
  scrypt as scryptCb,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { get, run } from "./db";
import { ApiError } from "./http";
import type { PlanId } from "./plans";

const scrypt = promisify(scryptCb);
const SESSION_COOKIE = "ls_session";
const SECRET = process.env.APP_SECRET || "linkshort-local-dev-secret-change-me";
const SESSION_TTL = 30 * 24 * 60 * 60 * 1000;

export interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  plan: PlanId;
  email_verified: number;
  verify_token: string | null;
  reset_token: string | null;
  reset_expires: number | null;
  api_key: string | null;
  auto_renew: number;
  plan_since: number | null;
  created_at: number;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hex] = String(stored || "").split(":");
  if (!salt || !hex) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hex, "hex");
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(derived, expected);
}

export function createApiKey(): string {
  return `ls_live_${randomBytes(20).toString("hex")}`;
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expires = Date.now() + SESSION_TTL;
  run("INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)", token, userId, expires, Date.now());
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.COOKIE_SECURE === "1",
    expires: new Date(expires),
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) run("DELETE FROM sessions WHERE id = ?", token);
  jar.delete(SESSION_COOKIE);
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = get<User>(
    `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > ?`,
    token,
    Date.now()
  );
  if (!row) {
    run("DELETE FROM sessions WHERE id = ?", token);
    return null;
  }
  return row;
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireApiUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "Not authenticated");
  return user;
}

export async function apiKeyUser(req: Request): Promise<User> {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) throw new ApiError(401, "Missing API key. Send 'Authorization: Bearer <key>'.");
  const user = get<User>("SELECT * FROM users WHERE api_key = ?", token);
  if (!user) throw new ApiError(401, "Invalid API key");
  return user;
}

function unlockSignature(code: string, passwordHash: string): string {
  return createHmac("sha256", SECRET).update(`${code}:${passwordHash}`).digest("hex").slice(0, 40);
}

export function unlockCookieName(code: string): string {
  return `ls_unlock_${code}`;
}

export async function isUnlocked(code: string, passwordHash: string): Promise<boolean> {
  const jar = await cookies();
  return jar.get(unlockCookieName(code))?.value === unlockSignature(code, passwordHash);
}

export async function grantUnlock(code: string, passwordHash: string): Promise<void> {
  const jar = await cookies();
  jar.set(unlockCookieName(code), unlockSignature(code, passwordHash), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
}

export function verifyTokenSignature(token: string): boolean {
  return typeof token === "string" && token.length >= 20;
}
