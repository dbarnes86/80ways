import { create } from 'zustand';

interface RaidEvent {
  eventId: string;
  eventName: string;
  eventType: 'nautical' | 'terrestrial' | 'transport' | 'strength';
  durationHours: number;
  startTime: Date;
  endTime: Date;
  goalKwh: number;
  narrativeContext: string;
  status: 'scheduled' | 'active' | 'completed';
  currentProgress: number;
  participantCount: number;
  yourContribution: number;
  yourRank: number | null;
}

interface RaidStore {
  activeRaid: RaidEvent | null;
  upcomingRaids: RaidEvent[];
  pastRaids: RaidEvent[];
  setActiveRaid: (raid: RaidEvent | null) => void;
  setUpcomingRaids: (raids: RaidEvent[]) => void;
  addPastRaid: (raid: RaidEvent) => void;
  contributeToRaid: (amount: number) => void;
}

export const useRaidStore = create<RaidStore>((set) => ({
  activeRaid: null,
  upcomingRaids: [],
  pastRaids: [],
  setActiveRaid: (raid) => set({ activeRaid: raid }),
  setUpcomingRaids: (raids) => set({ upcomingRaids: raids }),
  addPastRaid: (raid) => set((state) => ({
    pastRaids: [raid, ...state.pastRaids],
  })),
  contributeToRaid: (amount) => set((state) => ({
    activeRaid: state.activeRaid ? {
      ...state.activeRaid,
      yourContribution: state.activeRaid.yourContribution + amount,
      currentProgress: state.activeRaid.currentProgress + amount,
    } : null,
  })),
}));
