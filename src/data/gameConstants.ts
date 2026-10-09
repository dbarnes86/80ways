/**
 * ATW80 Game Constants & Pacing Configuration
 * 
 * Grounded in the GDD: 6-month seasons, 11 legs, 4 energy types,
 * XP-based progression with gating, and a mandatory starter event.
 */

// ─── Season Pacing ──────────────────────────────────────────────
export const SEASON_DURATION_DAYS = 180; // 6 months
export const TOTAL_LEGS = 11;
export const TOTAL_DISTANCE_KM = 35_310;

/**
 * Energy required per leg (mirrors journeyLegs). Total 91.5 kWh: about 60 average workouts, a
 * season at three a week. The first two fall in a workout or two each, so the start is quick.
 */
export const ENERGY_PER_LEG = [1.5, 3, 5, 8, 8, 10, 10, 12, 12, 14, 8] as const;
export const TOTAL_ENERGY_REQUIRED = ENERGY_PER_LEG.reduce((a, b) => a + b, 0); // 127 kWh

// ─── Energy Mechanics ───────────────────────────────────────────
export const ENERGY_CAPACITY_DEFAULT = 20; // kWh max per type
export const ENERGY_DECAY_RATE = 0.05; // 5% per day

/**
 * kWh per hour by intensity, plus ENERGY_PER_KM for distance. Tuned so an average adult's workout
 * (a 20-minute walk) is about 0.6 kWh and a 30-minute run about 2: the first workout lights the
 * boiler, the first legs fall in one or two more, and a full season is a few workouts a week.
 */
export const INTENSITY_MULTIPLIERS = {
  light: 1.0,
  moderate: 2.0,
  vigorous: 3.0,
} as const;

/** When the activity's native type matches the energy type being charged */
export const NATIVE_ACTIVITY_BONUS = 1.0; // 100% bonus (2x)
export const MISMATCH_ACTIVITY_BONUS = 0.5; // 50% bonus (1.5x)

/** Deployment efficiency: how much of deployed energy counts toward challenge */
export const DEPLOYMENT_EFFICIENCY = {
  optimal: 1.0,   // Energy type matches challenge type
  related: 0.75,  // Related type (e.g., terrestrial for transport)
  unrelated: 0.5, // Completely mismatched
} as const;

/** Which energy types are "related" to each challenge type */
export const ENERGY_RELATIONS: Record<string, string[]> = {
  nautical: ['strength'],       // Rowing needs strength
  terrestrial: ['transport'],   // Walking/running relates to cycling
  transport: ['terrestrial'],   // Cycling relates to walking
  strength: ['nautical'],       // Strength relates to rowing
};

// ─── Player Progression (XP & Levels) ───────────────────────────
export const XP_PER_ACTIVITY = {
  light: 10,
  moderate: 25,
  vigorous: 50,
} as const;

/**
 * Workouts from before the player joined (the first Health import's backlog) pay their energy in
 * full but share this much XP between them: enough for level 2. A keen exerciser's week would
 * otherwise jump them to level 5 and unlock half the game in the first sitting.
 */
export const HISTORY_XP_CAP = 50;

export const XP_PER_ENERGY_DEPLOYED = 15; // per kWh deployed
export const XP_PER_LEG_COMPLETED = 200;
export const XP_PER_RAID_CONTRIBUTION = 100;

/**
 * Level thresholds: cumulative XP needed to reach each level.
 * Level 1 = starting, Level 3 = unlocks main journey.
 */
export const LEVEL_THRESHOLDS = [
  0,      // Level 1 (start)
  50,     // Level 2
  150,    // Level 3 — unlocks main seasonal journey
  400,    // Level 4
  800,    // Level 5
  1500,   // Level 6
  2500,   // Level 7
  4000,   // Level 8
  6000,   // Level 9
  9000,   // Level 10
  13000,  // Level 11
  18000,  // Level 12
  25000,  // Level 13
  35000,  // Level 14
  50000,  // Level 15 (journey master)
] as const;

export const LEVEL_NAMES = [
  'Novice Traveller',      // 1
  'Apprentice Explorer',   // 2
  'Expedition Member',     // 3 — journey unlock
  'Seasoned Voyager',      // 4
  'Globe Trotter',         // 5
  'World Navigator',       // 6
  'Master Cartographer',   // 7
  'Legendary Explorer',    // 8
  'Circumnavigator',       // 9
  'Fogg\'s Equal',         // 10
  'Time Bender',           // 11
  'World Shaper',          // 12
  'Myth Maker',            // 13
  'Era Definer',           // 14
  'Eternal Voyager',       // 15
] as const;

export const MAIN_JOURNEY_UNLOCK_LEVEL = 3;
/** Legs every player sails free from where they board; the Season Pass covers the rest. Matches the RLS policies. */
export const FREE_LEGS = 2;

// ─── Starter Event (Lift Off) ───────────────────────────────────
/**
 * Per GDD Q6: "Lift Off Event" — first engagement for new players.
 * Always available. Players charge a personal meter to 0.5 kWh (one workout)
 * to prove they understand the mechanics before joining the main journey.
 */
export const STARTER_EVENT = {
  id: 'lift-off',
  name: 'Lift Off: Departure Preparations',
  description:
    'Before joining Fogg\'s expedition, prove your worth! Complete fitness activities to charge the departure meter. Once full, you\'ll be cleared to join the journey at its current location.',
  requiredEnergy: 0.5, // kWh total across any type: one workout of any kind, even a short walk
  xpReward: 150, // Enough to reach Level 3 combined with activity XP
  narrative: {
    intro: 'Passepartout rushes to find you at the Reform Club: "Monsieur Fogg needs able crew! But first, show us you can keep up."',
    progress50: 'Passepartout nods approvingly: "Not bad! Keep it up — Monsieur Fogg doesn\'t wait for anyone."',
    complete: 'Fogg looks up from his newspaper: "Adequate. Welcome aboard. We depart immediately."',
  },
} as const;

// ─── Narrative Day Mapping ──────────────────────────────────────
/**
 * Maps real-world season progress to narrative days (1-80).
 * Linear interpolation: day 1 at season start, day 80 at season end.
 */
export function getRealDayToNarrativeDay(
  seasonStartDate: Date,
  currentDate: Date = new Date()
): number {
  const elapsed = currentDate.getTime() - seasonStartDate.getTime();
  const totalMs = SEASON_DURATION_DAYS * 24 * 60 * 60 * 1000;
  const progress = Math.max(0, Math.min(1, elapsed / totalMs));
  return Math.max(1, Math.ceil(progress * 80));
}

/**
 * Determines which global leg should be active based on elapsed season time.
 * Legs are distributed proportionally by their energy requirements.
 */
export function getExpectedGlobalLeg(
  seasonStartDate: Date,
  currentDate: Date = new Date()
): number {
  const elapsed = currentDate.getTime() - seasonStartDate.getTime();
  const totalMs = SEASON_DURATION_DAYS * 24 * 60 * 60 * 1000;
  const progress = Math.max(0, Math.min(1, elapsed / totalMs));

  let cumulative = 0;
  for (let i = 0; i < ENERGY_PER_LEG.length; i++) {
    cumulative += ENERGY_PER_LEG[i];
    if (cumulative / TOTAL_ENERGY_REQUIRED >= progress) {
      return i;
    }
  }
  return TOTAL_LEGS - 1;
}

/**
 * Calculate a player's level from their XP.
 */
export function getLevelFromXP(xp: number): { level: number; name: string; xpForNext: number; xpInLevel: number; progress: number } {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const xpInLevel = xp - currentThreshold;
  const xpForNext = nextThreshold - currentThreshold;
  
  return {
    level,
    name: LEVEL_NAMES[level - 1] || 'Unknown',
    xpForNext,
    xpInLevel,
    progress: xpForNext > 0 ? Math.min(1, xpInLevel / xpForNext) : 1,
  };
}

/**
 * Calculate deployment efficiency based on energy type vs challenge type.
 */
export function getDeploymentEfficiency(
  energyType: string,
  challengeType: string
): number {
  if (energyType === challengeType) return DEPLOYMENT_EFFICIENCY.optimal;
  if (ENERGY_RELATIONS[challengeType]?.includes(energyType)) return DEPLOYMENT_EFFICIENCY.related;
  return DEPLOYMENT_EFFICIENCY.unrelated;
}

// ─── Energy Types ───────────────────────────────────────────────
export type EnergyType = 'nautical' | 'terrestrial' | 'transport' | 'strength';
export type Intensity = 'light' | 'moderate' | 'vigorous';
export const ENERGY_TYPES: EnergyType[] = ['nautical', 'terrestrial', 'transport', 'strength'];

/** Logging an activity into its native reserve is 100% efficient, anything else 50%. */
export const ACTIVITY_MATCH_EFFICIENCY = 1.0;
export const ACTIVITY_MISMATCH_EFFICIENCY = 0.5;
/** Each km covered adds this much base energy on top of time × intensity. */
export const ENERGY_PER_KM = 0.2;
export const KM_PER_MILE = 1.609344;

/** Extra XP for charging the reserve that matches the activity. */
export const XP_OPTIMAL_MATCH_BONUS = 10;

// ─── Daily Mission ──────────────────────────────────────────────
export const DAILY_MISSION = {
  name: 'Daily Constitutional',
  description: 'Complete any 30-minute activity',
  minDuration: 30,
  xpReward: 25,
  creditReward: 15,
} as const;

// ─── Credits (in-game currency) ─────────────────────────────────
export const CREDITS_PER_ACTIVITY = 5;
export const CREDITS_STARTER_EVENT = 100;
export const CREDITS_PER_LEG_BASE = 50;
export const CREDITS_PER_LEG_STEP = 10; // + per leg number, later legs pay more
export const CREDITS_JOURNEY_COMPLETE = 500;
export const CREDITS_RAID_SUCCESS = 150;

// ─── Boosters ───────────────────────────────────────────────────
export type BoosterId = 'energyAmplifier' | 'multiCharge' | 'decayInhibitor';

export const BOOSTERS: Record<BoosterId, { name: string; description: string; price: number; rarity: 'common' | 'rare' | 'epic' }> = {
  energyAmplifier: {
    name: 'Energy Amplifier',
    description: 'Doubles the energy from one logged activity.',
    price: 60,
    rarity: 'common',
  },
  decayInhibitor: {
    name: 'Decay Inhibitor',
    description: 'Freezes reserve decay for 72 hours.',
    price: 75,
    rarity: 'rare',
  },
  multiCharge: {
    name: 'Multi-Charge',
    description: 'One logged activity also charges every other reserve at 25% of its output.',
    price: 90,
    rarity: 'epic',
  },
};

export const DECAY_INHIBITOR_HOURS = 72;
export const MULTI_CHARGE_SPILLOVER = 0.25;
