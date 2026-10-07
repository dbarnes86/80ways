import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface RaidTotals {
  total: number;
  participants: number;
  yourContribution: number;
}

interface RaidStore {
  /** Keyed by raid key, for the season in `seasonId`. */
  totals: Record<string, RaidTotals>;
  seasonId: string | null;
  loaded: boolean;
  /** False when the server-side raid tables aren't available yet. */
  available: boolean;
  fetchTotals: (seasonId: string) => Promise<void>;
  /** Optimistic local bump after a contribution. */
  addLocalContribution: (raidKey: string, amount: number, firstTime: boolean) => void;
  reset: () => void;
}

export const useRaidStore = create<RaidStore>((set) => ({
  totals: {},
  seasonId: null,
  loaded: false,
  available: true,

  fetchTotals: async (seasonId) => {
    const { data, error } = await supabase.rpc('get_raid_totals', { p_season_id: seasonId });
    if (error) {
      console.error('Failed to fetch raid totals:', error);
      set({ seasonId, loaded: true, available: false });
      return;
    }
    const totals: Record<string, RaidTotals> = {};
    for (const row of data ?? []) {
      totals[row.raid_key] = {
        total: Number(row.total),
        participants: Number(row.participants),
        yourContribution: Number(row.your_contribution),
      };
    }
    set({ totals, seasonId, loaded: true, available: true });
  },

  addLocalContribution: (raidKey, amount, firstTime) => set((state) => {
    const prev = state.totals[raidKey] ?? { total: 0, participants: 0, yourContribution: 0 };
    return {
      totals: {
        ...state.totals,
        [raidKey]: {
          total: prev.total + amount,
          participants: prev.participants + (firstTime ? 1 : 0),
          yourContribution: prev.yourContribution + amount,
        },
      },
    };
  }),

  reset: () => set({ totals: {}, seasonId: null, loaded: false, available: true }),
}));
