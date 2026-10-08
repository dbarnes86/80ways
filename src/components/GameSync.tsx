import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { claimLocalState, pullGameState, releaseLocalState } from '@/lib/gameSync';
import { useEnergyStore } from '@/stores/energyStore';
import { useRaidStore } from '@/stores/raidStore';
import { useSeasonStore } from '@/stores/seasonStore';
import { useUserStore } from '@/stores/userStore';
import { useMembershipStore } from '@/stores/membershipStore';
import { isHealthPlatform, syncHealth } from '@/services/healthService';
import { replanNudges } from '@/services/nudges';
import { seedAnnouncedUnlocks } from '@/game/unlocks';
import { useProgressionStore } from '@/stores/progressionStore';
import { announceArrivals } from '@/features/health';

const DECAY_TICK_MS = 15 * 60 * 1000;

const tickDecay = () => {
  const until = useUserStore.getState().effects.decayInhibitorUntil;
  useEnergyStore.getState().applyDecay(until ? new Date(until) : null);
};

async function importFromHealth(userId: string) {
  const result = await syncHealth(userId).catch((e) => {
    console.warn('Apple Health sync failed:', e);
    return null;
  });
  if (result?.arrived) announceArrivals(result.arrived);
}

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
      void useMembershipStore.getState().fetch(userId);
      const pulled = await pullGameState(userId);
      if (cancelled) return;
      seedAnnouncedUnlocks(useProgressionStore.getState().level);
      tickDecay();
      // Only after a good pull, so workouts already saved from another device aren't queued again.
      if (pulled) void importFromHealth(userId);

      await useSeasonStore.getState().fetchActiveSeason();
      if (cancelled) return;
      await useSeasonStore.getState().fetchParticipation(userId);

      const season = useSeasonStore.getState().activeSeason;
      if (season && !cancelled) await useRaidStore.getState().fetchTotals(season.id);
      if (!cancelled) replanNudges();
    })();

    const interval = setInterval(tickDecay, DECAY_TICK_MS);

    // Back from a workout: pick it up as soon as the app comes to the front.
    let resume: { remove: () => Promise<void> } | undefined;
    if (isHealthPlatform()) {
      void import('@capacitor/app').then(({ App }) =>
        App.addListener('resume', () => {
          // Catch up with anything claimed or logged on another device, then look for new workouts.
          void pullGameState(userId).then((ok) => {
            if (ok) void importFromHealth(userId);
            replanNudges();
          });
        }).then((h) => {
          if (cancelled) void h.remove();
          else resume = h;
        }),
      );
    }

    return () => {
      cancelled = true;
      clearInterval(interval);
      void resume?.remove();
    };
  }, [userId]);

  return null;
}
