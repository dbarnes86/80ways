-- =============================================
-- Billing. Same shape as Kadar's:
--   * entitlements is the single source of truth for membership. Only the Stripe webhook
--     (service role) writes it; nothing reads Stripe per request.
--   * billing_events records every Stripe event id once, so a replayed delivery does nothing.
--   * The free tier is the Lift Off starter event. Joining a season, deploying energy and
--     contributing to raids need membership, enforced here by row level security, not the client.
-- =============================================

CREATE TABLE IF NOT EXISTS public.entitlements (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'member')),
  source TEXT CHECK (source IN ('stripe', 'app_store', 'play_store')),
  billing_status TEXT,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  current_period_end TIMESTAMPTZ,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON COLUMN public.entitlements.billing_status IS 'Stripe subscription status as last reported by webhook: active, trialing, past_due, canceled, ...';

ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own entitlement"
  ON public.entitlements FOR SELECT
  USING (auth.uid() = user_id);
-- No insert/update/delete policies: only the service role (the webhook) writes entitlements.

CREATE TRIGGER update_entitlements_updated_at
  BEFORE UPDATE ON public.entitlements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.billing_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload_summary JSONB
);
COMMENT ON TABLE public.billing_events IS 'Every Stripe event id applied once. A replay finds its row and does nothing.';
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;
-- No policies: only the service role reads or writes billing events.

-- ---------------------------------------------
-- Membership check, used by the policies below.
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.is_member(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.entitlements
    WHERE user_id = p_user_id AND tier = 'member'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_member(UUID) TO authenticated;

-- ---------------------------------------------
-- Gate the paid parts of the game.
-- ---------------------------------------------
DROP POLICY IF EXISTS "Users can insert their own participation" ON public.season_participation;
CREATE POLICY "Members can join a season"
  ON public.season_participation FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_member(auth.uid()));

DROP POLICY IF EXISTS "Users can update their own participation" ON public.season_participation;
CREATE POLICY "Members can advance their journey"
  ON public.season_participation FOR UPDATE
  USING (auth.uid() = user_id AND public.is_member(auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own deployments" ON public.energy_deployments;
CREATE POLICY "Members can record deployments"
  ON public.energy_deployments FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_member(auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own raid contributions" ON public.raid_contributions;
CREATE POLICY "Members can contribute to raids"
  ON public.raid_contributions FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_member(auth.uid()));
