import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserProfile {
  userId: string | null;
  email: string | null;
  displayName: string | null;
  avatar: string | null;
  subscription: {
    status: 'trialing' | 'active' | 'canceled' | 'past_due' | null;
    trialEnd: Date | null;
    currentPeriodEnd: Date | null;
  };
  stats: {
    totalActivities: number;
    totalDistance: number;
    totalEnergyGenerated: number;
    currentStreak: number;
    journeysCompleted: number;
  };
  inventory: {
    credits: number;
    energyAmplifier: number;
    decayInhibitor: number;
    multiCharge: number;
  };
  settings: {
    notifications: {
      raidEvents: boolean;
      dailyReminders: boolean;
      journeyMilestones: boolean;
    };
    units: 'metric' | 'imperial';
  };
}

interface UserStore extends UserProfile {
  setUser: (user: Partial<UserProfile>) => void;
  updateStats: (stats: Partial<UserProfile['stats']>) => void;
  updateInventory: (inventory: Partial<UserProfile['inventory']>) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      userId: null,
      email: null,
      displayName: null,
      avatar: null,
      subscription: {
        status: null,
        trialEnd: null,
        currentPeriodEnd: null,
      },
      stats: {
        totalActivities: 0,
        totalDistance: 0,
        totalEnergyGenerated: 0,
        currentStreak: 0,
        journeysCompleted: 0,
      },
      inventory: {
        credits: 0,
        energyAmplifier: 0,
        decayInhibitor: 0,
        multiCharge: 0,
      },
      settings: {
        notifications: {
          raidEvents: true,
          dailyReminders: false,
          journeyMilestones: true,
        },
        units: 'metric',
      },
      setUser: (user) => set((state) => ({ ...state, ...user })),
      updateStats: (stats) => set((state) => ({ 
        stats: { ...state.stats, ...stats } 
      })),
      updateInventory: (inventory) => set((state) => ({
        inventory: { ...state.inventory, ...inventory }
      })),
      clearUser: () => set({
        userId: null,
        email: null,
        displayName: null,
        avatar: null,
      }),
    }),
    {
      name: 'user-storage',
    }
  )
);
