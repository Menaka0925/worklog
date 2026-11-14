-- Migration: Create user_categories table, RLS policies, and indexes

-- 1. Create User Configurable Categories Table
create table if not exists public.user_categories (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table public.user_categories enable row level security;

-- 3. Strict RLS Policies
create policy "Users can select own categories"
  on public.user_categories
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own categories"
  on public.user_categories
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own categories"
  on public.user_categories
  for update
  using (auth.uid() = user_id);

create policy "Users can delete own categories"
  on public.user_categories
  for delete
  using (auth.uid() = user_id);

-- 4. Index
create index if not exists idx_user_categories_user on public.user_categories(user_id);

