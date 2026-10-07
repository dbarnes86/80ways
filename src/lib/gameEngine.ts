/**
 * Pure game rules. No stores, no network — everything here is deterministic
 * so it can be unit tested and shared by the UI and the action layer.
 */
import {
  ACTIVITY_MATCH_EFFICIENCY,
  ACTIVITY_MISMATCH_EFFICIENCY,
  ENERGY_PER_KM,
  ENERGY_TYPES,
  INTENSITY_MULTIPLIERS,
  MULTI_CHARGE_SPILLOVER,
  XP_OPTIMAL_MATCH_BONUS,
  XP_PER_ACTIVITY,
  getDeploymentEfficiency,
  type EnergyType,
  type Intensity,
} from '@/data/gameConstants';
import { JOURNEY_LEGS } from '@/data/journeyLegs';

// ─── Activities ─────────────────────────────────────────────────
export const ACTIVITY_CATALOG: Record<string, EnergyType> = {
  Rowing: 'nautical',
  Swimming: 'nautical',
  Sailing: 'nautical',
  Kayaking: 'nautical',
  Running: 'terrestrial',
  Walking: 'terrestrial',
  Hiking: 'terrestrial',
  Jogging: 'terrestrial',
  Cycling: 'transport',
  Skateboarding: 'transport',
  Rollerblading: 'transport',
  'E-biking': 'transport',
  Weightlifting: 'strength',
  CrossFit: 'strength',
  Calisthenics: 'strength',
  Yoga: 'strength',
};

export const getNativeEnergyType = (activityType: string): EnergyType | undefined =>
  ACTIVITY_CATALOG[activityType];

export interface ActivityEnergyInput {
  durationMin: number;
  intensity: Intensity;
  distanceKm?: number;
  activityType: string;
  targetType: EnergyType;
  amplifier?: boolean;
  multiCharge?: boolean;
}

export interface ActivityEnergyResult {
  baseEnergy: number;
  efficiency: number;
  /** Energy charged into the target reserve (after efficiency and amplifier). */
  actualEnergy: number;
  /** Extra energy charged into the other reserves (Multi-Charge only). */
  spillover: Partial<Record<EnergyType, number>>;
  isOptimal: boolean;
}

export function calculateActivityEnergy(input: ActivityEnergyInput): ActivityEnergyResult {
  const duration = Math.max(0, input.durationMin);
  const distance = input.distanceKm && input.distanceKm > 0 ? input.distanceKm : 0;

  const baseEnergy = (duration / 60) * INTENSITY_MULTIPLIERS[input.intensity] + distance * ENERGY_PER_KM;
  const isOptimal = getNativeEnergyType(input.activityType) === input.targetType;
  const efficiency = isOptimal ? ACTIVITY_MATCH_EFFICIENCY : ACTIVITY_MISMATCH_EFFICIENCY;
  const actualEnergy = baseEnergy * efficiency * (input.amplifier ? 2 : 1);

  const spillover: Partial<Record<EnergyType, number>> = {};
  if (input.multiCharge) {
    for (const type of ENERGY_TYPES) {
      if (type !== input.targetType) spillover[type] = actualEnergy * MULTI_CHARGE_SPILLOVER;
    }
  }

  return { baseEnergy, efficiency, actualEnergy, spillover, isOptimal };
}

export const activityXP = (intensity: Intensity, isOptimal: boolean) =>
  XP_PER_ACTIVITY[intensity] + (isOptimal ? XP_OPTIMAL_MATCH_BONUS : 0);

// ─── Deployment ─────────────────────────────────────────────────
export interface DeploymentLine {
  type: EnergyType;
  amount: number;
  efficiency: number;
  effective: number;
}

export interface DeploymentPlan {
  lines: DeploymentLine[];
  totalDeployed: number;
  totalEffective: number;
  /** Energy the player selected that won't be spent because the target is already met. */
  unused: number;
}

/**
 * Turn the player's slider selections into what actually gets spent.
 * Best-efficiency reserves are spent first and nothing is wasted past
 * `remaining` — leftover selection stays in the reserves.
 */
export function planDeployment(
  selection: Partial<Record<EnergyType, number>>,
  targetType: EnergyType,
  remaining: number,
): DeploymentPlan {
  const ordered = ENERGY_TYPES
    .map((type) => ({ type, amount: Math.max(0, selection[type] ?? 0), efficiency: getDeploymentEfficiency(type, targetType) }))
    .filter((l) => l.amount > 0)
    .sort((a, b) => b.efficiency - a.efficiency);

  let left = Math.max(0, remaining);
  const lines: DeploymentLine[] = [];
  let selected = 0;

  for (const l of ordered) {
    selected += l.amount;
    if (left <= 1e-9) continue;
    const maxUseful = left / l.efficiency;
    const amount = Math.min(l.amount, maxUseful);
    const effective = amount * l.efficiency;
    left -= effective;
    lines.push({ type: l.type, amount, efficiency: l.efficiency, effective });
  }

  const totalDeployed = lines.reduce((s, l) => s + l.amount, 0);
  const totalEffective = lines.reduce((s, l) => s + l.effective, 0);
  return { lines, totalDeployed, totalEffective, unused: Math.max(0, selected - totalDeployed) };
}

// ─── Energy decay ───────────────────────────────────────────────
/** Compounding decay: `rate` per day, applied over `hours`. */
export function decayedAmount(current: number, ratePerDay: number, hours: number): number {
  if (current <= 0 || hours <= 0) return Math.max(0, current);
  return current * Math.pow(1 - ratePerDay, hours / 24);
}

// ─── Narrative ──────────────────────────────────────────────────
/**
 * The player's position in Fogg's 80 days, driven by their own leg progress.
 * Each leg spans from the previous leg's arrival day to its own.
 */
export function getPlayerNarrativeDay(legIndex: number, legFraction: number, completed = false): number {
  if (completed) return 80;
  const leg = JOURNEY_LEGS[legIndex];
  if (!leg) return 80;
  const startDay = legIndex === 0 ? 0 : JOURNEY_LEGS[legIndex - 1].daysNarrative;
  const f = Math.max(0, Math.min(1, legFraction));
  return Math.max(1, Math.floor(startDay + (leg.daysNarrative - startDay) * f));
}

export function getDistanceCovered(legIndex: number, legFraction: number, completed = false): number {
  const legs = completed ? JOURNEY_LEGS.length : legIndex;
  let km = JOURNEY_LEGS.slice(0, legs).reduce((s, l) => s + l.distance, 0);
  if (!completed && JOURNEY_LEGS[legIndex]) {
    km += JOURNEY_LEGS[legIndex].distance * Math.max(0, Math.min(1, legFraction));
  }
  return Math.round(km);
}

export const legCreditReward = (legNumber: number, base: number, step: number) => base + step * legNumber;

// ─── Streaks & dates ────────────────────────────────────────────
export const toDayKey = (d: Date | string) => {
  const date = typeof d === 'string' ? new Date(d) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

/** Consecutive days with at least one activity, ending today (or yesterday, if today is still open). */
export function computeStreak(dates: Array<Date | string>, today: Date = new Date()): number {
  const days = new Set(dates.map(toDayKey));
  const cursor = new Date(today);
  if (!days.has(toDayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(toDayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function longestStreak(dates: Array<Date | string>): number {
  const keys = Array.from(new Set(dates.map(toDayKey))).sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of keys) {
    const [y, m, d] = k.split('-').map(Number);
    const cur = new Date(y, m - 1, d);
    run = prev && Math.round((cur.getTime() - prev.getTime()) / 86_400_000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = cur;
  }
  return best;
}
