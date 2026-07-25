-- Adds personal API tokens, used by the iOS Shortcut (and anything else
-- that needs to save a link without a browser session).
-- Run this in the Supabase SQL Editor.

create table if not exists public.api_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'iOS Shortcut',
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists api_tokens_user_id_idx on public.api_tokens (user_id);
create index if not exists api_tokens_token_hash_idx on public.api_tokens (token_hash);

alter table public.api_tokens enable row level security;

-- Users can see and revoke their own tokens. There is deliberately no
-- policy allowing users to read token_hash values back out meaningfully —
-- the plaintext token is only ever shown once, at creation time, by the
-- server action before it's hashed.
create policy "Users can view their own tokens"
  on public.api_tokens for select
  using (auth.uid() = user_id);

create policy "Users can delete their own tokens"
  on public.api_tokens for delete
  using (auth.uid() = user_id);

-- Inserts happen via a server action using the user's session, and lookups
-- from the /api/save route happen via the service role key (which bypasses
-- RLS entirely, since that request has no Supabase session/cookie at all).
create policy "Users can create their own tokens"
  on public.api_tokens for insert
  with check (auth.uid() = user_id);
