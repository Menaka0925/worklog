-- ============================================================
-- Password Reset Log Table + Monthly Restriction Enforcement
-- ============================================================

CREATE TABLE IF NOT EXISTS public.password_reset_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reset_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reset_month DATE        NOT NULL DEFAULT date_trunc('month', NOW())::DATE
);

-- Unique constraint: only 1 successful reset per user per calendar month
CREATE UNIQUE INDEX IF NOT EXISTS password_reset_log_user_month_idx
  ON public.password_reset_log (user_id, reset_month);

ALTER TABLE public.password_reset_log ENABLE ROW LEVEL SECURITY;

-- Users can only read their own logs (no INSERT policy for authenticated users — only via function)
CREATE POLICY "Users view own reset log"
  ON public.password_reset_log FOR SELECT
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- Function: check_reset_allowed(p_email TEXT)
-- Called on the forgot-password page BEFORE sending a password
-- reset link. Uses SECURITY DEFINER so it can look up auth.users.
-- Does NOT record anything — read-only check.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_reset_allowed(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id    UUID;
  v_this_month DATE        := date_trunc('month', NOW())::DATE;
  v_next_month DATE        := (date_trunc('month', NOW()) + INTERVAL '1 month')::DATE;
  v_last_reset TIMESTAMPTZ;
BEGIN
  -- Look up user by email (case-insensitive)
  SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = LOWER(p_email) LIMIT 1;

  -- If email not found: silently allow (don't reveal existence)
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('allowed', true);
  END IF;

  -- Check for a successful reset in the current calendar month
  SELECT reset_at INTO v_last_reset
  FROM public.password_reset_log
  WHERE user_id = v_user_id AND reset_month = v_this_month
  LIMIT 1;

  IF v_last_reset IS NOT NULL THEN
    RETURN jsonb_build_object(
      'allowed',          false,
      'next_reset_date',  v_next_month,
      'last_reset_at',    v_last_reset
    );
  END IF;

  RETURN jsonb_build_object('allowed', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_reset_allowed(TEXT) TO anon, authenticated;

-- ----------------------------------------------------------------
-- Function: record_password_reset(p_user_id UUID)
-- Called AFTER a user clicks the email reset link and successfully
-- updates their password via supabase.auth.updateUser().
-- Atomically checks + inserts the monthly record.
-- Returns allowed=true on success, allowed=false if already used.
-- The UNIQUE index prevents concurrent bypass.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_password_reset(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_this_month DATE := date_trunc('month', NOW())::DATE;
  v_next_month DATE := (date_trunc('month', NOW()) + INTERVAL '1 month')::DATE;
  v_last_reset TIMESTAMPTZ;
BEGIN
  -- Re-check inside the function (atomic with the INSERT below)
  SELECT reset_at INTO v_last_reset
  FROM public.password_reset_log
  WHERE user_id = p_user_id AND reset_month = v_this_month
  LIMIT 1;

  IF v_last_reset IS NOT NULL THEN
    RETURN jsonb_build_object(
      'allowed',         false,
      'next_reset_date', v_next_month,
      'last_reset_at',   v_last_reset
    );
  END IF;

  -- Insert — UNIQUE index prevents double-insert under concurrent requests
  INSERT INTO public.password_reset_log (user_id, reset_at, reset_month)
  VALUES (p_user_id, NOW(), v_this_month)
  ON CONFLICT (user_id, reset_month) DO NOTHING;

  RETURN jsonb_build_object('allowed', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_password_reset(UUID) TO authenticated;
