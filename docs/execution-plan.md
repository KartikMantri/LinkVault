# LinkVault — Execution Plan

Each phase should leave you with something working, not just scaffolding.

## Phase 0 — Accounts & setup
- Sign up: Vercel, Supabase, Anthropic (you do this — see tech-stack.md)
- Scaffold Next.js app in `D:\LinkVault`
- Create Supabase project, get URL + anon key
- Get Anthropic API key
- `.env.local` with all three

## Phase 1 — Data layer
- Create `links` table in Supabase (schema per design.md)
- Connect Next.js to Supabase client
- Verify: can insert/read a row manually via a test script

## Phase 2 — Manual capture (core loop, no AI yet)
- "Add Link" form → paste URL → server action fetches OG metadata → saves row
- Library page lists saved links (title, thumbnail, source)
- **Milestone: you can paste a link and see it appear in a list.** This alone is already more useful than WhatsApp Saved Messages.

## Phase 3 — AI enrichment
- On save, call Claude with caption + thumbnail → summary/category/tags
- Update the record once processing completes
- Handle failure gracefully (link still saved, just unprocessed)
- **Milestone: saved links show an AI summary and category automatically.**

## Phase 4 — Library UX
- Search (title/caption/summary/tags)
- Filter by source and category
- Link detail view, edit note, delete
- **Milestone: the app is actually usable day-to-day for manually pasted links.**

## Phase 5 — PWA basics
- `manifest.json`, icons, installable to home screen
- Basic offline shell (optional, low priority)

## Phase 6 — Android Share Target
- Wire up Web Share Target API so "Share → LinkVault" works from Instagram/WhatsApp
- **Milestone: one-tap save from Instagram on Android.**

## Phase 7 — iOS Shortcut
- Build a Shortcuts recipe that POSTs a shared URL to an authenticated LinkVault API endpoint
- Document the install steps (Shortcuts can be shared via a link)
- **Milestone: one-tap save from Instagram on iOS.**

## v2 (later, not now)
- Manual video upload → frame extraction (ffmpeg) → Claude vision on frames → deeper content analysis
- WhatsApp Business API bot for zero-tap capture
- Weekly digest email/notification surfacing a handful of saved-but-unrevisited links
- Collections (manual curation on top of AI categories)

## Suggested build order for our sessions

Phases 0–2 first (get the core loop working end to end before any AI or polish) → Phase 3 (AI is the payoff moment) → Phase 4 (make it pleasant to use) → Phases 5–7 (capture automation, once the core product is proven useful to you).
