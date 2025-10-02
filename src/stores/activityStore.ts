import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Activity {
  id: string;
  timestamp: Date;
  activityType: string;
  targetEnergyType: 'nautical' | 'terrestrial' | 'transport' | 'strength';
  efficiency: number;
  duration: number;
  distance?: number;
  intensity: 'light' | 'moderate' | 'vigorous';
  notes?: string;
  baseEnergy: number;
  actualEnergy: number;
  boosterUsed?: 'energyAmplifier' | 'multiCharge';
}

interface ActivityStore {
  activities: Activity[];
  addActivity: (activity: Activity) => void;
  deleteActivity: (id: string) => void;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
}

export const useActivityStore = create<ActivityStore>()(
  persist(
    (set) => ({
      activities: [],
      addActivity: (activity) => set((state) => ({
        activities: [activity, ...state.activities],
      })),
      deleteActivity: (id) => set((state) => ({
        activities: state.activities.filter((a) => a.id !== id),
      })),
      updateActivity: (id, updates) => set((state) => ({
        activities: state.activities.map((a) =>
          a.id === id ? { ...a, ...updates } : a
        ),
      })),
    }),
    {
      name: 'activity-storage',
    }
  )
);
