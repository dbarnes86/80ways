-- Free players sail their first two legs; the Season Pass carries them the rest of the way.
-- Gives every player a real voyage before the paywall, which the game needs to make sense.
-- Keep FREE_LEGS in src/data/gameConstants.ts in step with the "+ 2" below.

DROP POLICY IF EXISTS "Members can join a season" ON public.season_participation;
CREATE POLICY "Players can join a season"
  ON public.season_participation FOR INSERT
  -- You board where you are: the free window starts at your own leg.
  WITH CHECK (auth.uid() = user_id AND joined_at_leg = current_leg AND status = 'active');

DROP POLICY IF EXISTS "Members can advance their journey" ON public.season_participation;
CREATE POLICY "Players advance through the free legs, members all the way"
  ON public.season_participation FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND (public.is_member(auth.uid()) OR current_leg <= joined_at_leg + 2));

-- Now that every player can update their row, the row has to move only the way the game moves:
-- where you boarded never changes, and nobody skips ahead or declares the voyage finished early.
CREATE OR REPLACE FUNCTION public.guard_participation_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Server-side writes (service role, migrations) are trusted.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.joined_at_leg IS DISTINCT FROM OLD.joined_at_leg
     OR NEW.season_id IS DISTINCT FROM OLD.season_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Boarding details cannot change';
  END IF;
  IF NEW.current_leg < OLD.current_leg OR NEW.current_leg > OLD.current_leg + 1 THEN
    RAISE EXCEPTION 'Legs are sailed one at a time';
  END IF;
  -- Finishing means sailing the last leg (index 10), and only members get that far.
  IF NEW.status = 'completed' AND OLD.status <> 'completed'
     AND NOT (public.is_member(auth.uid()) AND NEW.current_leg >= 10) THEN
    RAISE EXCEPTION 'The voyage is not finished';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_participation_update ON public.season_participation;
CREATE TRIGGER guard_participation_update
  BEFORE UPDATE ON public.season_participation
  FOR EACH ROW EXECUTE FUNCTION public.guard_participation_update();

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
