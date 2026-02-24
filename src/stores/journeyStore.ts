import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { JOURNEY_LEGS } from '@/data/journeyLegs';
import { getDeploymentEfficiency } from '@/data/gameConstants';

interface Challenge {
  legId: string;
  requiredEnergy: {
    type: 'nautical' | 'terrestrial' | 'transport' | 'strength';
    amount: number;
  };
  currentProgress: number;
  deploymentsCount: number;
  startedAt: Date;
}

interface JourneyState {
  currentChallenge: Challenge | null;
  /** @deprecated Use seasonStore.participation.currentLeg instead for season-aware leg tracking */
  currentLeg: number;
  completedLegs: string[];
}

interface JourneyStore extends JourneyState {
  startChallenge: (legIndex: number) => void;
  deployEnergy: (amount: number, energyType: string) => void;
  completeChallenge: () => boolean;
  updateProgress: (progress: number) => void;
  getChallengeProgress: () => number;
  reset: () => void;
}

export const useJourneyStore = create<JourneyStore>()(
  persist(
    (set, get) => ({
      currentChallenge: null,
      currentLeg: 0,
      completedLegs: [],

      startChallenge: (legIndex) => {
        const leg = JOURNEY_LEGS[legIndex];
        if (!leg) return;

        set({
          currentChallenge: {
            legId: leg.id,
            requiredEnergy: {
              type: leg.requiredEnergy.type,
              amount: leg.requiredEnergy.amount,
            },
            currentProgress: 0,
            deploymentsCount: 0,
            startedAt: new Date(),
          },
        });
      },

      deployEnergy: (amount, energyType) => set((state) => {
        if (!state.currentChallenge) return state;

        const efficiency = getDeploymentEfficiency(
          energyType,
          state.currentChallenge.requiredEnergy.type
        );
        const effectiveAmount = amount * efficiency;

        return {
          currentChallenge: {
            ...state.currentChallenge,
            currentProgress: state.currentChallenge.currentProgress + effectiveAmount,
            deploymentsCount: state.currentChallenge.deploymentsCount + 1,
          },
        };
      }),

      completeChallenge: () => {
        const state = get();
        if (!state.currentChallenge) return false;
        if (state.currentChallenge.currentProgress < state.currentChallenge.requiredEnergy.amount) {
          return false;
        }

        set({
          currentChallenge: null,
          currentLeg: state.currentLeg + 1,
          completedLegs: [...state.completedLegs, state.currentChallenge.legId],
        });
        return true;
      },

      updateProgress: (progress) => set((state) => ({
        currentChallenge: state.currentChallenge
          ? { ...state.currentChallenge, currentProgress: progress }
          : null,
      })),

      getChallengeProgress: () => {
        const state = get();
        if (!state.currentChallenge) return 0;
        return Math.min(
          1,
          state.currentChallenge.currentProgress / state.currentChallenge.requiredEnergy.amount
        );
      },

      reset: () => set({
        currentChallenge: null,
        currentLeg: 0,
        completedLegs: [],
      }),
    }),
    { name: 'journey-storage' }
  )
);
