/**
 * Apple Health workouts → game activities. Pure, so the rules are testable without a phone.
 *
 * Every workout charges the reserve its sport belongs to (100% efficiency), so an imported
 * activity is always the best the player could have logged by hand.
 */
import type { EnergyType, Intensity } from '@/data/gameConstants';
import { getNativeEnergyType } from '@/lib/gameEngine';

/** The fields we use from a HealthKit workout (the plugin's Workout type). */
export interface HealthWorkout {
  workoutType: string;
  /** Seconds. */
  duration: number;
  /** Kilocalories. */
  totalEnergyBurned?: number;
  /** Metres. */
  totalDistance?: number;
  startDate: string;
  sourceName?: string;
  /** HealthKit UUID. */
  platformId?: string;
}

export interface ImportPlan {
  externalId: string;
  activityType: string;
  targetType: EnergyType;
  durationMin: number;
  intensity: Intensity;
  distanceKm?: number;
  performedAt: Date;
  sourceName: string;
}

export const MIN_IMPORT_MINUTES = 5;
const MAX_MINUTES = 600; // the activities table's limit
/** How far back the first connection looks, so a new player starts with something in the tank. */
export const BACKFILL_DAYS = 7;

/** HealthKit workout type → activity name in the catalog. Anything unlisted becomes "Workout". */
const WORKOUT_NAMES: Record<string, string> = {
  rowing: 'Rowing',
  rowingMachine: 'Rowing',
  swimming: 'Swimming',
  swimmingPool: 'Swimming',
  swimmingOpenWater: 'Swimming',
  waterFitness: 'Swimming',
  waterPolo: 'Swimming',
  sailing: 'Sailing',
  paddleSports: 'Paddling',
  paddling: 'Paddling',
  surfing: 'Surfing',
  surfingSports: 'Surfing',
  waterSports: 'Paddling',

  running: 'Running',
  runningTreadmill: 'Running',
  trackAndField: 'Running',
  wheelchairRunPace: 'Running',
  walking: 'Walking',
  wheelchairWalkPace: 'Walking',
  wheelchair: 'Walking',
  hiking: 'Hiking',
  snowshoeing: 'Hiking',
  elliptical: 'Elliptical',
  stairClimbing: 'Stair climbing',
  stairClimbingMachine: 'Stair climbing',
  stairs: 'Stair climbing',
  stepTraining: 'Stair climbing',
  dance: 'Dance',
  dancing: 'Dance',
  cardioDance: 'Dance',
  socialDance: 'Dance',
  barre: 'Dance',
  soccer: 'Team sports',
  basketball: 'Team sports',
  americanFootball: 'Team sports',
  australianFootball: 'Team sports',
  rugby: 'Team sports',
  hockey: 'Team sports',
  iceHockey: 'Team sports',
  rollerHockey: 'Team sports',
  lacrosse: 'Team sports',
  handball: 'Team sports',
  volleyball: 'Team sports',
  cricket: 'Team sports',
  baseball: 'Team sports',
  softball: 'Team sports',
  discSports: 'Team sports',
  frisbeedisc: 'Team sports',
  golf: 'Team sports',
  tennis: 'Racket sports',
  squash: 'Racket sports',
  badminton: 'Racket sports',
  racquetball: 'Racket sports',
  tableTennis: 'Racket sports',
  pickleball: 'Racket sports',

  cycling: 'Cycling',
  bikingStationary: 'Cycling',
  handCycling: 'Cycling',
  skatingSports: 'Skating',
  skating: 'Skating',
  iceSkating: 'Skating',
  skiing: 'Skiing',
  downhillSkiing: 'Skiing',
  crossCountrySkiing: 'Skiing',
  snowboarding: 'Skiing',
  snowSports: 'Skiing',

  traditionalStrengthTraining: 'Weightlifting',
  strengthTraining: 'Weightlifting',
  weightlifting: 'Weightlifting',
  functionalStrengthTraining: 'CrossFit',
  crossTraining: 'CrossFit',
  bootCamp: 'CrossFit',
  coreTraining: 'Calisthenics',
  calisthenics: 'Calisthenics',
  gymnastics: 'Calisthenics',
  highIntensityIntervalTraining: 'HIIT',
  mixedCardio: 'HIIT',
  jumpRope: 'HIIT',
  yoga: 'Yoga',
  flexibility: 'Yoga',
  stretching: 'Yoga',
  taiChi: 'Yoga',
  pilates: 'Pilates',
  boxing: 'Martial arts',
  kickboxing: 'Martial arts',
  martialArts: 'Martial arts',
  wrestling: 'Martial arts',
  fencing: 'Martial arts',
  climbing: 'Climbing',
  rockClimbing: 'Climbing',
};

/** Not exercise in the game's sense. */
const SKIPPED = new Set([
  'mindAndBody', 'meditation', 'guidedBreathing', 'cooldown', 'preparationAndRecovery', 'transition',
  'fishing', 'hunting', 'archery', 'bowling', 'curling', 'equestrianSports', 'play', 'fitnessGaming',
]);

/** Gentle by nature when Health has no calorie figure to go on. */
const LIGHT_BY_DEFAULT = new Set(['Walking', 'Yoga', 'Pilates', 'Sailing']);

/** Effort from calories per minute, the one signal every Apple Watch workout carries. */
export function intensityFor(activityType: string, durationMin: number, kcal?: number): Intensity {
  if (kcal && kcal > 0 && durationMin > 0) {
    const perMin = kcal / durationMin;
    if (perMin < 4) return 'light';
    if (perMin < 8) return 'moderate';
    return 'vigorous';
  }
  return LIGHT_BY_DEFAULT.has(activityType) ? 'light' : 'moderate';
}

export function planWorkout(w: HealthWorkout): ImportPlan | null {
  if (!w.platformId || SKIPPED.has(w.workoutType)) return null;
  const minutes = Math.round(w.duration / 60);
  if (minutes < MIN_IMPORT_MINUTES) return null;
  const performedAt = new Date(w.startDate);
  if (Number.isNaN(performedAt.getTime())) return null;

  const activityType = WORKOUT_NAMES[w.workoutType] ?? 'Workout';
  const durationMin = Math.min(minutes, MAX_MINUTES);
  const km = w.totalDistance && w.totalDistance > 0 ? Math.round(w.totalDistance / 10) / 100 : undefined;

  return {
    externalId: w.platformId,
    activityType,
    targetType: getNativeEnergyType(activityType) ?? 'terrestrial',
    durationMin,
    intensity: intensityFor(activityType, minutes, w.totalEnergyBurned),
    distanceKm: km,
    performedAt,
    sourceName: w.sourceName?.trim() || 'Apple Health',
  };
}

/** Workouts to import, oldest first, so Lift Off and streaks fill in the order they happened. */
export function planImport(workouts: HealthWorkout[], alreadyImported: Set<string>): ImportPlan[] {
  const seen = new Set<string>();
  const plans: ImportPlan[] = [];
  for (const w of workouts) {
    const plan = planWorkout(w);
    if (!plan || alreadyImported.has(plan.externalId) || seen.has(plan.externalId)) continue;
    seen.add(plan.externalId);
    plans.push(plan);
  }
  return plans.sort((a, b) => a.performedAt.getTime() - b.performedAt.getTime());
}

/**
 * A stable activity id per player and workout, so the same workout can't be imported twice,
 * from this phone or another one, even after the local game is cleared.
 */
export async function activityIdFor(userId: string, externalId: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`healthkit:${userId}:${externalId}`)));
  bytes[6] = (bytes[6] & 0x0f) | 0x80; // version 8: custom
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = Array.from(bytes.slice(0, 16), (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
