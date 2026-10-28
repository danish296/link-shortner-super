# LinkShort

A self-hosted link shortener with branded short links, QR codes, campaigns, bio pages and click analytics. Built as a single Next.js app with a local SQLite database — no external services, no build pipeline beyond `next build`.

![LinkShort dashboard](docs/screenshot-dashboard.png)

## Highlights

- **Short links** — custom aliases, expiry dates, click caps, password protection, active/paused toggles and bulk actions.
- **Click analytics** — 7/30/90/365 day windows, country/city/device/browser/OS/referrer breakdowns, unique-visitor deduplication, bot filtering, CSV export.
- **QR codes** — foreground/background colours, quiet-zone margin, error-correction level, centre label, PNG/SVG export.
- **Campaigns** — group links, compare performance, share traffic between A/B variants.
- **Bio pages** — themed public pages at `/p/[slug]` with social, heading and text blocks and their own click tracking.
- **Custom domains** — add and verify (DNS TXT) branded domains.
- **Plans and billing** — Free/Basic/Pro/Growth limits enforced at the API layer, invoices, auto-renew toggle.
- **Public REST API** — bearer-key endpoints under `/api/v1` with per-plan request limits.
- **Two themes** — midnight-black default with a light theme, both driven by one CSS token set.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router, React 19, Server Actions) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 with `@theme inline` tokens in `app/globals.css` |
| Data | SQLite via `node:sqlite` (built into Node) |
| Icons | Phosphor Icons |
| QR rendering | `qrcode` |
| Auth | Signed HTTP-only session cookie (HMAC-SHA256), scrypt password hashes |

## Getting started

Requires **Node.js 22.5+** (24 recommended) — the app uses the built-in `node:sqlite` module.

```bash
npm install
npm run dev
```

Open http://localhost:3000. The database is created and seeded on first request at `data/linkshort.db`.

Sign in with the seeded demo account:

```
email:    demo@linkshort.app
password: demo1234
```

Delete `data/` to start over with a fresh seed.

## Configuration

All configuration is optional for local development.

| Variable | Default | Purpose |
| --- | --- | --- |
| `APP_SECRET` | dev placeholder | HMAC key for session cookies and click signatures. **Set this in production.** |
| `APP_URL` | request origin | Public base URL used for generated short links, QR payloads and email links. |
| `DATABASE_PATH` | `data/linkshort.db` | Absolute path to the SQLite file. |
| `COOKIE_SECURE` | unset | Set to `1` to mark the session cookie `Secure` (do this behind HTTPS). |

Create a `.env.local` for local overrides; it is git-ignored.

## Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm run start      # serve the production build
npm run typecheck  # tsc --noEmit
```

## Routes

Public: `/` (marketing), `/pricing`, `/docs`, `/terms`, `/privacy`, `/cookies`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/[code]` (redirect), `/p/[slug]` (bio page).

App (session required): `/app/dashboard`, `/app/links`, `/app/links/[id]`, `/app/analytics`, `/app/campaigns`, `/app/qrcodes`, `/app/domains`, `/app/pages`, `/app/pages/[id]`, `/app/billing`, `/app/api`, `/app/settings`.

Public API (bearer key): `POST /api/v1/shorten`, `GET|POST /api/v1/links`, `GET /api/v1/links/[code]`.

## Project structure

```
app/
  (marketing)/      landing, pricing, docs, legal
  (auth)/           login, register, password reset, verification
  app/              authenticated dashboard and product screens
  api/              route handlers (auth, links, analytics, billing, v1)
  p/[slug]/         public bio page
components/         UI primitives, charts, feature views, marketing sections
lib/                db, auth, plans, tracking, links, QR, formatting helpers
data/               SQLite database (git-ignored)
```

## Design system

Colours live in one place — `app/globals.css` — as CSS custom properties mapped into Tailwind via `@theme inline`.

- Surfaces: midnight black (`--bg`, `--panel`, `--card`), white in the light theme.
- Primary: cobalt blue (`--brand`) for fills, `--brand-ink` for text and icons on dark surfaces.
- Accent: acid lime (`--accent`) for highlights, `--accent-fg` for readable lime text.
- Semantic colours (`--ok`, `--warn`, `--bad`) are reserved for status, never for decoration.
- Charts use `--chart-1..6`; bar lists encode magnitude with one colour, donuts encode categories.

## Status

This is a complete, working product build backed by a local database, not a mockup. Payments are recorded as invoices without a real processor, rate limiting is in-process, and email verification/reset links are written to the server log instead of being sent. Wire up a mail provider, a payment provider and a shared rate-limit store before exposing it publicly.

## License

MIT
