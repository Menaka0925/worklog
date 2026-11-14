-- ============================================================
-- Migration: Create Account Activity History Table & Tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS public.account_activity_history (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type      TEXT        NOT NULL CHECK (event_type IN ('password_changed', 'password_reset', 'account_paused', 'account_resumed')),
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for chronological queries per user
CREATE INDEX IF NOT EXISTS idx_account_activity_history_user_time
  ON public.account_activity_history (user_id, event_timestamp DESC);

-- Enable Row Level Security
ALTER TABLE public.account_activity_history ENABLE ROW LEVEL SECURITY;

-- Users can only read their own account activity history
DROP POLICY IF EXISTS "Users view own account activity history" ON public.account_activity_history;
CREATE POLICY "Users view own account activity history"
  ON public.account_activity_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- Function: record_account_activity
-- Securely log account activity for the authenticated user.
-- Prevents clients from spoofing user IDs or injecting arbitrary data.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_account_activity(
  p_event_type TEXT,
  p_metadata   JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_new_id  UUID;
BEGIN
  -- Identify authenticated user from Supabase session context
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User is not authenticated';
  END IF;

  -- Validate event type
  IF p_event_type NOT IN ('password_changed', 'password_reset', 'account_paused', 'account_resumed') THEN
    RAISE EXCEPTION 'Invalid event type: %', p_event_type;
  END IF;

  INSERT INTO public.account_activity_history (
    user_id,
    event_type,
    event_timestamp,
    metadata,
    created_at
  )
  VALUES (
    v_user_id,
    p_event_type,
    NOW(),
    COALESCE(p_metadata, '{}'::jsonb),
    NOW()
  )
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_new_id,
    'event_type', p_event_type,
    'event_timestamp', NOW()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_account_activity(TEXT, JSONB) TO authenticated;

-- ----------------------------------------------------------------
-- Update record_password_reset to also record into account_activity_history
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

  -- Insert into password_reset_log
  INSERT INTO public.password_reset_log (user_id, reset_at, reset_month)
  VALUES (p_user_id, NOW(), v_this_month)
  ON CONFLICT (user_id, reset_month) DO NOTHING;

  -- Also log into account_activity_history
  INSERT INTO public.account_activity_history (
    user_id,
    event_type,
    event_timestamp,
    metadata,
    created_at
  )
  VALUES (
    p_user_id,
    'password_reset',
    NOW(),
    jsonb_build_object('method', 'forgot_password_recovery'),
    NOW()
  );

  RETURN jsonb_build_object('allowed', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_password_reset(UUID) TO authenticated;

-- ----------------------------------------------------------------
-- Backfill existing password_reset_log events into account_activity_history
-- ----------------------------------------------------------------
INSERT INTO public.account_activity_history (
  user_id,
  event_type,
  event_timestamp,
  metadata,
  created_at
)
SELECT
  prl.user_id,
  'password_reset',
  prl.reset_at,
  jsonb_build_object('method', 'forgot_password_recovery', 'backfilled', true),
  prl.reset_at
FROM public.password_reset_log prl
WHERE NOT EXISTS (
  SELECT 1 FROM public.account_activity_history aah
  WHERE aah.user_id = prl.user_id
    AND aah.event_type = 'password_reset'
    AND aah.event_timestamp = prl.reset_at
);
