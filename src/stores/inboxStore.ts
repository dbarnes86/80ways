import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EnergyType, Intensity } from '@/data/gameConstants';

/** A workout from Apple Health waiting to be collected. Collecting is the reward moment. */
export interface InboxItem {
  /** The activity id it becomes (stable per player and workout). */
  id: string;
  activityType: string;
  targetType: EnergyType;
  durationMin: number;
  intensity: Intensity;
  distanceKm?: number;
  performedAt: string;
  sourceName: string;
}

interface InboxStore {
  items: InboxItem[];
  add: (items: InboxItem[]) => void;
  remove: (id: string) => void;
  reset: () => void;
}

export const useInboxStore = create<InboxStore>()(
  persist(
    (set) => ({
      items: [],
      add: (incoming) =>
        set((s) => {
          const have = new Set(s.items.map((i) => i.id));
          const fresh = incoming.filter((i) => !have.has(i.id));
          return fresh.length ? { items: [...s.items, ...fresh].sort((a, b) => a.performedAt.localeCompare(b.performedAt)) } : s;
        }),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      reset: () => set({ items: [] }),
    }),
    { name: 'inbox-storage' },
  ),
);
