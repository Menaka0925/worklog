
-- ============================================
-- Migration 1: Create User Profiles
-- ============================================

-- 1. Create user profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Add avatar_url column if table already exists, and remove unused columns
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT

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
    email,
    avatar_url
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.user_profiles.avatar_url),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- 7. Trigger on Supabase Auth registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 8. Backfill profiles for existing Auth users
INSERT INTO public.user_profiles (id, full_name, email, avatar_url)
SELECT
  id,
  COALESCE(raw_user_meta_data ->> 'full_name', ''),
  email,
  raw_user_meta_data ->> 'avatar_url'
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  avatar_url = COALESCE(EXCLUDED.avatar_url, public.user_profiles.avatar_url);
