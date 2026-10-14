import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_DEPARTURE_MINUTES, type BoosterId, type EncounterOutcome } from '@/data/gameConstants';

/** One day's departure: the encounter played and whether the boiler was stoked on time. */
export interface VoyageDay {
  encounter?: { id: string; choice: number; outcome: EncounterOutcome };
  punctual?: boolean;
}

/**
 * Player wallet, boosters and bookkeeping that isn't XP.
 * Identity (name, email) lives in Supabase auth + the profiles table.
 */
export interface UserGameData {
  inventory: {
    credits: number;
    energyAmplifier: number;
    decayInhibitor: number;
    multiCharge: number;
  };
  effects: {
    /** ISO timestamp — reserves don't decay until then. */
    decayInhibitorUntil: string | null;
  };
  stats: {
    totalDistance: number;
    journeysCompleted: number;
  };
  /** Day key (YYYY-MM-DD) of the last Daily Constitutional reward. */
  lastDailyMission: string | null;
  /** Raid keys (seasonId:raidKey) that have paid out first-contribution XP. */
  raidXpAwarded: string[];
  /** Raid keys (seasonId:raidKey) whose success reward has been claimed. */
  raidRewardsClaimed: string[];
  settings: {
    units: 'metric' | 'imperial';
  };
  /** Quest and chest ids already paid out (see game/quests.ts). */
  questsClaimed: string[];
  /** kWh spent on the expedition per day key, for quests. */
  deployLog: Record<string, number>;
  /** The discipline picked in onboarding; sets the avatar and home reserve. */
  discipline: Discipline | null;
  /** A booster set to fire on the next workout collected, so a reward can be used on the spot. */
  armedBooster: BoosterId | null;
  /** XP paid so far for workouts from before the player joined; capped at HISTORY_XP_CAP. */
  historyXp: number;
  /** The day's departure by day key, two weeks kept: one encounter and one on-time bonus a day. */
  voyageLog: Record<string, VoyageDay>;
  /** Souvenir ids collected (see data/encounters.ts). */
  souvenirs: string[];
  /** The player's departure time, in minutes after midnight. */
  departureMinutes: number;
}

export type Discipline = 'runner' | 'rider' | 'swimmer' | 'lifter';

interface UserStore extends UserGameData {
  addCredits: (amount: number) => void;
  spendCredits: (amount: number) => boolean;
  addBooster: (id: BoosterId, count?: number) => void;
  consumeBooster: (id: BoosterId) => boolean;
  setDecayInhibitorUntil: (iso: string | null) => void;
  addDistance: (km: number) => void;
  incrementJourneysCompleted: () => void;
  setLastDailyMission: (dayKey: string) => void;
  markRaidXpAwarded: (key: string) => void;
  markRaidRewardClaimed: (key: string) => void;
  setUnits: (units: 'metric' | 'imperial') => void;
  markQuestsClaimed: (ids: string[]) => void;
  logDeployment: (dayKey: string, kwh: number) => void;
  setDiscipline: (d: Discipline) => void;
  armBooster: (id: BoosterId | null) => void;
  addHistoryXp: (amount: number) => void;
  logVoyage: (dayKey: string, day: VoyageDay) => void;
  addSouvenir: (id: string) => void;
  setDepartureMinutes: (minutes: number) => void;
  hydrate: (data: Partial<UserGameData>) => void;
  reset: () => void;
}

const initialData = (): UserGameData => ({
  inventory: { credits: 0, energyAmplifier: 0, decayInhibitor: 0, multiCharge: 0 },
  effects: { decayInhibitorUntil: null },
  stats: { totalDistance: 0, journeysCompleted: 0 },
  lastDailyMission: null,
  raidXpAwarded: [],
  raidRewardsClaimed: [],
  settings: { units: 'metric' },
  questsClaimed: [],
  deployLog: {},
  discipline: null,
  armedBooster: null,
  historyXp: 0,
  voyageLog: {},
  souvenirs: [],
  departureMinutes: DEFAULT_DEPARTURE_MINUTES,
});

const twoWeeksAgo = () => new Date(Date.now() - 14 * 86_400_000).toISOString().slice(0, 10);

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      ...initialData(),

      addCredits: (amount) => set((s) => ({ inventory: { ...s.inventory, credits: s.inventory.credits + amount } })),

      spendCredits: (amount) => {
        if (get().inventory.credits < amount) return false;
        set((s) => ({ inventory: { ...s.inventory, credits: s.inventory.credits - amount } }));
        return true;
      },

      addBooster: (id, count = 1) => set((s) => ({ inventory: { ...s.inventory, [id]: s.inventory[id] + count } })),

      consumeBooster: (id) => {
        if (get().inventory[id] <= 0) return false;
        set((s) => ({ inventory: { ...s.inventory, [id]: s.inventory[id] - 1 } }));
        return true;
      },

      setDecayInhibitorUntil: (iso) => set((s) => ({ effects: { ...s.effects, decayInhibitorUntil: iso } })),

      addDistance: (km) => set((s) => ({ stats: { ...s.stats, totalDistance: s.stats.totalDistance + km } })),

      incrementJourneysCompleted: () =>
        set((s) => ({ stats: { ...s.stats, journeysCompleted: s.stats.journeysCompleted + 1 } })),

      setLastDailyMission: (dayKey) => set({ lastDailyMission: dayKey }),

      markRaidXpAwarded: (key) => set((s) => ({ raidXpAwarded: Array.from(new Set([...s.raidXpAwarded, key])) })),

      markRaidRewardClaimed: (key) =>
        set((s) => ({ raidRewardsClaimed: Array.from(new Set([...s.raidRewardsClaimed, key])) })),

      setUnits: (units) => set((s) => ({ settings: { ...s.settings, units } })),

      markQuestsClaimed: (ids) => set((s) => ({ questsClaimed: Array.from(new Set([...s.questsClaimed, ...ids])) })),

      logDeployment: (dayKey, kwh) =>
        set((s) => {
          // Keep two weeks: enough for the weekly quests.
          const cutoff = twoWeeksAgo();
          const kept = Object.fromEntries(Object.entries(s.deployLog).filter(([d]) => d >= cutoff));
          return { deployLog: { ...kept, [dayKey]: (kept[dayKey] ?? 0) + kwh } };
        }),

      setDiscipline: (discipline) => set({ discipline }),
      armBooster: (armedBooster) => set({ armedBooster }),
      addHistoryXp: (amount) => set((s) => ({ historyXp: s.historyXp + amount })),

      logVoyage: (dayKey, day) =>
        set((s) => {
          const cutoff = twoWeeksAgo();
          const kept = Object.fromEntries(Object.entries(s.voyageLog).filter(([d]) => d >= cutoff));
          return { voyageLog: { ...kept, [dayKey]: { ...kept[dayKey], ...day } } };
        }),

      addSouvenir: (id) => set((s) => (s.souvenirs.includes(id) ? s : { souvenirs: [...s.souvenirs, id] })),
      setDepartureMinutes: (departureMinutes) => set({ departureMinutes }),

      hydrate: (data) => set((s) => ({
        inventory: { ...s.inventory, ...data.inventory },
        effects: { ...s.effects, ...data.effects },
        stats: { ...s.stats, ...data.stats },
        settings: { ...s.settings, ...data.settings },
        lastDailyMission: data.lastDailyMission ?? s.lastDailyMission,
        // Unions, so a reward claimed on any device stays claimed everywhere.
        raidXpAwarded: Array.from(new Set([...s.raidXpAwarded, ...(data.raidXpAwarded ?? [])])),
        raidRewardsClaimed: Array.from(new Set([...s.raidRewardsClaimed, ...(data.raidRewardsClaimed ?? [])])),
        questsClaimed: Array.from(new Set([...s.questsClaimed, ...(data.questsClaimed ?? [])])),
        deployLog: { ...s.deployLog, ...data.deployLog },
        discipline: data.discipline ?? s.discipline,
        armedBooster: data.armedBooster === undefined ? s.armedBooster : data.armedBooster,
        // The higher of the two, so the cap holds whichever device collected the backlog.
        historyXp: Math.max(s.historyXp, data.historyXp ?? 0),
        // Merged per day, so an encounter played on one device can't be played again on another.
        voyageLog: mergeVoyageLogs(s.voyageLog, data.voyageLog),
        souvenirs: Array.from(new Set([...s.souvenirs, ...(data.souvenirs ?? [])])),
        departureMinutes: data.departureMinutes ?? s.departureMinutes,
      })),

      reset: () => set(initialData()),
    }),
    {
      name: 'user-storage',
      version: 4,
      // v1 stored mock profile/subscription data; start clean. v2 and v3 lacked newer fields.
      migrate: (persisted, version) =>
        (version >= 2 ? { ...initialData(), ...(persisted as object) } : initialData()) as UserStore,
    }
  )
);

export function mergeVoyageLogs(a: Record<string, VoyageDay>, b: Record<string, VoyageDay> | undefined): Record<string, VoyageDay> {
  const out = { ...a };
  for (const [day, v] of Object.entries(b ?? {})) {
    out[day] = { encounter: out[day]?.encounter ?? v.encounter, punctual: out[day]?.punctual || v.punctual || undefined };
  }
  return out;
}
