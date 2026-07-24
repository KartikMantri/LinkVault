-- LinkVault schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query)

create extension if not exists "pgcrypto";

create type link_source as enum ('instagram', 'whatsapp_web', 'youtube', 'other');
create type link_status as enum ('pending', 'processed', 'error');

create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  parent_id uuid references public.folders (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists folders_user_id_parent_id_idx
  on public.folders (user_id, parent_id);

alter table public.folders enable row level security;

create policy "Users can view their own folders"
  on public.folders for select
  using (auth.uid() = user_id);

create policy "Users can insert their own folders"
  on public.folders for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own folders"
  on public.folders for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own folders"
  on public.folders for delete
  using (auth.uid() = user_id);

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  folder_id uuid references public.folders (id) on delete set null,
  url text not null,
  source link_source not null default 'other',
  title text,
  caption text,
  thumbnail_url text,
  ai_summary text,
  ai_category text,
  ai_tags text[],
  status link_status not null default 'pending',
  note text,
  created_at timestamptz not null default now(),

  unique (user_id, url)
);

create index if not exists links_user_id_created_at_idx
  on public.links (user_id, created_at desc);

create index if not exists links_user_id_category_idx
  on public.links (user_id, ai_category);

create index if not exists links_user_id_folder_id_idx
  on public.links (user_id, folder_id);

-- Row Level Security: every user can only ever see/touch their own rows.
alter table public.links enable row level security;

create policy "Users can view their own links"
  on public.links for select
  using (auth.uid() = user_id);

create policy "Users can insert their own links"
  on public.links for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own links"
  on public.links for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own links"
  on public.links for delete
  using (auth.uid() = user_id);
