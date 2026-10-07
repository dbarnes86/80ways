-- =============================================
-- Finish the core game loop:
--   * activities log (cross-device history)
--   * game_state on player_progression (energy, credits, inventory, effects)
--   * raid contributions (community events)
--   * rolling seasons + leaderboard / raid aggregate RPCs
-- =============================================

-- ---------------------------------------------
-- ACTIVITIES
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  target_energy_type TEXT NOT NULL CHECK (target_energy_type IN ('nautical', 'terrestrial', 'transport', 'strength')),
  intensity TEXT NOT NULL CHECK (intensity IN ('light', 'moderate', 'vigorous')),
  duration_min INTEGER NOT NULL CHECK (duration_min BETWEEN 1 AND 600),
  distance_km NUMERIC,
  base_energy NUMERIC NOT NULL,
  actual_energy NUMERIC NOT NULL,
  efficiency NUMERIC NOT NULL,
  booster_used TEXT,
  notes TEXT,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activities_user_performed_idx
  ON public.activities (user_id, performed_at DESC);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activities"
  ON public.activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities"
  ON public.activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------
-- GAME STATE (energy reserves, credits, boosters)
-- ---------------------------------------------
ALTER TABLE public.player_progression
  ADD COLUMN IF NOT EXISTS game_state JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ---------------------------------------------
-- RAID CONTRIBUTIONS
-- Raids are scheduled deterministically from the season start date
-- (see src/data/raids.ts); raid_key identifies the event within a season.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.raid_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES public.seasons(id),
  raid_key TEXT NOT NULL,
  energy_type TEXT NOT NULL CHECK (energy_type IN ('nautical', 'terrestrial', 'transport', 'strength')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  effective_amount NUMERIC NOT NULL CHECK (effective_amount > 0),
  contributed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS raid_contributions_raid_idx
  ON public.raid_contributions (season_id, raid_key);

ALTER TABLE public.raid_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own raid contributions"
  ON public.raid_contributions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own raid contributions"
  ON public.raid_contributions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------
-- ROLLING SEASONS
-- Marks seasons active/completed from their dates and opens the next
-- 180-day season when the last one has ended. Safe to call from any client.
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.get_current_season()
RETURNS SETOF public.seasons
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last public.seasons;
  v_start TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.seasons SET status = 'completed'
    WHERE end_date < now() AND status <> 'completed';
  UPDATE public.seasons SET status = 'active'
    WHERE start_date <= now() AND end_date >= now() AND status <> 'active';

  IF NOT EXISTS (SELECT 1 FROM public.seasons WHERE end_date >= now()) THEN
    SELECT * INTO v_last FROM public.seasons ORDER BY season_number DESC LIMIT 1;
    v_start := date_trunc('day', now());

    INSERT INTO public.seasons (season_number, name, description, start_date, end_date, status, total_distance_km, current_global_leg)
    VALUES (
      COALESCE(v_last.season_number, 0) + 1,
      'Around the World in 80 Ways — Season ' || (COALESCE(v_last.season_number, 0) + 1),
      'Fogg''s wager is renewed. London, Suez, Bombay, Calcutta, Hong Kong, Yokohama, San Francisco, New York, Liverpool and home again.',
      v_start,
      v_start + INTERVAL '180 days' - INTERVAL '1 second',
      'active',
      35310,
      0
    )
    ON CONFLICT (season_number) DO NOTHING;
  END IF;

  RETURN QUERY
    SELECT * FROM public.seasons
    WHERE end_date >= now()
    ORDER BY start_date ASC
    LIMIT 1;
END;
$$;

-- ---------------------------------------------
-- LEADERBOARD
-- Top N expedition members for a season, plus the caller's own row.
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.get_season_leaderboard(p_season_id UUID, p_limit INTEGER DEFAULT 25)
RETURNS TABLE (
  rank BIGINT,
  display_name TEXT,
  current_leg INTEGER,
  leg_progress NUMERIC,
  status TEXT,
  xp INTEGER,
  is_you BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked AS (
    SELECT
      sp.user_id,
      ROW_NUMBER() OVER (
        ORDER BY (sp.status = 'completed') DESC, sp.current_leg DESC, sp.leg_progress DESC, COALESCE(pp.xp, 0) DESC, sp.joined_at ASC
      ) AS rank,
      COALESCE(NULLIF(split_part(p.display_name, '@', 1), ''), 'Explorer') AS display_name,
      sp.current_leg,
      sp.leg_progress,
      sp.status,
      COALESCE(pp.xp, 0) AS xp
    FROM public.season_participation sp
    LEFT JOIN public.profiles p ON p.user_id = sp.user_id
    LEFT JOIN public.player_progression pp ON pp.user_id = sp.user_id
    WHERE sp.season_id = p_season_id
  )
  SELECT rank, display_name, current_leg, leg_progress, status, xp, (user_id = auth.uid()) AS is_you
  FROM ranked
  WHERE auth.uid() IS NOT NULL
    AND (rank <= GREATEST(p_limit, 1) OR user_id = auth.uid())
  ORDER BY rank;
$$;

-- ---------------------------------------------
-- RAID AGGREGATES
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.get_raid_totals(p_season_id UUID)
RETURNS TABLE (
  raid_key TEXT,
  total NUMERIC,
  participants BIGINT,
  your_contribution NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    rc.raid_key,
    SUM(rc.effective_amount) AS total,
    COUNT(DISTINCT rc.user_id) AS participants,
    COALESCE(SUM(rc.effective_amount) FILTER (WHERE rc.user_id = auth.uid()), 0) AS your_contribution
  FROM public.raid_contributions rc
  WHERE rc.season_id = p_season_id
    AND auth.uid() IS NOT NULL
  GROUP BY rc.raid_key;
$$;

CREATE OR REPLACE FUNCTION public.get_raid_top_contributors(p_season_id UUID, p_raid_key TEXT, p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
  display_name TEXT,
  total NUMERIC,
  is_you BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(NULLIF(split_part(p.display_name, '@', 1), ''), 'Explorer') AS display_name,
    SUM(rc.effective_amount) AS total,
    (rc.user_id = auth.uid()) AS is_you
  FROM public.raid_contributions rc
  LEFT JOIN public.profiles p ON p.user_id = rc.user_id
  WHERE rc.season_id = p_season_id
    AND rc.raid_key = p_raid_key
    AND auth.uid() IS NOT NULL
  GROUP BY rc.user_id, p.display_name
  ORDER BY total DESC
  LIMIT GREATEST(p_limit, 1);
$$;

GRANT EXECUTE ON FUNCTION public.get_current_season() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_season_leaderboard(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_raid_totals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_raid_top_contributors(UUID, TEXT, INTEGER) TO authenticated;
