# LinkVault — Features & Implementation Reference

A record of what's actually built, how it works, and where the code lives. Written to stay accurate as the source of truth — update this alongside the code, not after the fact.

## Accounts & security

| Feature | How it works | Files |
|---|---|---|
| Email/password auth | Supabase Auth handles signup/login/logout/session | [`app/actions/auth.ts`](../src/app/actions/auth.ts), [`app/login`](../src/app/login/page.tsx), [`app/signup`](../src/app/signup/page.tsx) |
| Route protection | A `proxy.ts` (Next.js's renamed `middleware.ts`) checks the session on every request; redirects unauthenticated users away from `/library/*`, and authenticated users away from `/login` and `/signup` | [`src/proxy.ts`](../src/proxy.ts) |
| Per-user data isolation | Postgres Row Level Security — every table (`links`, `folders`, `api_tokens`) has policies scoping all CRUD to `auth.uid() = user_id`. Enforced at the database layer, not just in application code | [`supabase/schema.sql`](../supabase/schema.sql) |

## Saving links

| Feature | How it works | Files |
|---|---|---|
| Manual paste | A form on the Recent view submits a URL (+ optional note) to a Server Action | [`components/AddLinkForm.tsx`](../src/components/AddLinkForm.tsx), [`app/actions/links.ts`](../src/app/actions/links.ts) |
| Source detection | URL hostname is pattern-matched to `instagram` / `whatsapp_web` / `youtube` / `other` | [`lib/metadata.ts`](../src/lib/metadata.ts) `detectSource()` |
| Duplicate prevention | A `unique (user_id, url)` constraint on `links`; a friendly error surfaces on conflict instead of a 500 | [`supabase/schema.sql`](../supabase/schema.sql), [`lib/save-link.ts`](../src/lib/save-link.ts) |
| Open Graph metadata scraping | Fetches the target page with a browser-like User-Agent, parses `og:title` / `og:description` / `og:image` via `cheerio`. Best-effort — sites that block scraping (403s, auth walls) fail gracefully, the link is still saved with just the raw URL | [`lib/metadata.ts`](../src/lib/metadata.ts) `fetchMetadata()` |
| AI tagging | Groq (`llama-3.3-70b-versatile`, text-only) reads the title + caption and returns a one-line summary, a category, and 3-5 tags as JSON. Skipped entirely (not run on a placeholder string) if metadata scraping produced nothing — prevents nonsense tags like `#no #caption #available` | [`lib/ai/enrich.ts`](../src/lib/ai/enrich.ts) |
| Non-blocking save | Only the row insert blocks the response. Metadata scraping + AI tagging are scheduled via Next's `after()` to run post-response, so Save returns in under a second instead of waiting 2-5s on a scrape + Groq round trip. All three save paths (form, Android share, iOS Shortcut) go through the same function and get this for free | [`lib/save-link.ts`](../src/lib/save-link.ts) |
| Auto-refresh on pending | Client component watches for `status: 'pending'` links and triggers one `router.refresh()` a few seconds after page load, so AI tags appear without a manual reload | [`components/PendingAutoRefresh.tsx`](../src/components/PendingAutoRefresh.tsx) |

## Organizing

| Feature | How it works | Files |
|---|---|---|
| Nested folders | Self-referencing `folders` table (`parent_id`), unlimited depth | [`supabase/schema.sql`](../supabase/schema.sql), [`lib/folders.ts`](../src/lib/folders.ts) |
| Breadcrumb navigation | Walks the `parent_id` chain from the current folder up to root, computed client-side from an already-fetched flat folder list (no recursive queries) | [`lib/folders.ts`](../src/lib/folders.ts) `breadcrumbFor()` |
| Move to folder | A `<select>` on every link card, populated by flattening the folder tree into a depth-indented list | [`lib/folders.ts`](../src/lib/folders.ts) `flattenFolderTree()`, [`components/LinkCard.tsx`](../src/components/LinkCard.tsx) |
| Source-based auto-routing | Instagram links auto-file into an "Instagram" root folder, created on first use via get-or-create | [`lib/folders.ts`](../src/lib/folders.ts) `getOrCreateRootFolder()`, [`lib/save-link.ts`](../src/lib/save-link.ts) |
| Folder deletion | Cascades to subfolders (DB-level `on delete cascade`) but only ever unfiles links inside (`on delete set null`) — links are never deleted as a side effect of deleting a folder | [`supabase/schema.sql`](../supabase/schema.sql), [`app/actions/folders.ts`](../src/app/actions/folders.ts) |
| Recent vs Folders views | "Recent" is a flat, unfiled-or-not feed of everything; "Folders" is purely the manually organized hierarchy | [`app/library/page.tsx`](../src/app/library/page.tsx), [`app/library/folders/`](../src/app/library/folders/) |

## Finding things

| Feature | How it works | Files |
|---|---|---|
| Search | `ilike` substring match across title/caption/AI summary | [`app/library/page.tsx`](../src/app/library/page.tsx) |
| Filter by source | Query param-driven `<select>`, server-side filtering | [`app/library/page.tsx`](../src/app/library/page.tsx) |
| Empty states | Distinguishes "nothing saved yet" from "no results for this search/filter" | [`app/library/page.tsx`](../src/app/library/page.tsx) |

## Capture automation

| Feature | How it works | Files |
|---|---|---|
| PWA / installable | `manifest.ts` + generated icons (favicon, apple-touch-icon, 192/512 install icons) via `next/og` `ImageResponse` — no binary image assets to manage | [`app/manifest.ts`](../src/app/manifest.ts), [`app/icon.tsx`](../src/app/icon.tsx), [`app/apple-icon.tsx`](../src/app/apple-icon.tsx), [`app/icon-192/route.tsx`](../src/app/icon-192/route.tsx), [`app/icon-512/route.tsx`](../src/app/icon-512/route.tsx) |
| Android Share Target | `share_target` in the manifest routes OS-level shares to `/share-target`, which extracts a URL from whichever field actually has it (`url`, `text`, or `title` — Instagram puts it in `text`, not `url`) and saves it | [`app/manifest.ts`](../src/app/manifest.ts), [`app/share-target/page.tsx`](../src/app/share-target/page.tsx), [`lib/extract-url.ts`](../src/lib/extract-url.ts) |
| iOS Shortcut | Personal API tokens (random, SHA-256 hashed at rest, shown once in plaintext at creation) authenticate a `POST /api/save` call from the Shortcuts app's "Get Contents of URL" action — the one path with no browser session to rely on | [`app/library/settings/page.tsx`](../src/app/library/settings/page.tsx), [`app/actions/tokens.ts`](../src/app/actions/tokens.ts), [`lib/tokens.ts`](../src/lib/tokens.ts), [`app/api/save/route.ts`](../src/app/api/save/route.ts), [`lib/supabase/service.ts`](../src/lib/supabase/service.ts) |

## Not built (explicitly out of scope so far)

- Thumbnail image analysis (Groq has no vision-capable chat model available on this account as of testing — confirmed against the live `/models` API, not just docs; planned for a future Anthropic Claude swap)
- WhatsApp auto-capture bot (Business API integration, bigger lift)
- Rename folder / edit note or category after saving
- Offline support / service worker beyond installability
- Weekly digest / resurfacing unread saves

## Stack at a glance

Next.js 16 (App Router, Server Actions, `after()`) · Supabase (Postgres + Auth + RLS) · Groq (Llama 3.3 70B) · Tailwind CSS · Vercel

See [`tech-stack.md`](tech-stack.md) for the reasoning behind each choice, [`design.md`](design.md) for the data model, and [`execution-plan.md`](execution-plan.md) for build history.
