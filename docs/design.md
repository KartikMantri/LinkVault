# LinkVault — Product & Data Design

## Problem

Links (Instagram Reels, WhatsApp-forwarded articles/sites) get saved somewhere and never revisited — no organization, no memory of *why* it was saved, no way to search except scrolling.

## Core loop

1. Paste a link (or share it in, v1.5) into LinkVault
2. LinkVault fetches title/caption/thumbnail automatically
3. Claude reads the caption + thumbnail and generates a short summary, a category, and tags
4. It lands in a searchable, filterable library instead of a dead chat thread

## Data model

### `links` table

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `user_id` | uuid, FK → `auth.users` | owner of this link; RLS enforces isolation per user |
| `url` | text | original link, deduped on this (per-user, not global) |
| `source` | enum: `instagram`, `whatsapp_web`, `youtube`, `other` | inferred from URL domain |
| `title` | text, nullable | from OG tags |
| `caption` | text, nullable | from OG description / oEmbed |
| `thumbnail_url` | text, nullable | from OG image |
| `ai_summary` | text, nullable | 1–2 sentence Claude summary |
| `ai_category` | text, nullable | e.g. "recipe", "workout", "shopping", "article", "meme" |
| `ai_tags` | text[], nullable | freeform tags Claude assigns |
| `status` | enum: `pending`, `processed`, `error` | processing state |
| `note` | text, nullable | your own manual note, optional |
| `created_at` | timestamptz | |

### `collections` table (optional, v1.5)

Manual grouping on top of AI categories — e.g. a "Gift ideas" collection you curate by hand, separate from auto-tagging.

## Screens

**1. Library (home)**
- Feed of saved links, newest first
- Thumbnail + title + AI summary snippet + category chip
- Filter bar: by source (Instagram / WhatsApp / Web), by category
- Search box (searches title, caption, summary, tags)

**2. Add Link**
- Single URL input + optional note
- Submit → shows "processing…" state → row appears in Library once done
- (v1.5: this screen is skipped entirely when saving via Share Target/Shortcut — it happens in the background and just shows up in the Library)

**3. Link Detail**
- Full thumbnail, caption, AI summary, tags, category
- "Open original" button (deep-links to Instagram/WhatsApp/site)
- Edit note, change category, delete

## Processing flow (server side)

```
Save link
  → normalize URL, check for duplicate
  → fetch OG metadata (title, image, description)
  → if Instagram: try oEmbed for caption/thumbnail
  → call Groq (Llama 3.3 70B, text-only) with title + caption
      → get back: summary, category, tags
  → store record, mark status = processed
  → (on any fetch/AI failure: status = error, link still saved with raw URL so nothing is lost)
```

Runs synchronously on save for v1 (a couple seconds' wait is fine for a personal tool); only worth moving to a background queue if it starts feeling slow.

## Visual direction

Minimal, single-column feed — closer to a bookmarking app (Pocket/Raindrop) than a social feed. No infinite scroll gamification; the goal is *finding* things, not consuming more content.
