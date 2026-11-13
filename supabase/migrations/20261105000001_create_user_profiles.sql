
-- ============================================
-- Migration 1: Create User Profiles
-- ============================================

-- 1. Create user profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Remove unused columns (if they exist)
ALTER TABLE public.user_profiles
DROP COLUMN IF EXISTS industry,
DROP COLUMN IF EXISTS job_role,
DROP COLUMN IF EXISTS work_type;

-- 3. Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
ON public.user_profiles
FOR DELETE
USING (auth.uid() = id);

-- 5. Index
CREATE INDEX IF NOT EXISTS idx_user_profiles_id
ON public.user_profiles(id);

-- 6. Function to automatically create a profile
-- whenever a new user registers through Supabase Auth.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    full_name,
    email
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 7. Trigger on Supabase Auth registration
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 8. Backfill profiles for existing Auth users
INSERT INTO public.user_profiles (id, full_name, email)
SELECT
  id,
  COALESCE(raw_user_meta_data ->> 'full_name', ''),
  email
FROM auth.users
ON CONFLICT (id) DO NOTHING;
