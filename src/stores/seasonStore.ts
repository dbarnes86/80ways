import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { getExpectedGlobalLeg, getRealDayToNarrativeDay } from '@/data/gameConstants';
import { JOURNEY_LEGS } from '@/data/journeyLegs';

interface Season {
  id: string;
  seasonNumber: number;
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'completed';
  currentGlobalLeg: number;
  totalDistanceKm: number;
}

interface SeasonParticipation {
  id: string;
  seasonId: string;
  joinedAt: Date;
  joinedAtLeg: number;
  currentLeg: number;
  legProgress: number;
  status: 'active' | 'completed';
}

interface SeasonState {
  activeSeason: Season | null;
  participation: SeasonParticipation | null;
  narrativeDay: number;
  globalLeg: number;
  loaded: boolean;
}

interface SeasonStore extends SeasonState {
  fetchActiveSeason: () => Promise<void>;
  joinSeason: (userId: string) => Promise<void>;
  fetchParticipation: (userId: string) => Promise<void>;
  advanceLeg: (userId: string) => Promise<void>;
  updateLegProgress: (userId: string, progress: number) => Promise<void>;
  getCurrentLegData: () => typeof JOURNEY_LEGS[number] | null;
  getJoinLeg: () => number;
}

export const useSeasonStore = create<SeasonStore>()(
  persist(
    (set, get) => ({
      activeSeason: null,
      participation: null,
      narrativeDay: 1,
      globalLeg: 0,
      loaded: false,

      fetchActiveSeason: async () => {
        // Fetch the current or upcoming season
        const { data, error } = await supabase
          .from('seasons')
          .select('*')
          .in('status', ['active', 'upcoming'])
          .order('season_number', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (error || !data) {
          console.error('Failed to fetch season:', error);
          set({ loaded: true });
          return;
        }

        const startDate = new Date(data.start_date);
        const narrativeDay = getRealDayToNarrativeDay(startDate);
        const globalLeg = getExpectedGlobalLeg(startDate);

        set({
          activeSeason: {
            id: data.id,
            seasonNumber: data.season_number,
            name: data.name,
            description: data.description,
            startDate,
            endDate: new Date(data.end_date),
            status: data.status as Season['status'],
            currentGlobalLeg: Number(data.current_global_leg),
            totalDistanceKm: Number(data.total_distance_km),
          },
          narrativeDay,
          globalLeg,
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

        if (data) {
          set({
            participation: {
              id: data.id,
              seasonId: data.season_id,
              joinedAt: new Date(data.joined_at),
              joinedAtLeg: data.joined_at_leg,
              currentLeg: data.current_leg,
              legProgress: Number(data.leg_progress),
              status: data.status as 'active' | 'completed',
            },
          });
        }
      },

      joinSeason: async (userId) => {
        const season = get().activeSeason;
        if (!season) return;

        // Late joiners start at the current global leg
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
          console.error('Failed to join season:', error);
          return;
        }

        set({
          participation: {
            id: data.id,
            seasonId: data.season_id,
            joinedAt: new Date(data.joined_at),
            joinedAtLeg: data.joined_at_leg,
            currentLeg: data.current_leg,
            legProgress: Number(data.leg_progress),
            status: 'active',
          },
        });
      },

      advanceLeg: async (userId) => {
        const { participation, activeSeason } = get();
        if (!participation || !activeSeason) return;

        const nextLeg = Math.min(participation.currentLeg + 1, JOURNEY_LEGS.length - 1);

        await supabase
          .from('season_participation')
          .update({ current_leg: nextLeg, leg_progress: 0 })
          .eq('id', participation.id);

        set({
          participation: {
            ...participation,
            currentLeg: nextLeg,
            legProgress: 0,
          },
        });
      },

      updateLegProgress: async (userId, progress) => {
        const { participation } = get();
        if (!participation) return;

        await supabase
          .from('season_participation')
          .update({ leg_progress: progress })
          .eq('id', participation.id);

        set({
          participation: { ...participation, legProgress: progress },
        });
      },

      getCurrentLegData: () => {
        const { participation } = get();
        if (!participation) return JOURNEY_LEGS[0];
        return JOURNEY_LEGS[participation.currentLeg] || null;
      },

      getJoinLeg: () => {
        const season = get().activeSeason;
        if (!season) return 0;
        return getExpectedGlobalLeg(season.startDate);
      },
    }),
    {
      name: 'season-storage',
      partialize: (state) => ({
        activeSeason: state.activeSeason,
        participation: state.participation,
        narrativeDay: state.narrativeDay,
        globalLeg: state.globalLeg,
      }),
    }
  )
);
