import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { claimLocalState, pullGameState, releaseLocalState } from '@/lib/gameSync';
import { useEnergyStore } from '@/stores/energyStore';
import { useRaidStore } from '@/stores/raidStore';
import { useSeasonStore } from '@/stores/seasonStore';
import { useUserStore } from '@/stores/userStore';

const DECAY_TICK_MS = 15 * 60 * 1000;

const tickDecay = () => {
  const until = useUserStore.getState().effects.decayInhibitorUntil;
  useEnergyStore.getState().applyDecay(until ? new Date(until) : null);
};

/** Loads the signed-in player's game and keeps background systems (decay, season) running. */
export function GameSync() {
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      releaseLocalState();
      return;
    }

    let cancelled = false;
    claimLocalState(userId);

    (async () => {
      await pullGameState(userId);
      if (cancelled) return;
      tickDecay();

      await useSeasonStore.getState().fetchActiveSeason();
      if (cancelled) return;
      await useSeasonStore.getState().fetchParticipation(userId);

      const season = useSeasonStore.getState().activeSeason;
      if (season && !cancelled) await useRaidStore.getState().fetchTotals(season.id);
    })();

    const interval = setInterval(tickDecay, DECAY_TICK_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [userId]);

  return null;
}
