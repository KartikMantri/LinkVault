-- Adds nested folders on top of the existing schema.
-- Run this in the Supabase SQL Editor.

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

alter table public.links
  add column if not exists folder_id uuid references public.folders (id) on delete set null;

create index if not exists links_user_id_folder_id_idx
  on public.links (user_id, folder_id);
