
-- =============================================
-- SEASONS: Global journey cycles (Season 1 = ATW80, etc.)
-- =============================================
CREATE TABLE public.seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_number INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  total_distance_km NUMERIC NOT NULL DEFAULT 35310,
  current_global_leg INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

-- Seasons are readable by all authenticated users
CREATE POLICY "Seasons are viewable by authenticated users"
  ON public.seasons FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- =============================================
-- PLAYER PROGRESSION: XP, levels, gating
-- =============================================
CREATE TABLE public.player_progression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  starter_event_completed BOOLEAN NOT NULL DEFAULT false,
  starter_event_progress NUMERIC NOT NULL DEFAULT 0,
  total_energy_generated NUMERIC NOT NULL DEFAULT 0,
  total_activities INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.player_progression ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progression"
  ON public.player_progression FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progression"
  ON public.player_progression FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progression"
  ON public.player_progression FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- SEASON PARTICIPATION: Tracks player's season enrollment
-- =============================================
CREATE TABLE public.season_participation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  season_id UUID NOT NULL REFERENCES public.seasons(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  joined_at_leg INTEGER NOT NULL DEFAULT 0,
  current_leg INTEGER NOT NULL DEFAULT 0,
  leg_progress NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, season_id)
);

ALTER TABLE public.season_participation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own participation"
  ON public.season_participation FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own participation"
  ON public.season_participation FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation"
  ON public.season_participation FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- ENERGY DEPLOYMENTS: Track energy usage per leg
-- =============================================
CREATE TABLE public.energy_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  season_id UUID NOT NULL REFERENCES public.seasons(id),
  leg_id TEXT NOT NULL,
  energy_type TEXT NOT NULL CHECK (energy_type IN ('nautical', 'terrestrial', 'transport', 'strength')),
  amount NUMERIC NOT NULL,
  efficiency NUMERIC NOT NULL DEFAULT 1.0,
  effective_amount NUMERIC NOT NULL,
  deployed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.energy_deployments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deployments"
  ON public.energy_deployments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deployments"
  ON public.energy_deployments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_seasons_updated_at
  BEFORE UPDATE ON public.seasons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_player_progression_updated_at
  BEFORE UPDATE ON public.player_progression
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_season_participation_updated_at
  BEFORE UPDATE ON public.season_participation
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed Season 1
INSERT INTO public.seasons (season_number, name, description, start_date, end_date, status, total_distance_km, current_global_leg)
VALUES (
  1,
  'Around the World in 80 Ways',
  'The inaugural journey following Phileas Fogg''s legendary route from London, through Suez, Bombay, Calcutta, Hong Kong, Yokohama, San Francisco, New York, Liverpool, and back to London.',
  '2026-03-01T00:00:00Z',
  '2026-08-31T23:59:59Z',
  'upcoming',
  35310,
  0
);
