# LinkVault

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A personal link-saving app that actually organizes what you save — instead of a WhatsApp "saved messages" thread you never revisit. Paste a link (or share it from Instagram/iOS), and it gets scraped, AI-tagged, and filed into a folder automatically.

## Features

- **Save from anywhere** — paste a URL in the app, share directly from Instagram on Android, or use an iOS Shortcut. All three paths save instantly and finish tagging in the background.
- **AI tagging** — every saved link gets a one-line summary, a category, and tags, generated from its scraped title/caption (Groq, Llama 3.3 70B).
- **Nested folders** — unlimited depth, with a "Recent" flat feed alongside your manually organized hierarchy. Instagram links auto-file into an "Instagram" folder.
- **Search & filter** — across titles, captions, and AI summaries; filter by source.
- **Installable PWA** — add to your home screen on Android or iOS, no app store.
- **Browser extension** — save the current tab (or right-click any link) from a desktop browser, no app store either. See [`browser-extension/`](browser-extension/).
- **Multi-user, secure by default** — Supabase Auth + Postgres Row Level Security means your data is isolated at the database layer, not just app code.

See [`docs/features.md`](docs/features.md) for the full feature-by-feature implementation reference.

## Tech stack

Next.js 16 (App Router) · Supabase (Postgres + Auth + RLS) · Groq (Llama 3.3 70B) · Tailwind CSS · deployed on Vercel

Full reasoning behind each choice: [`docs/tech-stack.md`](docs/tech-stack.md).

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/KartikMantri/LinkVault.git
cd LinkVault
npm install
```

### 2. Set up Supabase

Create a project at [supabase.com](https://supabase.com), then run the schema in the SQL Editor:

```bash
supabase/schema.sql
```

(If you're updating an existing project rather than starting fresh, the individual `supabase/migration_*.sql` files apply the same changes incrementally.)

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API (publishable/anon key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (secret — needed for the iOS Shortcut endpoint, which has no browser session) |
| `GROQ_API_KEY` | [console.groq.com/keys](https://console.groq.com/keys) |

### 4. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up, and start saving links.

### 5. Deploy

Push to GitHub, import the repo in Vercel, and add the same four environment variables in Project Settings → Environment Variables. No other configuration needed — Vercel auto-detects Next.js.

## Project structure

```
src/
  app/
    actions/          Server Actions (auth, links, folders, tokens)
    api/save/          Bearer-token-authenticated endpoint (iOS Shortcut)
    library/           Recent view, folder browsing, settings
    share-target/       Android Share Target handler
    manifest.ts         PWA manifest
    icon*.tsx           Generated app icons (next/og, no binary assets)
  components/          Client components (forms, cards, token UI)
  lib/                 Shared logic: metadata scraping, AI enrichment,
                       folder tree helpers, Supabase clients, save pipeline
  proxy.ts             Auth guard (Next.js's renamed middleware.ts)
browser-extension/    Manifest V3 extension — save the current tab from desktop
supabase/
  schema.sql           Full schema for a fresh project
  migration_*.sql       Incremental migrations for an existing project
docs/
  features.md           Feature-by-feature implementation reference
  design.md              Data model & screens
  tech-stack.md           Stack choices & reasoning
  execution-plan.md        Build history, phase by phase
```

## A note on this codebase

This project runs on a Next.js version with breaking changes from the training data most AI coding assistants were trained on — `middleware.ts` is renamed to `proxy.ts`, `params`/`searchParams` are async, and so on. If you're using an AI assistant to work on this repo, point it at `node_modules/next/dist/docs/` before it writes code.

## Contributing

PRs and issues are welcome. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for setup instructions, code conventions, and what's intentionally out of scope. Since this app is multi-tenant per user, contributing requires your own free Supabase project rather than a shared dev backend — the setup guide above covers that.

Found a security issue? Please report it via GitHub's [Security Advisories](../../security/advisories/new) rather than a public issue.

## License

[MIT](LICENSE)
