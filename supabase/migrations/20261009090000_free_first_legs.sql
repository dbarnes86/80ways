-- Free players sail their first two legs; the Season Pass carries them the rest of the way.
-- Gives every player a real voyage before the paywall, which the game needs to make sense.
-- Keep FREE_LEGS in src/data/gameConstants.ts in step with the "+ 2" below.

DROP POLICY IF EXISTS "Members can join a season" ON public.season_participation;
CREATE POLICY "Players can join a season"
  ON public.season_participation FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Members can advance their journey" ON public.season_participation;
CREATE POLICY "Players advance through the free legs, members all the way"
  ON public.season_participation FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND (public.is_member(auth.uid()) OR current_leg <= joined_at_leg + 2));

DROP POLICY IF EXISTS "Members can record deployments" ON public.energy_deployments;
CREATE POLICY "Players deploy on the free legs, members on any"
  ON public.energy_deployments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      public.is_member(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.season_participation sp
        WHERE sp.user_id = auth.uid()
          AND sp.season_id = energy_deployments.season_id
          AND sp.current_leg < sp.joined_at_leg + 2
      )
    )
  );
