-- Migration: Create follow_ups table, RLS policies, and indexes

-- 1. Create Follow-up Items Table
create table if not exists public.follow_ups (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  record_id text references public.records(id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  status text not null default 'Pending',
  priority text default 'medium',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table public.follow_ups enable row level security;

-- 3. Strict RLS Policies
create policy "Users can select own follow ups"
  on public.follow_ups
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own follow ups"
  on public.follow_ups
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own follow ups"
  on public.follow_ups
  for update
  using (auth.uid() = user_id);

create policy "Users can delete own follow ups"
  on public.follow_ups
  for delete
  using (auth.uid() = user_id);

-- 4. Indexes for performance
create index if not exists idx_follow_ups_user_status on public.follow_ups(user_id, status);
create index if not exists idx_follow_ups_record_id on public.follow_ups(record_id);

