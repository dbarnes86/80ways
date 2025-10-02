import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface EnergyReserve {
  current: number;
  max: number;
  decayRate: number;
  lastUpdated: Date;
}

interface EnergyReserves {
  nautical: EnergyReserve;
  terrestrial: EnergyReserve;
  transport: EnergyReserve;
  strength: EnergyReserve;
}

interface EnergyStore extends EnergyReserves {
  chargeEnergy: (type: keyof EnergyReserves, amount: number) => void;
  deployEnergy: (type: keyof EnergyReserves, amount: number) => void;
  applyDecay: () => void;
}

const initialReserve: EnergyReserve = {
  current: 0,
  max: 10,
  decayRate: 0.05,
  lastUpdated: new Date(),
};

export const useEnergyStore = create<EnergyStore>()(
  persist(
    (set) => ({
      nautical: { ...initialReserve },
      terrestrial: { ...initialReserve },
      transport: { ...initialReserve },
      strength: { ...initialReserve },
      chargeEnergy: (type, amount) => set((state) => ({
        [type]: {
          ...state[type],
          current: Math.min(state[type].current + amount, state[type].max),
          lastUpdated: new Date(),
        },
      })),
      deployEnergy: (type, amount) => set((state) => ({
        [type]: {
          ...state[type],
          current: Math.max(state[type].current - amount, 0),
          lastUpdated: new Date(),
        },
      })),
      applyDecay: () => set((state) => {
        const now = new Date();
        const newState: any = {};
        
        (['nautical', 'terrestrial', 'transport', 'strength'] as const).forEach((type) => {
          const reserve = state[type];
          const hoursSince = (now.getTime() - reserve.lastUpdated.getTime()) / (1000 * 60 * 60);
          const decayAmount = reserve.current * reserve.decayRate * (hoursSince / 24);
          
          newState[type] = {
            ...reserve,
            current: Math.max(reserve.current - decayAmount, 0),
            lastUpdated: now,
          };
        });
        
        return newState;
      }),
    }),
    {
      name: 'energy-storage',
    }
  )
);
