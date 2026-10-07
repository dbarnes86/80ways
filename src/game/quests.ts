/**
 * Quests: three a day, three a week, and a story chapter that leads you through the game. Pure
 * functions of the player's activities and progress, so the rules are testable and nothing needs
 * a server. Claimed quests are remembered by id (period + slot), e.g. "d:2026-10-07:move".
 */
import { ENERGY_TYPES, type EnergyType } from '@/data/gameConstants';
import { ENERGY_THEME } from '@/data/energyTheme';
import { JOURNEY_LEGS } from '@/data/journeyLegs';
import { toDayKey } from '@/lib/gameEngine';
import type { ChestTier } from './rewards';

export type QuestPeriod = 'daily' | 'weekly' | 'story';

export interface QuestActivity {
  timestamp: string;
  duration: number;
  actualEnergy: number;
  targetEnergyType: EnergyType;
}

export interface QuestContext {
  now: Date;
  activities: QuestActivity[];
  /** kWh deployed to the expedition, by day key. */
  deployLog: Record<string, number>;
  level: number;
  starterEventCompleted: boolean;
  joinedSeason: boolean;
  currentLeg: number;
  journeyComplete: boolean;
  raidsJoined: number;
  claimed: Set<string>;
}

export interface Quest {
  id: string;
  period: QuestPeriod;
  title: string;
  /** One line, only when the title needs it. */
  hint?: string;
  progress: number;
  target: number;
  /** Shown as "12 / 30 min" or "0.4 / 1 kWh". */
  unit?: 'min' | 'kWh';
  xp: number;
  credits: number;
  chest?: ChestTier;
  complete: boolean;
  claimed: boolean;
  energy?: EnergyType;
}

export const DAILY_REWARD = { xp: 30, credits: 15 };
export const WEEKLY_REWARD = { xp: 100, credits: 50 };
export const WEEKLY_UNLOCK_LEVEL = 2;

/** Monday of the week containing d, as a day key. */
export function weekKey(d: Date): string {
  const monday = new Date(d);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return toDayKey(monday);
}

/** Small stable hash, so the same day always deals the same quests. */
function seed(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return Math.abs(h);
}

const inDay = (a: QuestActivity, day: string) => toDayKey(a.timestamp) === day;
const inWeek = (a: QuestActivity, week: string) => weekKey(new Date(a.timestamp)) === week;

function make(
  period: QuestPeriod,
  key: string,
  slot: string,
  ctx: QuestContext,
  q: Omit<Quest, 'id' | 'period' | 'complete' | 'claimed' | 'xp' | 'credits'> & { xp?: number; credits?: number },
): Quest {
  const id = period === 'story' ? `s:${slot}` : `${period === 'daily' ? 'd' : 'w'}:${key}:${slot}`;
  const reward = period === 'daily' ? DAILY_REWARD : WEEKLY_REWARD;
  return {
    xp: reward.xp,
    credits: reward.credits,
    ...q,
    id,
    period,
    progress: Math.min(q.progress, q.target),
    complete: q.progress >= q.target - 1e-9,
    claimed: ctx.claimed.has(id),
  };
}

export function dailyQuests(ctx: QuestContext): Quest[] {
  const day = toDayKey(ctx.now);
  const today = ctx.activities.filter((a) => inDay(a, day));
  const s = seed(day);
  const energy = ENERGY_TYPES[s % ENERGY_TYPES.length];
  const minutes = today.reduce((t, a) => t + a.duration, 0);
  const kwh = today.reduce((t, a) => t + a.actualEnergy, 0);

  const first =
    s % 2 === 0
      ? make('daily', day, 'move', ctx, { title: 'Get moving', hint: 'Any workout counts', progress: today.length, target: 1 })
      : make('daily', day, 'twenty', ctx, { title: 'A 20-minute workout', progress: today.filter((a) => a.duration >= 20).length, target: 1 });

  const second = make('daily', day, `charge-${energy}`, ctx, {
    title: `Charge ${ENERGY_THEME[energy].label}`,
    hint: chargeHint(energy),
    progress: today.filter((a) => a.targetEnergyType === energy).reduce((t, a) => t + a.actualEnergy, 0),
    target: 0.5,
    unit: 'kWh',
    energy,
  });

  const thirdOptions = [
    make('daily', day, 'kwh', ctx, { title: 'Generate 1 kWh', progress: kwh, target: 1, unit: 'kWh' }),
    make('daily', day, 'active30', ctx, { title: '30 active minutes', progress: minutes, target: 30, unit: 'min' }),
  ];
  if (ctx.joinedSeason) {
    thirdOptions.push(make('daily', day, 'stoke', ctx, { title: 'Stoke the boiler', hint: 'Spend energy on the expedition', progress: ctx.deployLog[day] ?? 0, target: 0.5, unit: 'kWh' }));
  }
  const third = thirdOptions[(s >> 3) % thirdOptions.length];

  return [first, second, third];
}

function chargeHint(type: EnergyType): string {
  return {
    nautical: 'Swim, row or paddle',
    terrestrial: 'Run, walk or hike',
    transport: 'Ride, skate or ski',
    strength: 'Lift, HIIT or yoga',
  }[type];
}

export function weeklyQuests(ctx: QuestContext): Quest[] {
  if (ctx.level < WEEKLY_UNLOCK_LEVEL) return [];
  const week = weekKey(ctx.now);
  const acts = ctx.activities.filter((a) => inWeek(a, week));
  const types = new Set(acts.map((a) => a.targetEnergyType));
  const deployed = Object.entries(ctx.deployLog)
    .filter(([day]) => weekKey(new Date(`${day}T12:00:00`)) === week)
    .reduce((t, [, v]) => t + v, 0);

  return [
    make('weekly', week, 'workouts', ctx, { title: '3 workouts this week', progress: acts.length, target: 3 }),
    make('weekly', week, 'minutes', ctx, { title: '90 active minutes', progress: acts.reduce((t, a) => t + a.duration, 0), target: 90, unit: 'min' }),
    ctx.joinedSeason
      ? make('weekly', week, 'deploy', ctx, { title: 'Spend 3 kWh on the expedition', progress: deployed, target: 3, unit: 'kWh' })
      : make('weekly', week, 'variety', ctx, { title: 'Charge 2 different reserves', progress: types.size, target: 2 }),
  ];
}

/** The story chapters in order. The first unclaimed one is the player's current chapter. */
export function storyQuests(ctx: QuestContext): Quest[] {
  const list: Quest[] = [
    make('story', '', 'fuel', ctx, { title: 'Fuel the engine', hint: 'Bring in your first workout', progress: ctx.activities.length, target: 1, xp: 50, credits: 25 }),
    make('story', '', 'liftoff', ctx, { title: 'Lift Off', hint: 'Fill the departure meter', progress: ctx.starterEventCompleted ? 1 : 0, target: 1, xp: 0, credits: 0, chest: 'bronze' }),
    make('story', '', 'board', ctx, { title: 'Board the expedition', hint: 'Join the season with a Season Pass', progress: ctx.joinedSeason ? 1 : 0, target: 1, xp: 100, credits: 50 }),
  ];
  JOURNEY_LEGS.slice(1).forEach((leg, i) => {
    const legIndex = i + 1;
    list.push(
      make('story', '', `reach-${leg.id}`, ctx, {
        title: `Reach ${leg.to}`,
        hint: leg.narrative.title,
        progress: ctx.joinedSeason && (ctx.currentLeg > legIndex || ctx.journeyComplete) ? 1 : 0,
        target: 1,
        xp: 150,
        credits: 75,
        chest: legIndex % 3 === 0 ? 'silver' : undefined,
      }),
    );
    if (legIndex === 1) {
      list.push(make('story', '', 'raid', ctx, { title: 'Face Detective Fix', hint: 'Hit him once in a raid', progress: ctx.raidsJoined, target: 1, xp: 100, credits: 50 }));
    }
  });
  return list;
}

export const currentStory = (ctx: QuestContext): Quest | undefined => storyQuests(ctx).find((q) => !q.claimed);

/** id of the bonus chest for finishing all of a period's quests. */
export const dailyChestId = (now: Date) => `d:${toDayKey(now)}:chest`;
export const weeklyChestId = (now: Date) => `w:${weekKey(now)}:chest`;

export function allClaimed(quests: Quest[], claimed: Set<string>, justClaimed?: string): boolean {
  return quests.length > 0 && quests.every((q) => q.claimed || claimed.has(q.id) || q.id === justClaimed);
}

/** Drop claim ids older than two weeks so the list doesn't grow for ever. Story ids stay. */
export function pruneClaimed(ids: string[], now: Date): string[] {
  const cutoff = toDayKey(new Date(now.getTime() - 14 * 86_400_000));
  return ids.filter((id) => {
    if (id.startsWith('s:')) return true;
    const date = id.split(':')[1];
    return !date || date >= cutoff;
  });
}

/** Count of quests ready to claim, for the tab badge. */
export function claimableCount(ctx: QuestContext): number {
  const story = currentStory(ctx);
  return [...dailyQuests(ctx), ...weeklyQuests(ctx), ...(story ? [story] : [])].filter((q) => q.complete && !q.claimed).length;
}
