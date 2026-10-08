/**
 * The reward bus. Anything that pays the player out (a workout, a quest, a leg, a raid) reports
 * here, and the RewardLayer turns it into a moment: a full-screen celebration for the big things,
 * a floating "+25 XP" for the small ones. One place, so every reward feels the same.
 */
import { create } from 'zustand';
import type { BoosterId } from '@/data/gameConstants';

export type ChestTier = 'bronze' | 'silver' | 'gold';

export type RewardMoment =
  | { kind: 'levelUp'; level: number; name: string; unlock?: string }
  | { kind: 'liftOff' }
  | { kind: 'stamp'; city: string; credits: number }
  | { kind: 'journey' }
  | { kind: 'quest'; title: string; xp: number; credits: number }
  | { kind: 'chest'; tier: ChestTier; title: string; credits: number; xp: number; booster?: BoosterId };

export interface Floater {
  id: number;
  text: string;
  tone: 'xp' | 'credits' | 'energy' | 'streak';
}

interface RewardStore {
  queue: RewardMoment[];
  floaters: Floater[];
  celebrate: (m: RewardMoment) => void;
  next: () => void;
  float: (text: string, tone: Floater['tone']) => void;
}

let floaterId = 1;

export const useRewardStore = create<RewardStore>((set) => ({
  queue: [],
  floaters: [],
  celebrate: (m) => set((s) => ({ queue: [...s.queue, m] })),
  next: () => set((s) => ({ queue: s.queue.slice(1) })),
  float: (text, tone) => {
    const id = floaterId++;
    set((s) => ({ floaters: [...s.floaters, { id, text, tone }] }));
    setTimeout(() => set((s) => ({ floaters: s.floaters.filter((f) => f.id !== id) })), 1600);
  },
}));

export const celebrate = (m: RewardMoment) => useRewardStore.getState().celebrate(m);
export const floatReward = (text: string, tone: Floater['tone']) => useRewardStore.getState().float(text, tone);

/** What one action paid out, in the shape the game actions already return. */
export interface Payout {
  xp?: number;
  credits?: number;
  energy?: number;
  levelUp?: { level: number; name: string };
  starterCompleted?: boolean;
  legCompletedCity?: string;
  legCredits?: number;
  journeyComplete?: boolean;
}

/** Things a level unlocks, said on the level-up screen so levelling means something. */
const LEVEL_UNLOCKS: Record<number, string> = {
  2: 'Weekly telegrams from Fogg',
  3: 'The season expedition',
  4: 'Gold quest chests',
  5: 'Title: Globetrotter',
  6: 'Ship trail: Steam',
  8: 'Title: Cartographer',
  10: 'Ship trail: Aurora',
};

/** Announce a payout: floaters for the numbers, full-screen moments for the milestones, biggest last. */
export function announce(p: Payout, opts: { floats?: boolean } = {}) {
  const { floats = true } = opts;
  if (floats) {
    if (p.energy) floatReward(`+${p.energy.toFixed(1)} kWh`, 'energy');
    if (p.xp) floatReward(`+${Math.round(p.xp)} XP`, 'xp');
    if (p.credits) floatReward(`+${Math.round(p.credits)}`, 'credits');
  }
  if (p.legCompletedCity) celebrate({ kind: 'stamp', city: p.legCompletedCity, credits: p.legCredits ?? 0 });
  if (p.journeyComplete) celebrate({ kind: 'journey' });
  if (p.starterCompleted) celebrate({ kind: 'liftOff' });
  if (p.levelUp) celebrate({ kind: 'levelUp', ...p.levelUp, unlock: LEVEL_UNLOCKS[p.levelUp.level] });
}
