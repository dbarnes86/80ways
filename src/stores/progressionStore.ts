import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  getLevelFromXP,
  STARTER_EVENT,
  MAIN_JOURNEY_UNLOCK_LEVEL,
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
}

interface ProgressionStore extends ProgressionState {
  addXP: (amount: number) => void;
  /** Adds energy to the Lift Off meter. Returns true if this call completed the starter event. */
  updateStarterProgress: (energyAdded: number) => boolean;
  incrementActivity: (energyGenerated: number) => void;
  hydrate: (data: Pick<ProgressionState, 'xp' | 'starterEventCompleted' | 'starterEventProgress' | 'totalActivities' | 'totalEnergyGenerated'>) => void;
  reset: () => void;
}

const derive = (xp: number, starterEventCompleted: boolean) => {
  const levelInfo = getLevelFromXP(xp);
  return {
    xp,
    level: levelInfo.level,
    levelName: levelInfo.name,
    levelProgress: levelInfo.progress,
    canJoinMainJourney: starterEventCompleted && levelInfo.level >= MAIN_JOURNEY_UNLOCK_LEVEL,
  };
};

const initialState: ProgressionState = {
  ...derive(0, false),
  starterEventCompleted: false,
  starterEventProgress: 0,
  totalActivities: 0,
  totalEnergyGenerated: 0,
};

export const useProgressionStore = create<ProgressionStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addXP: (amount) => set((state) => derive(state.xp + amount, state.starterEventCompleted)),

      updateStarterProgress: (energyAdded) => {
        const state = get();
        if (state.starterEventCompleted) return false;
        const progress = Math.min(state.starterEventProgress + energyAdded, STARTER_EVENT.requiredEnergy);
        if (progress < STARTER_EVENT.requiredEnergy) {
          set({ starterEventProgress: progress });
          return false;
        }
        set({
          starterEventProgress: progress,
          starterEventCompleted: true,
          ...derive(state.xp + STARTER_EVENT.xpReward, true),
        });
        return true;
      },

      incrementActivity: (energyGenerated) => set((state) => ({
        totalActivities: state.totalActivities + 1,
        totalEnergyGenerated: state.totalEnergyGenerated + energyGenerated,
      })),

      hydrate: (data) => set({
        ...derive(data.xp, data.starterEventCompleted),
        starterEventCompleted: data.starterEventCompleted,
        starterEventProgress: data.starterEventProgress,
        totalActivities: data.totalActivities,
        totalEnergyGenerated: data.totalEnergyGenerated,
      }),

      reset: () => set(initialState),
    }),
    { name: 'progression-storage' }
  )
);
