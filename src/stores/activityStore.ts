import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EnergyType, Intensity } from '@/data/gameConstants';

export interface Activity {
  id: string;
  /** ISO string (Date objects don't survive localStorage). */
  timestamp: string;
  activityType: string;
  targetEnergyType: EnergyType;
  efficiency: number;
  duration: number;
  /** Always stored in km. */
  distance?: number;
  intensity: Intensity;
  notes?: string;
  baseEnergy: number;
  actualEnergy: number;
  boosterUsed?: string;
}

interface ActivityStore {
  activities: Activity[];
  addActivity: (activity: Activity) => void;
  /** Union with activities loaded from the server, newest first. */
  mergeActivities: (incoming: Activity[]) => void;
  reset: () => void;
}

const sortNewestFirst = (list: Activity[]) =>
  [...list].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

export const useActivityStore = create<ActivityStore>()(
  persist(
    (set) => ({
      activities: [],
      addActivity: (activity) => set((state) => ({
        activities: sortNewestFirst([activity, ...state.activities]),
      })),
      mergeActivities: (incoming) => set((state) => {
        const byId = new Map(state.activities.map((a) => [a.id, a]));
        for (const a of incoming) byId.set(a.id, a);
        return { activities: sortNewestFirst(Array.from(byId.values())) };
      }),
      reset: () => set({ activities: [] }),
    }),
    {
      name: 'activity-storage',
      version: 2,
      migrate: (persisted) => {
        const old = (persisted as { activities?: Array<Activity & { timestamp: string | Date }> })?.activities ?? [];
        return { activities: old.map((a) => ({ ...a, timestamp: new Date(a.timestamp).toISOString() })) } as ActivityStore;
      },
    }
  )
);
