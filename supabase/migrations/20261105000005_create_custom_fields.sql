-- Migration: Create custom_fields table, RLS policies, and indexes

-- 1. Create Custom Fields Definition Table
create table if not exists public.custom_fields (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  field_type text not null,
  options jsonb,
  required boolean default false,
  is_visible boolean default true,
  display_order int default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table public.custom_fields enable row level security;

-- 3. Strict RLS Policies
create policy "Users can select own custom fields"
  on public.custom_fields
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own custom fields"
  on public.custom_fields
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own custom fields"
  on public.custom_fields
  for update
  using (auth.uid() = user_id);

create policy "Users can delete own custom fields"
  on public.custom_fields
  for delete
  using (auth.uid() = user_id);

-- 4. Index
create index if not exists idx_custom_fields_user on public.custom_fields(user_id, display_order);

