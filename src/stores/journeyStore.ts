import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface JourneyLeg {
  id: string;
  legNumber: number;
  from: string;
  to: string;
  distance: number;
  requiredEnergy: {
    type: 'nautical' | 'terrestrial' | 'transport' | 'strength';
    amount: number;
  };
  narrative: {
    title: string;
    description: string;
    departureQuote: string;
    arrivalQuote: string;
  };
  progress: number;
  status: 'locked' | 'active' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
}

interface Challenge {
  legId: string;
  requiredEnergy: { 
    type: 'nautical' | 'terrestrial' | 'transport' | 'strength'; 
    amount: number 
  };
  currentProgress: number;
  deploymentsCount: number;
  startedAt: Date;
}

interface PersonalJourney {
  journeyId: string | null;
  currentDay: number;
  currentLeg: number;
  totalDistance: number;
  legs: JourneyLeg[];
  completedLegs: string[];
  currentChallenge: Challenge | null;
}

interface JourneyStore extends PersonalJourney {
  startJourney: (journeyId: string) => void;
  deployEnergy: (amount: number, type: string) => void;
  completeLeg: () => void;
  updateProgress: (progress: number) => void;
}

export const useJourneyStore = create<JourneyStore>()(
  persist(
    (set) => ({
      journeyId: null,
      currentDay: 1,
      currentLeg: 0,
      totalDistance: 0,
      legs: [],
      completedLegs: [],
      currentChallenge: null,
      startJourney: (journeyId) => set({ journeyId, currentDay: 1 }),
      deployEnergy: (amount, type) => set((state) => ({
        currentChallenge: state.currentChallenge ? {
          ...state.currentChallenge,
          currentProgress: state.currentChallenge.currentProgress + amount,
        } : null,
      })),
      completeLeg: () => set((state) => ({
        currentLeg: state.currentLeg + 1,
        completedLegs: [...state.completedLegs, state.legs[state.currentLeg]?.id],
      })),
      updateProgress: (progress) => set((state) => ({
        currentChallenge: state.currentChallenge ? {
          ...state.currentChallenge,
          currentProgress: progress,
        } : null,
      })),
    }),
    {
      name: 'journey-storage',
    }
  )
);
