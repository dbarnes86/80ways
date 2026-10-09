import { beforeEach, describe, expect, it } from 'vitest';
import { HISTORY_XP_CAP, MAIN_JOURNEY_UNLOCK_LEVEL, STARTER_EVENT } from '@/data/gameConstants';
import { logActivity } from '@/lib/gameActions';
import { useActivityStore } from '@/stores/activityStore';
import { useEnergyStore } from '@/stores/energyStore';
import { useProgressionStore } from '@/stores/progressionStore';
import { useUserStore } from '@/stores/userStore';

const DAY = 86_400_000;
const workout = (i: number, history: boolean) => ({
  id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
  activityType: 'Running',
  targetType: 'terrestrial' as const,
  durationMin: 45,
  intensity: 'vigorous' as const,
  distanceKm: 8,
  // Yesterday or earlier, so the daily-mission bonus stays out of the sums.
  performedAt: new Date(Date.now() - (i + 1) * DAY),
  useAmplifier: false,
  useMultiCharge: false,
  history,
});

describe('workouts from before the player joined', () => {
  beforeEach(() => {
    useActivityStore.getState().reset();
    useEnergyStore.getState().reset();
    useProgressionStore.getState().reset();
    useUserStore.getState().reset();
  });

  it('a big week pays full energy but capped XP: it lights Lift Off and stops at the map, not level 5', () => {
    const results = Array.from({ length: 9 }, (_, i) => logActivity(workout(i, true)));
    expect(results.every((r) => r.energy > 0)).toBe(true);
    expect(useUserStore.getState().historyXp).toBe(HISTORY_XP_CAP);
    // The week's energy completes Lift Off, which pays its own XP on top of the capped history.
    const p = useProgressionStore.getState();
    expect(p.starterEventCompleted).toBe(true);
    expect(p.xp).toBe(HISTORY_XP_CAP + STARTER_EVENT.xpReward);
    expect(p.level).toBe(MAIN_JOURNEY_UNLOCK_LEVEL);
  });

  it('workouts after joining pay XP in full', () => {
    for (let i = 0; i < 9; i++) logActivity(workout(i, true));
    const fresh = logActivity(workout(20, false));
    expect(fresh.xp).toBeGreaterThan(0);
    expect(useUserStore.getState().historyXp).toBe(HISTORY_XP_CAP);
  });
});
