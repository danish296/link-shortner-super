import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { seedDemo } from "./seed";

declare global {
  // eslint-disable-next-line no-var
  var __linkshortDb: DatabaseSync | undefined;
}

export type Row = Record<string, unknown>;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'FREE',
  email_verified INTEGER NOT NULL DEFAULT 0,
  verify_token TEXT,
  reset_token TEXT,
  reset_expires INTEGER,
  api_key TEXT UNIQUE,
  auto_renew INTEGER NOT NULL DEFAULT 1,
  plan_since INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#2f55f0',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_campaigns_user ON campaigns(user_id);

CREATE TABLE IF NOT EXISTS links (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  title TEXT,
  campaign_id TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  password_hash TEXT,
  expires_at INTEGER,
  max_clicks INTEGER,
  click_count INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  pixel_meta TEXT,
  pixel_google TEXT,
  pixel_tiktok TEXT,
  variant_b TEXT,
  ab_weight INTEGER NOT NULL DEFAULT 50,
  domain_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_links_user ON links(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_links_campaign ON links(campaign_id);

CREATE TABLE IF NOT EXISTS clicks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  link_id TEXT,
  ts INTEGER NOT NULL,
  ip_hash TEXT,
  country TEXT,
  city TEXT,
  device TEXT,
  os TEXT,
  browser TEXT,
  referrer TEXT,
  referrer_host TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  is_qr INTEGER NOT NULL DEFAULT 0,
  is_unique INTEGER NOT NULL DEFAULT 1,
  is_bot INTEGER NOT NULL DEFAULT 0,
  variant TEXT,
  page_id TEXT,
  block_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_clicks_user_ts ON clicks(user_id, ts);
CREATE INDEX IF NOT EXISTS idx_clicks_link_ts ON clicks(link_id, ts);

CREATE TABLE IF NOT EXISTS domains (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  hostname TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  token TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_domains_user ON domains(user_id);

CREATE TABLE IF NOT EXISTS qrcodes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  link_id TEXT NOT NULL,
  name TEXT NOT NULL,
  fg TEXT NOT NULL DEFAULT '#04060a',
  bg TEXT NOT NULL DEFAULT '#ffffff',
  margin INTEGER NOT NULL DEFAULT 2,
  ecc TEXT NOT NULL DEFAULT 'M',
  logo TEXT,
  scans INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_qrcodes_user ON qrcodes(user_id);

CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  bio TEXT,
  avatar TEXT,
  theme TEXT NOT NULL DEFAULT 'midnight',
  accent TEXT NOT NULL DEFAULT '#2f55f0',
  is_published INTEGER NOT NULL DEFAULT 1,
  views INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pages_user ON pages(user_id);

CREATE TABLE IF NOT EXISTS page_blocks (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  url TEXT,
  sort INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_blocks_page ON page_blocks(page_id, sort);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PAID',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id, created_at);

CREATE TABLE IF NOT EXISTS unlock_attempts (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  ts INTEGER NOT NULL
);
`;

export function db(): DatabaseSync {
  if (globalThis.__linkshortDb) return globalThis.__linkshortDb;
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const file = process.env.DATABASE_PATH || path.join(dir, "linkshort.db");
  const instance = new DatabaseSync(file);
  instance.exec("PRAGMA journal_mode = WAL;");
  instance.exec("PRAGMA foreign_keys = ON;");
  instance.exec("PRAGMA busy_timeout = 5000;");
  instance.exec(SCHEMA);
  seedDemo(instance);
  globalThis.__linkshortDb = instance;
  return instance;
}

function normalize(params: unknown[]): Array<string | number | null | Uint8Array> {
  return params.map((p) => {
    if (p === undefined || p === null) return null;
    if (typeof p === "boolean") return p ? 1 : 0;
    if (typeof p === "number" || typeof p === "string") return p;
    if (p instanceof Uint8Array) return p;
    return String(p);
  });
}

export function all<T = Row>(sql: string, ...params: unknown[]): T[] {
  const rows = db().prepare(sql).all(...normalize(params)) as Row[];
  // node:sqlite returns null-prototype objects, which cannot cross the server/client boundary.
  return rows.map((row) => ({ ...row })) as T[];
}

export function get<T = Row>(sql: string, ...params: unknown[]): T | undefined {
  const row = db().prepare(sql).get(...normalize(params)) as Row | undefined;
  return row ? ({ ...row } as T) : undefined;
}

export function run(sql: string, ...params: unknown[]) {
  return db().prepare(sql).run(...normalize(params));
}

export function tx<T>(fn: () => T): T {
  const d = db();
  d.exec("BEGIN");
  try {
    const result = fn();
    d.exec("COMMIT");
    return result;
  } catch (error) {
    d.exec("ROLLBACK");
    throw error;
  }
}

export function uid(): string {
  return randomUUID();
}

export function now(): number {
  return Date.now();
}
