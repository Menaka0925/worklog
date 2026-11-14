-- 1. Create Activity Records Table
create table if not exists public.records (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null,
  activity_time text not null,
  title text,
  description text not null,
  category text,
  custom_field_values jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.records enable row level security;

-- Strict RLS Policies
create policy "Users can select own records"
  on public.records for select
  using (auth.uid() = user_id);

create policy "Users can insert own records"
  on public.records for insert
  with check (auth.uid() = user_id);

create policy "Users can update own records"
  on public.records for update
  using (auth.uid() = user_id);

create policy "Users can delete own records"
  on public.records for delete
  using (auth.uid() = user_id);

-- Indexes for performance
create index if not exists idx_records_user_date on public.records(user_id, activity_date);
create index if not exists idx_records_user_id on public.records(user_id);