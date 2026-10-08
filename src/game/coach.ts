/**
 * The coach: turns "you're 1.2 kWh short" into "a 20-minute lift fills it". Pure maths over the
 * game's own energy rules, so the advice is always true. Used on Home, in onboarding and on the
 * deploy screen, the three places the player asks "so what do I do now?".
 */
import { ACTIVITY_MATCH_EFFICIENCY, ENERGY_PER_KM, ENERGY_TYPES, INTENSITY_MULTIPLIERS, getDeploymentEfficiency, type EnergyType } from '@/data/gameConstants';
import type { Discipline } from '@/stores/userStore';

/** The plain-English workout for each energy type, in the form "a 20-minute <verb>". */
export const WORKOUT_FOR: Record<EnergyType, string> = {
  nautical: 'swim',
  terrestrial: 'run',
  transport: 'ride',
  strength: 'lift',
};

export const DISCIPLINE_ENERGY: Record<Discipline, EnergyType> = {
  runner: 'terrestrial',
  rider: 'transport',
  swimmer: 'nautical',
  lifter: 'strength',
};

/** A steady pace per type, in km/h, since distance counts toward energy. Lifting has none. */
const PACE_KMH: Record<EnergyType, number> = { terrestrial: 10, transport: 20, nautical: 2, strength: 0 };

/** kWh an hour of a moderate workout of this type charges into its own reserve. */
export const kwhPerHour = (type: EnergyType, amplifier = false) =>
  (INTENSITY_MULTIPLIERS.moderate + PACE_KMH[type] * ENERGY_PER_KM) * ACTIVITY_MATCH_EFFICIENCY * (amplifier ? 2 : 1);

/** Minutes of a moderate workout of this type needed to charge `kwh`, rounded up to five. */
export function minutesFor(kwh: number, type: EnergyType, opts: { amplifier?: boolean } = {}): number {
  // Round up: advice should never come up short.
  return Math.max(5, Math.ceil((kwh / kwhPerHour(type, opts.amplifier)) * 60 / 5) * 5);
}

export const describe = (minutes: number, type: EnergyType) => `a ${minutes}-minute ${WORKOUT_FOR[type]}`;

export interface Advice {
  /** One line, ready to show. */
  line: string;
  minutes: number;
  type: EnergyType;
}

/** Lift Off takes any energy, so the shortest route is the player's own discipline. */
export function liftOffAdvice(shortKwh: number, discipline: Discipline | null, armed: boolean): Advice | null {
  if (shortKwh <= 0) return null;
  const type = DISCIPLINE_ENERGY[discipline ?? 'runner'];
  const minutes = minutesFor(shortKwh, type, { amplifier: armed });
  return { line: `${cap(describe(minutes, type))} does it${armed ? ', with the Amplifier armed' : ''}.`, minutes, type };
}

export interface LegAdvice {
  /** What this leg wants and what the player has, in a sentence. */
  situation: string;
  /** What to do about the gap, if there is one. */
  next: string | null;
  /** kWh still needed after spending every reserve at its value for this leg. */
  shortKwh: number;
}

/**
 * Advice for a leg: how the reserves the player holds are valued against it, and the one workout
 * that would close the gap, matched to the leg first and in their own discipline second.
 */
export function legAdvice(input: {
  targetType: EnergyType;
  remaining: number;
  reserves: Record<EnergyType, number>;
  discipline: Discipline | null;
}): LegAdvice {
  const { targetType, remaining, reserves } = input;
  const own = DISCIPLINE_ENERGY[input.discipline ?? 'runner'];
  const held = ENERGY_TYPES.filter((t) => reserves[t] >= 0.05);
  const effective = held.reduce((sum, t) => sum + reserves[t] * getDeploymentEfficiency(t, targetType), 0);
  const shortKwh = Math.max(0, remaining - effective);

  const want = `This leg runs on ${label(targetType)}`;
  const matchedHeld = reserves[targetType] >= 0.05;
  const others = held.filter((t) => t !== targetType);
  const otherKwh = others.reduce((sum, t) => sum + reserves[t], 0);
  let situation: string;
  if (held.length === 0) situation = `${want}. Your reserves are empty.`;
  else if (others.length === 0) situation = `${want}, and that's what you've got: ${reserves[targetType].toFixed(1)} kWh at full value.`;
  else if (others.length === 1) {
    const t = others[0];
    situation = `${want}. You have ${matchedHeld ? `${reserves[targetType].toFixed(1)} ${label(targetType)} at full value and ` : ''}${reserves[t].toFixed(1)} ${label(t)} at ${valueWord(getDeploymentEfficiency(t, targetType))}.`;
  } else {
    situation = `${want}. You have ${matchedHeld ? `${reserves[targetType].toFixed(1)} ${label(targetType)} at full value, plus ` : ''}${otherKwh.toFixed(1)} kWh of other types at half to three-quarters.`;
  }

  if (shortKwh <= 0) {
    const next = others.length ? `Enough for the leg. Next time ${describe(minutesFor(remaining, targetType), targetType)} would cover it at full value.` : null;
    return { situation, next, shortKwh };
  }

  const matched = minutesFor(shortKwh, targetType);
  const ownEff = getDeploymentEfficiency(own, targetType);
  const next =
    own === targetType
      ? `${shortKwh.toFixed(1)} kWh short. ${cap(describe(matched, targetType))} fills it.`
      : `${shortKwh.toFixed(1)} kWh short. ${cap(describe(matched, targetType))} fills it, or ${describe(minutesFor(shortKwh / ownEff, own), own)} at ${valueWord(ownEff)}.`;
  return { situation, next, shortKwh };
}

export const label = (t: EnergyType) => ({ nautical: 'Nautical', terrestrial: 'Terrestrial', transport: 'Transport', strength: 'Strength' })[t];
export const valueWord = (eff: number) => (eff >= 1 ? 'full value' : eff >= 0.75 ? '¾ value' : '½ value');
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
