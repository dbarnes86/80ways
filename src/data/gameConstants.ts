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
 * Energy required per leg, calibrated so the total (127 kWh)
 * is achievable over 180 days at ~0.7 kWh/day for an active player.
 * A "moderate" 30-min activity ≈ 0.5 kWh base.
 */
export const ENERGY_PER_LEG = [3, 5, 8, 12, 10, 15, 13, 20, 15, 18, 8] as const;
export const TOTAL_ENERGY_REQUIRED = ENERGY_PER_LEG.reduce((a, b) => a + b, 0); // 127 kWh

// ─── Energy Mechanics ───────────────────────────────────────────
export const ENERGY_CAPACITY_DEFAULT = 10; // kWh max per type
export const ENERGY_DECAY_RATE = 0.05; // 5% per day

export const INTENSITY_MULTIPLIERS = {
  light: 0.5,
  moderate: 1.0,
  vigorous: 1.5,
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

// ─── Starter Event (Lift Off) ───────────────────────────────────
/**
 * Per GDD Q6: "Lift Off Event" — first engagement for new players.
 * Always available. Players charge a personal meter to 5.0 kWh
 * to prove they understand the mechanics before joining the main journey.
 */
export const STARTER_EVENT = {
  id: 'lift-off',
  name: 'Lift Off: Departure Preparations',
  description:
    'Before joining Fogg\'s expedition, prove your worth! Complete fitness activities to charge the departure meter. Once full, you\'ll be cleared to join the journey at its current location.',
  requiredEnergy: 5.0, // kWh total across any type
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
    progress: Math.min(1, xpInLevel / xpForNext),
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
