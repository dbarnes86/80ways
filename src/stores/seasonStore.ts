import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { getExpectedGlobalLeg, getRealDayToNarrativeDay } from '@/data/gameConstants';
import { JOURNEY_LEGS } from '@/data/journeyLegs';

type SeasonRow = Database['public']['Tables']['seasons']['Row'];
type ParticipationRow = Database['public']['Tables']['season_participation']['Row'];

export interface Season {
  id: string;
  seasonNumber: number;
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'completed';
  totalDistanceKm: number;
}

export interface SeasonParticipation {
  id: string;
  seasonId: string;
  joinedAt: string;
  joinedAtLeg: number;
  currentLeg: number;
  legProgress: number;
  status: 'active' | 'completed';
}

interface SeasonState {
  activeSeason: Season | null;
  participation: SeasonParticipation | null;
  /** Where the season as a whole is, by calendar (1–80). */
  narrativeDay: number;
  /** Leg the season calendar expects everyone to be on — late joiners start here. */
  globalLeg: number;
  loaded: boolean;
}

interface SeasonStore extends SeasonState {
  fetchActiveSeason: () => Promise<void>;
  fetchParticipation: (userId: string) => Promise<void>;
  joinSeason: (userId: string) => Promise<{ error?: string }>;
  setLegProgress: (progress: number) => Promise<void>;
  /** Moves to the next leg, or marks the journey complete after the last one. */
  completeLeg: () => Promise<{ journeyComplete: boolean }>;
  getJoinLeg: () => number;
  reset: () => void;
}

/** Status from the calendar, so a stale DB status never strands players. */
const statusFromDates = (start: Date, end: Date, now = new Date()): Season['status'] =>
  now < start ? 'upcoming' : now > end ? 'completed' : 'active';

const toSeason = (row: SeasonRow): Season => {
  const startDate = new Date(row.start_date);
  const endDate = new Date(row.end_date);
  return {
    id: row.id,
    seasonNumber: row.season_number,
    name: row.name,
    description: row.description,
    startDate,
    endDate,
    status: statusFromDates(startDate, endDate),
    totalDistanceKm: Number(row.total_distance_km),
  };
};

const toParticipation = (row: ParticipationRow): SeasonParticipation => ({
  id: row.id,
  seasonId: row.season_id,
  joinedAt: row.joined_at,
  joinedAtLeg: row.joined_at_leg,
  currentLeg: row.current_leg,
  legProgress: Number(row.leg_progress),
  status: row.status === 'completed' ? 'completed' : 'active',
});

const initialState: SeasonState = {
  activeSeason: null,
  participation: null,
  narrativeDay: 1,
  globalLeg: 0,
  loaded: false,
};

export const useSeasonStore = create<SeasonStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchActiveSeason: async () => {
        // Preferred: server opens the next season when the last one has ended.
        let row: SeasonRow | null = null;
        const rpc = await supabase.rpc('get_current_season');
        if (!rpc.error && rpc.data && rpc.data.length > 0) {
          row = rpc.data[0];
        } else {
          // Fallback for databases without the RPC: first season that hasn't ended, else the latest.
          const { data, error } = await supabase
            .from('seasons')
            .select('*')
            .order('season_number', { ascending: true });
          if (error) console.error('Failed to fetch seasons:', error);
          const now = Date.now();
          row = data?.find((s) => new Date(s.end_date).getTime() >= now) ?? data?.[data.length - 1] ?? null;
        }

        if (!row) {
          set({ activeSeason: null, loaded: true });
          return;
        }

        const season = toSeason(row);
        const current = get().participation;
        set({
          activeSeason: season,
          narrativeDay: getRealDayToNarrativeDay(season.startDate),
          globalLeg: season.status === 'upcoming' ? 0 : getExpectedGlobalLeg(season.startDate),
          participation: current && current.seasonId === season.id ? current : null,
          loaded: true,
        });
      },

      fetchParticipation: async (userId) => {
        const season = get().activeSeason;
        if (!season) return;

        const { data, error } = await supabase
          .from('season_participation')
          .select('*')
          .eq('user_id', userId)
          .eq('season_id', season.id)
          .maybeSingle();

        if (error) {
          console.error('Failed to fetch participation:', error);
          return;
        }
        set({ participation: data ? toParticipation(data) : null });
      },

      joinSeason: async (userId) => {
        const season = get().activeSeason;
        if (!season) return { error: 'No season is open right now.' };
        if (season.status === 'completed') return { error: 'This season has ended.' };

        const joinLeg = get().getJoinLeg();
        const { data, error } = await supabase
          .from('season_participation')
          .insert({
            user_id: userId,
            season_id: season.id,
            joined_at_leg: joinLeg,
            current_leg: joinLeg,
            leg_progress: 0,
            status: 'active',
          })
          .select()
          .single();

        if (error) {
          // Already joined on another device — just load it.
          if (error.code === '23505') {
            await get().fetchParticipation(userId);
            return {};
          }
          console.error('Failed to join season:', error);
          return { error: error.message };
        }

        set({ participation: toParticipation(data) });
        return {};
      },

      setLegProgress: async (progress) => {
        const { participation } = get();
        if (!participation) return;
        set({ participation: { ...participation, legProgress: progress } });

        const { error } = await supabase
          .from('season_participation')
          .update({ leg_progress: progress })
          .eq('id', participation.id);
        if (error) console.error('Failed to save leg progress:', error);
      },

      completeLeg: async () => {
        const { participation } = get();
        if (!participation) return { journeyComplete: false };

        const isLast = participation.currentLeg >= JOURNEY_LEGS.length - 1;
        const next: SeasonParticipation = isLast
          ? { ...participation, legProgress: JOURNEY_LEGS[participation.currentLeg].requiredEnergy.amount, status: 'completed' }
          : { ...participation, currentLeg: participation.currentLeg + 1, legProgress: 0 };
        set({ participation: next });

        const { error } = await supabase
          .from('season_participation')
          .update({ current_leg: next.currentLeg, leg_progress: next.legProgress, status: next.status })
          .eq('id', participation.id);
        if (error) console.error('Failed to advance leg:', error);

        return { journeyComplete: isLast };
      },

      getJoinLeg: () => {
        const season = get().activeSeason;
        if (!season || season.status === 'upcoming') return 0;
        return getExpectedGlobalLeg(season.startDate);
      },

      reset: () => set(initialState),
    }),
    {
      name: 'season-storage',
      version: 2,
      // Only participation is cached; the season itself is always refetched (it carries Dates).
      partialize: (state) => ({ participation: state.participation }),
      migrate: () => ({ participation: null }) as unknown as SeasonStore,
    }
  )
);

export const selectHasJoined = (s: SeasonState) =>
  !!s.participation && !!s.activeSeason && s.participation.seasonId === s.activeSeason.id;
