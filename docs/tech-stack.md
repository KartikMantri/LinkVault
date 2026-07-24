# LinkVault — Tech Stack

## Website or app?

**PWA (Progressive Web App).** It's a website that installs to your home screen and behaves like an app — no App Store review, one codebase for every device.

Why this matters for LinkVault specifically: the whole point is killing the friction of saving a Reel or a WhatsApp link. A PWA can register as a **native Share Target on Android** — "Share → LinkVault" works exactly like "Share → WhatsApp" does today. iOS doesn't support share-target PWAs, but the **Shortcuts app** can add a "Save to LinkVault" action to the iOS share sheet that just POSTs the URL to the API — same one-tap result, no App Store submission needed either.

A native app would only be justified if we needed background processing, deep OS integration, or App Store distribution — none of which apply to a personal tool.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (App Router) + Tailwind CSS | One codebase, server + client in the same project, easy PWA support |
| Hosting | Vercel | Native Next.js support, free hobby tier, HTTPS + env vars out of the box |
| Database | Supabase (Postgres) | Free tier, generous limits for personal use, has Storage built in for v2 video uploads |
| AI | Groq API (Llama 3.3 70B, text-only — title + caption) | Free tier, very fast inference — good enough for summarization/categorization/tagging. Groq has no vision-capable chat model available on this account as of testing (confirmed against the live `/models` endpoint, not docs — docs referenced decommissioned/nonexistent model names), so thumbnail image analysis isn't in scope for now. **Planned swap to Anthropic Claude later**, which does support vision — the AI call is isolated behind one function so swapping providers doesn't touch the rest of the app |
| Metadata extraction | Open Graph scraping (`cheerio` + `fetch`) + Instagram oEmbed where available | Pulls title/caption/thumbnail from most sites without needing a paid API |
| Auth | Supabase Auth (email/password + magic link) | Multi-user from day one — each signup gets an isolated account, no shared passcode |
| Capture | Manual paste (v1) → Android PWA Share Target + iOS Shortcut (v1.5) | Manual first so the core loop works before adding capture automation |

## Supabase features we're using

- **Postgres database** — the `links` table, `user_id` foreign key on every row
- **Auth** — email/password + magic-link signup/login, gives us `auth.users` and a session out of the box, no custom auth code
- **Row Level Security (RLS)** — Postgres policies enforcing "a user can only `SELECT`/`INSERT`/`UPDATE`/`DELETE` rows where `user_id = auth.uid()`" at the database level, not just in app code. This is what makes multi-tenancy safe by default — even a bug in our API code can't leak one user's links to another, because the database itself refuses the query.
- **Storage** — not used in v1, reserved for v2 manual video uploads (per-user buckets, same RLS pattern)
- **Auto-generated REST API (PostgREST)** — lets the frontend query Supabase directly for reads when we don't need custom server logic, cutting down on boilerplate API routes

## Scalability

Supabase's free tier (500MB DB, 50k monthly active users on Auth) comfortably covers many users doing personal link-saving — the data per link is tiny (text + a thumbnail URL, not the media itself). Paid tier is a plan upgrade, not a re-architecture, since it's managed Postgres underneath. Vercel's serverless functions scale automatically per-request, so API load isn't something we manage manually either. The only real scaling lever worth knowing about later: indexing the `links` table on `user_id` and `created_at` (cheap, done in the schema from the start) keeps queries fast as row counts grow.

## What you'll need to sign up for

- **Vercel** account (free) — hosting + deploys from git
- **Supabase** account (free tier) — database + storage
- **Groq** account (free tier) — API key for Llama-based summarization/tagging/vision
- **Anthropic** account — not needed yet; sign up later when we swap in Claude

I can't create these accounts or enter credentials for you — you'll sign up yourself and drop the API keys into a `.env.local` file when we get to that step.

## Explicitly out of scope for v1

- Downloading/scraping actual Instagram video files (against their ToS, blocked by design, fragile even if attempted) — not something this project will do
- WhatsApp Business API auto-capture bot — bigger lift, v2 at earliest
- Frame-by-frame video content analysis — needs manual video upload first (v2)
