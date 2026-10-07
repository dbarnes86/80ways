import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BoosterId } from '@/data/gameConstants';

/**
 * Player wallet, boosters and bookkeeping that isn't XP.
 * Identity (name, email) lives in Supabase auth + the profiles table.
 */
export interface UserGameData {
  inventory: {
    credits: number;
    energyAmplifier: number;
    decayInhibitor: number;
    multiCharge: number;
  };
  effects: {
    /** ISO timestamp — reserves don't decay until then. */
    decayInhibitorUntil: string | null;
  };
  stats: {
    totalDistance: number;
    journeysCompleted: number;
  };
  /** Day key (YYYY-MM-DD) of the last Daily Constitutional reward. */
  lastDailyMission: string | null;
  /** Raid keys (seasonId:raidKey) that have paid out first-contribution XP. */
  raidXpAwarded: string[];
  /** Raid keys (seasonId:raidKey) whose success reward has been claimed. */
  raidRewardsClaimed: string[];
  settings: {
    units: 'metric' | 'imperial';
  };
}

interface UserStore extends UserGameData {
  addCredits: (amount: number) => void;
  spendCredits: (amount: number) => boolean;
  addBooster: (id: BoosterId, count?: number) => void;
  consumeBooster: (id: BoosterId) => boolean;
  setDecayInhibitorUntil: (iso: string | null) => void;
  addDistance: (km: number) => void;
  incrementJourneysCompleted: () => void;
  setLastDailyMission: (dayKey: string) => void;
  markRaidXpAwarded: (key: string) => void;
  markRaidRewardClaimed: (key: string) => void;
  setUnits: (units: 'metric' | 'imperial') => void;
  hydrate: (data: Partial<UserGameData>) => void;
  reset: () => void;
}

const initialData = (): UserGameData => ({
  inventory: { credits: 0, energyAmplifier: 0, decayInhibitor: 0, multiCharge: 0 },
  effects: { decayInhibitorUntil: null },
  stats: { totalDistance: 0, journeysCompleted: 0 },
  lastDailyMission: null,
  raidXpAwarded: [],
  raidRewardsClaimed: [],
  settings: { units: 'metric' },
});

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      ...initialData(),

      addCredits: (amount) => set((s) => ({ inventory: { ...s.inventory, credits: s.inventory.credits + amount } })),

      spendCredits: (amount) => {
        if (get().inventory.credits < amount) return false;
        set((s) => ({ inventory: { ...s.inventory, credits: s.inventory.credits - amount } }));
        return true;
      },

      addBooster: (id, count = 1) => set((s) => ({ inventory: { ...s.inventory, [id]: s.inventory[id] + count } })),

      consumeBooster: (id) => {
        if (get().inventory[id] <= 0) return false;
        set((s) => ({ inventory: { ...s.inventory, [id]: s.inventory[id] - 1 } }));
        return true;
      },

      setDecayInhibitorUntil: (iso) => set((s) => ({ effects: { ...s.effects, decayInhibitorUntil: iso } })),

      addDistance: (km) => set((s) => ({ stats: { ...s.stats, totalDistance: s.stats.totalDistance + km } })),

      incrementJourneysCompleted: () =>
        set((s) => ({ stats: { ...s.stats, journeysCompleted: s.stats.journeysCompleted + 1 } })),

      setLastDailyMission: (dayKey) => set({ lastDailyMission: dayKey }),

      markRaidXpAwarded: (key) => set((s) => ({ raidXpAwarded: Array.from(new Set([...s.raidXpAwarded, key])) })),

      markRaidRewardClaimed: (key) =>
        set((s) => ({ raidRewardsClaimed: Array.from(new Set([...s.raidRewardsClaimed, key])) })),

      setUnits: (units) => set((s) => ({ settings: { ...s.settings, units } })),

      hydrate: (data) => set((s) => ({
        inventory: { ...s.inventory, ...data.inventory },
        effects: { ...s.effects, ...data.effects },
        stats: { ...s.stats, ...data.stats },
        settings: { ...s.settings, ...data.settings },
        lastDailyMission: data.lastDailyMission ?? s.lastDailyMission,
        raidXpAwarded: data.raidXpAwarded ?? s.raidXpAwarded,
        raidRewardsClaimed: data.raidRewardsClaimed ?? s.raidRewardsClaimed,
      })),

      reset: () => set(initialData()),
    }),
    {
      name: 'user-storage',
      version: 2,
      // v1 stored mock profile/subscription data; start clean.
      migrate: () => initialData() as UserStore,
    }
  )
);
