-- =========================================================================
-- WorkTrace Complete Permission & Table Setup for Supabase
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- =========================================================================

-- 1. Grant USAGE on public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Grant table permissions on existing core tables
GRANT ALL ON TABLE public.records TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.follow_ups TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.user_profiles TO anon, authenticated, service_role;

-- 3. Ensure custom_fields table exists with RLS & grants
CREATE TABLE IF NOT EXISTS public.custom_fields (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  field_type TEXT NOT NULL,
  options JSONB,
  required BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true,
  display_order INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can select own custom fields' AND tablename = 'custom_fields') THEN
    CREATE POLICY "Users can select own custom fields" ON public.custom_fields FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own custom fields' AND tablename = 'custom_fields') THEN
    CREATE POLICY "Users can insert own custom fields" ON public.custom_fields FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own custom fields' AND tablename = 'custom_fields') THEN
    CREATE POLICY "Users can update own custom fields" ON public.custom_fields FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own custom fields' AND tablename = 'custom_fields') THEN
    CREATE POLICY "Users can delete own custom fields" ON public.custom_fields FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

GRANT ALL ON TABLE public.custom_fields TO anon, authenticated, service_role;

-- 4. Ensure user_categories table exists with RLS & grants
CREATE TABLE IF NOT EXISTS public.user_categories (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.user_categories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can select own categories' AND tablename = 'user_categories') THEN
    CREATE POLICY "Users can select own categories" ON public.user_categories FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own categories' AND tablename = 'user_categories') THEN
    CREATE POLICY "Users can insert own categories" ON public.user_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own categories' AND tablename = 'user_categories') THEN
    CREATE POLICY "Users can update own categories" ON public.user_categories FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own categories' AND tablename = 'user_categories') THEN
    CREATE POLICY "Users can delete own categories" ON public.user_categories FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

GRANT ALL ON TABLE public.user_categories TO anon, authenticated, service_role;

-- 5. Automatically grant future privileges for all tables, sequences, and functions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
