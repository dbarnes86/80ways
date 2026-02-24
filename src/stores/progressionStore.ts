import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import {
  getLevelFromXP,
  STARTER_EVENT,
  MAIN_JOURNEY_UNLOCK_LEVEL,
  XP_PER_ACTIVITY,
  XP_PER_ENERGY_DEPLOYED,
  XP_PER_LEG_COMPLETED,
} from '@/data/gameConstants';

interface ProgressionState {
  xp: number;
  level: number;
  levelName: string;
  levelProgress: number;
  starterEventCompleted: boolean;
  starterEventProgress: number;
  canJoinMainJourney: boolean;
  totalActivities: number;
  totalEnergyGenerated: number;
  synced: boolean;
}

interface ProgressionStore extends ProgressionState {
  addXP: (amount: number, source?: string) => void;
  addActivityXP: (intensity: 'light' | 'moderate' | 'vigorous') => void;
  addDeploymentXP: (energyAmount: number) => void;
  addLegCompletionXP: () => void;
  updateStarterProgress: (energyAdded: number) => void;
  completeStarterEvent: () => void;
  syncFromDB: (userId: string) => Promise<void>;
  syncToDB: (userId: string) => Promise<void>;
  incrementActivity: (energyGenerated: number) => void;
  reset: () => void;
}

const initialState: ProgressionState = {
  xp: 0,
  level: 1,
  levelName: 'Novice Traveller',
  levelProgress: 0,
  starterEventCompleted: false,
  starterEventProgress: 0,
  canJoinMainJourney: false,
  totalActivities: 0,
  totalEnergyGenerated: 0,
  synced: false,
};

export const useProgressionStore = create<ProgressionStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addXP: (amount) => set((state) => {
        const newXP = state.xp + amount;
        const levelInfo = getLevelFromXP(newXP);
        return {
          xp: newXP,
          level: levelInfo.level,
          levelName: levelInfo.name,
          levelProgress: levelInfo.progress,
          canJoinMainJourney: state.starterEventCompleted && levelInfo.level >= MAIN_JOURNEY_UNLOCK_LEVEL,
        };
      }),

      addActivityXP: (intensity) => {
        get().addXP(XP_PER_ACTIVITY[intensity]);
      },

      addDeploymentXP: (energyAmount) => {
        get().addXP(Math.round(energyAmount * XP_PER_ENERGY_DEPLOYED));
      },

      addLegCompletionXP: () => {
        get().addXP(XP_PER_LEG_COMPLETED);
      },

      updateStarterProgress: (energyAdded) => set((state) => {
        if (state.starterEventCompleted) return state;
        const newProgress = Math.min(
          state.starterEventProgress + energyAdded,
          STARTER_EVENT.requiredEnergy
        );
        const completed = newProgress >= STARTER_EVENT.requiredEnergy;
        if (completed && !state.starterEventCompleted) {
          // Award starter event XP
          const newXP = state.xp + STARTER_EVENT.xpReward;
          const levelInfo = getLevelFromXP(newXP);
          return {
            starterEventProgress: newProgress,
            starterEventCompleted: true,
            xp: newXP,
            level: levelInfo.level,
            levelName: levelInfo.name,
            levelProgress: levelInfo.progress,
            canJoinMainJourney: levelInfo.level >= MAIN_JOURNEY_UNLOCK_LEVEL,
          };
        }
        return { starterEventProgress: newProgress };
      }),

      completeStarterEvent: () => set((state) => {
        const newXP = state.xp + STARTER_EVENT.xpReward;
        const levelInfo = getLevelFromXP(newXP);
        return {
          starterEventCompleted: true,
          starterEventProgress: STARTER_EVENT.requiredEnergy,
          xp: newXP,
          level: levelInfo.level,
          levelName: levelInfo.name,
          levelProgress: levelInfo.progress,
          canJoinMainJourney: levelInfo.level >= MAIN_JOURNEY_UNLOCK_LEVEL,
        };
      }),

      incrementActivity: (energyGenerated) => set((state) => ({
        totalActivities: state.totalActivities + 1,
        totalEnergyGenerated: state.totalEnergyGenerated + energyGenerated,
      })),

      syncFromDB: async (userId) => {
        const { data, error } = await supabase
          .from('player_progression')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          console.error('Failed to sync progression from DB:', error);
          return;
        }

        if (data) {
          const levelInfo = getLevelFromXP(data.xp);
          set({
            xp: data.xp,
            level: levelInfo.level,
            levelName: levelInfo.name,
            levelProgress: levelInfo.progress,
            starterEventCompleted: data.starter_event_completed,
            starterEventProgress: Number(data.starter_event_progress),
            totalActivities: data.total_activities,
            totalEnergyGenerated: Number(data.total_energy_generated),
            canJoinMainJourney: data.starter_event_completed && levelInfo.level >= MAIN_JOURNEY_UNLOCK_LEVEL,
            synced: true,
          });
        } else {
          // Create initial progression record
          await supabase.from('player_progression').insert({
            user_id: userId,
            xp: 0,
            level: 1,
            starter_event_completed: false,
            starter_event_progress: 0,
            total_energy_generated: 0,
            total_activities: 0,
          });
          set({ synced: true });
        }
      },

      syncToDB: async (userId) => {
        const state = get();
        await supabase
          .from('player_progression')
          .upsert({
            user_id: userId,
            xp: state.xp,
            level: state.level,
            starter_event_completed: state.starterEventCompleted,
            starter_event_progress: state.starterEventProgress,
            total_energy_generated: state.totalEnergyGenerated,
            total_activities: state.totalActivities,
          }, { onConflict: 'user_id' });
      },

      reset: () => set(initialState),
    }),
    { name: 'progression-storage' }
  )
);
