/**
 * The reward bus. Anything that pays the player out (a workout, a quest, a leg, a raid) reports
 * here, and the RewardLayer turns it into a moment: a full-screen celebration for the big things,
 * a floating "+25 XP" for the small ones. One place, so every reward feels the same.
 */
import { create } from 'zustand';
import type { BoosterId } from '@/data/gameConstants';
import { takeUnannouncedUnlocks } from './unlocks';
import { flyIcons } from './fx';
import { play } from './sfx';

export type ChestTier = 'bronze' | 'silver' | 'gold';

export type RewardMoment =
  | { kind: 'levelUp'; level: number; name: string; unlocks: { label: string; blurb: string }[] }
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
  /** Coins and XP already paid but still flying to the HUD; the HUD shows its totals minus these. */
  held: { credits: number; xp: number };
  celebrate: (m: RewardMoment) => void;
  next: () => void;
  float: (text: string, tone: Floater['tone']) => void;
  hold: (kind: 'credits' | 'xp', amount: number) => void;
  release: (kind: 'credits' | 'xp', amount: number) => void;
}

let floaterId = 1;

export const useRewardStore = create<RewardStore>((set) => ({
  queue: [],
  floaters: [],
  held: { credits: 0, xp: 0 },
  hold: (kind, amount) => set((s) => ({ held: { ...s.held, [kind]: s.held[kind] + amount } })),
  release: (kind, amount) => set((s) => ({ held: { ...s.held, [kind]: Math.max(0, s.held[kind] - amount) } })),
  celebrate: (m) => {
    // Coins and XP shown on a moment fly to the HUD when it's dismissed; hold them until then.
    if ('credits' in m && m.credits) useRewardStore.getState().hold('credits', m.credits);
    if ('xp' in m && m.xp) useRewardStore.getState().hold('xp', m.xp);
    set((s) => ({ queue: [...s.queue, m] }));
  },
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

/**
 * Announce a payout. Coins and XP fly from where it happened into the HUD (the balance ticks up as
 * they land), then the milestones play, biggest last.
 */
export function announce(p: Payout, opts: { floats?: boolean; from?: { x: number; y: number } } = {}) {
  const { floats = true, from } = opts;
  let flying = false;
  if (floats) {
    if (p.energy) floatReward(`+${p.energy.toFixed(1)} kWh`, 'energy');
    if (p.xp) {
      void flyTokens('xp', Math.round(p.xp), from);
      flying = true;
    }
    if (p.credits) {
      void flyTokens('credits', Math.round(p.credits), from);
      flying = true;
    }
  }
  const moments: RewardMoment[] = [];
  if (p.legCompletedCity) moments.push({ kind: 'stamp', city: p.legCompletedCity, credits: p.legCredits ?? 0 });
  if (p.journeyComplete) moments.push({ kind: 'journey' });
  if (p.starterCompleted) moments.push({ kind: 'liftOff' });
  if (p.levelUp) moments.push({ kind: 'levelUp', ...p.levelUp, unlocks: takeUnannouncedUnlocks(p.levelUp.level) });
  // Let the tokens land before a full-screen moment covers the HUD.
  if (flying && moments.length) setTimeout(() => moments.forEach(celebrate), 1100);
  else moments.forEach(celebrate);
}

/**
 * Fly coins or XP sparks from a point (default: mid-screen) into the HUD. The amount is held back
 * from the HUD and released a token at a time as they land, so the balance visibly fills up.
 */
export function flyTokens(kind: 'credits' | 'xp', amount: number, from?: { x: number; y: number }, alreadyHeld = false): Promise<void> {
  if (amount <= 0) return Promise.resolve();
  if (!alreadyHeld) useRewardStore.getState().hold(kind, amount);
  const count = Math.max(3, Math.min(12, Math.round(kind === 'credits' ? amount / 5 : amount / 10)));
  const per = amount / count;
  let released = 0;
  return flyIcons({
    kind: kind === 'credits' ? 'coin' : 'xp',
    count,
    from,
    to: kind === 'credits' ? 'hud-coins' : 'hud-level',
    onLand: (i) => {
      const share = i === count - 1 ? amount - released : per;
      released += share;
      useRewardStore.getState().release(kind, share);
      play(kind === 'credits' ? 'tick' : 'collect', Math.min(12, i));
    },
  }).finally(() => {
    // Whatever didn't land (no animation, reduced motion) is shown now.
    if (released < amount) useRewardStore.getState().release(kind, amount - released);
  });
}
