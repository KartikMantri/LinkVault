# LinkVault — Execution Plan

Each phase should leave you with something working, not just scaffolding.

## Phase 0 — Accounts & setup ✅
- Sign up: Vercel, Supabase, Groq (you do this — see tech-stack.md)
- Scaffold Next.js app in `D:\LinkVault`
- Create Supabase project, get URL + anon key
- Get Groq API key
- `.env.local` with all keys

## Phase 1 — Data layer ✅
- Create `links` table in Supabase (schema per design.md)
- Connect Next.js to Supabase client
- Verify: can insert/read a row manually via a test script

## Phase 2 — Manual capture (core loop, no AI yet) ✅
- "Add Link" form → paste URL → server action fetches OG metadata → saves row
- Library page lists saved links (title, thumbnail, source)
- **Milestone: you can paste a link and see it appear in a list.** This alone is already more useful than WhatsApp Saved Messages.

## Phase 3 — AI enrichment ✅
- On save, call Groq (Llama 3.3 70B, text-only) with title + caption → summary/category/tags
- Update the record once processing completes
- Handle failure gracefully (link still saved, just unprocessed — and skipped entirely rather than tagging garbage if there's no scraped content at all)
- **Milestone: saved links show an AI summary and category automatically.**

## Phase 3.5 — Nested folders ✅ (added mid-build, not in original plan)
- Unlimited-depth folders, breadcrumb navigation, move-to-folder from any view
- Source-based auto-routing (Instagram links auto-file into an "Instagram" folder)
- Deleting a folder cascades subfolders but only ever unfiles links, never deletes them

## Phase 4 — Library UX ✅
- Search (title/caption/summary)
- Filter by source
- Delete link
- **Milestone: the app is actually usable day-to-day for manually pasted links.**

## Phase 5 — PWA basics ✅
- `app/manifest.ts`, generated icons (favicon, apple-touch-icon, 192/512 install icons) via `next/og`
- Installable to home screen on Android and iOS
- Basic offline shell — not done (low priority, skipped)

## Phase 6 — Android Share Target ✅
- `share_target` in the manifest + `/share-target` route parses whatever field (`url`/`text`/`title`) actually contains the link — needed since Instagram's share sheet puts the URL inside `text`, not `url`
- **Milestone: one-tap save from Instagram on Android — verified working.**

## Phase 7 — iOS Shortcut ✅
- Personal API tokens (hashed at rest, `/library/settings` to generate/revoke) authenticate a Shortcuts "Get Contents of URL" action against `/api/save`, since Shortcuts has no browser session to reuse
- Setup instructions live on the settings page itself, with the correct endpoint URL for wherever the app is deployed
- **Milestone: verified end-to-end via a raw API call — token auth, save, scrape, AI-tag all confirmed working. Building the actual Shortcut in the iOS Shortcuts app is a manual step you do on your phone, following the settings-page instructions.**

## v2 (later, not now)
- Manual video upload → frame extraction (ffmpeg) → Claude vision on frames → deeper content analysis
- WhatsApp Business API bot for zero-tap capture
- Weekly digest email/notification surfacing a handful of saved-but-unrevisited links
- Rename folder / edit note & category after save
