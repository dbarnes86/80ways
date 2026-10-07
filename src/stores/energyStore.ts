import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ENERGY_CAPACITY_DEFAULT, ENERGY_DECAY_RATE, ENERGY_TYPES, type EnergyType } from '@/data/gameConstants';
import { decayedAmount } from '@/lib/gameEngine';

export interface EnergyReserve {
  current: number;
  max: number;
  decayRate: number;
  /** ISO string or Date (persisted as string). Last time decay was applied or energy changed. */
  lastUpdated: Date | string;
}

type EnergyReserves = Record<EnergyType, EnergyReserve>;

interface EnergyStore extends EnergyReserves {
  chargeEnergy: (type: EnergyType, amount: number) => void;
  deployEnergy: (type: EnergyType, amount: number) => void;
  /** Applies decay since each reserve's lastUpdated. Pass a freeze-until date to skip decay up to then. */
  applyDecay: (frozenUntil?: Date | null) => void;
  setReserves: (reserves: Partial<Record<EnergyType, { current: number; lastUpdated?: string }>>) => void;
  reset: () => void;
}

const freshReserve = (): EnergyReserve => ({
  current: 0,
  max: ENERGY_CAPACITY_DEFAULT,
  decayRate: ENERGY_DECAY_RATE,
  lastUpdated: new Date().toISOString(),
});

const initialReserves = (): EnergyReserves => ({
  nautical: freshReserve(),
  terrestrial: freshReserve(),
  transport: freshReserve(),
  strength: freshReserve(),
});

export const useEnergyStore = create<EnergyStore>()(
  persist(
    (set) => ({
      ...initialReserves(),

      chargeEnergy: (type, amount) => set((state) => ({
        [type]: {
          ...state[type],
          current: Math.min(state[type].current + amount, state[type].max),
          lastUpdated: new Date().toISOString(),
        },
      })),

      deployEnergy: (type, amount) => set((state) => ({
        [type]: {
          ...state[type],
          current: Math.max(state[type].current - amount, 0),
          lastUpdated: new Date().toISOString(),
        },
      })),

      applyDecay: (frozenUntil) => set((state) => {
        const now = new Date();
        const next: Partial<EnergyReserves> = {};
        for (const type of ENERGY_TYPES) {
          const reserve = state[type];
          let from = new Date(reserve.lastUpdated);
          if (frozenUntil && frozenUntil > from) from = frozenUntil < now ? frozenUntil : now;
          const hours = Math.max(0, (now.getTime() - from.getTime()) / 3_600_000);
          next[type] = {
            ...reserve,
            current: decayedAmount(reserve.current, reserve.decayRate, hours),
            lastUpdated: now.toISOString(),
          };
        }
        return next;
      }),

      setReserves: (reserves) => set((state) => {
        const next: Partial<EnergyReserves> = {};
        for (const type of ENERGY_TYPES) {
          const r = reserves[type];
          if (!r) continue;
          next[type] = {
            ...state[type],
            current: Math.min(Math.max(0, Number(r.current) || 0), state[type].max),
            lastUpdated: r.lastUpdated ?? new Date().toISOString(),
          };
        }
        return next;
      }),

      reset: () => set(initialReserves()),
    }),
    { name: 'energy-storage' }
  )
);
