/**
 * The day's departure, as pure rules: which encounter the day deals, how the energy spent decides
 * it, whether the player left on time, what the reserves will lose by tomorrow, and which souvenir
 * a good encounter brings home. No stores, so it's all testable.
 */
import {
  DEPARTURE_WINDOW_MINUTES,
  ENCOUNTER_BONUS,
  ENCOUNTER_STEADY_SHARE,
  ENCOUNTER_TRIUMPH_SHARE,
  PUNCTUALITY_BONUS,
  type EncounterOutcome,
  type EnergyType,
} from '@/data/gameConstants';
import { ENCOUNTERS, SOUVENIRS, type Encounter, type Souvenir } from '@/data/encounters';
import { decayedAmount } from '@/lib/gameEngine';

/** Small stable hash, so the same day on the same leg always deals the same card. */
function seed(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return Math.abs(h);
}

export function drawEncounter(legIndex: number, dayKey: string): Encounter | undefined {
  const deck = ENCOUNTERS[legIndex];
  if (!deck?.length) return undefined;
  return deck[seed(`${dayKey}:${legIndex}`) % deck.length];
}

/** How the encounter went, from the share of the spend that was the kind the choice favoured. */
export function judgeEncounter(lines: { type: EnergyType; amount: number }[], favours: EnergyType): EncounterOutcome {
  const total = lines.reduce((s, l) => s + l.amount, 0);
  if (total <= 0) return 'setback';
  const share = lines.filter((l) => l.type === favours).reduce((s, l) => s + l.amount, 0) / total;
  if (share >= ENCOUNTER_TRIUMPH_SHARE - 1e-9) return 'triumph';
  if (share >= ENCOUNTER_STEADY_SHARE - 1e-9) return 'steady';
  return 'setback';
}

export const bonusRate = (outcome: EncounterOutcome | undefined, punctual: boolean) =>
  (outcome ? ENCOUNTER_BONUS[outcome] : 0) + (punctual ? PUNCTUALITY_BONUS : 0);

const minutesOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes();

/** Within the window either side of the departure time, wrapping round midnight. */
export function inDepartureWindow(now: Date, departure: number): boolean {
  const diff = Math.abs(minutesOfDay(now) - departure);
  return Math.min(diff, 1440 - diff) <= DEPARTURE_WINDOW_MINUTES;
}

/** "8:45 PM", or the device's own format. */
export function formatDeparture(departure: number): string {
  const d = new Date(2000, 0, 1, Math.floor(departure / 60), departure % 60);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** kWh the reserves will lose over the next day, allowing for a Decay Inhibitor. */
export function decayByTomorrow(total: number, ratePerDay: number, frozenUntil: Date | null, now: Date = new Date()): number {
  const frozenHours = frozenUntil && frozenUntil > now ? Math.min(24, (frozenUntil.getTime() - now.getTime()) / 3_600_000) : 0;
  return total - decayedAmount(total, ratePerDay, 24 - frozenHours);
}

/** The next keepsake this leg can give, if any are left. */
export function nextSouvenir(legIndex: number, owned: readonly string[]): Souvenir | undefined {
  return SOUVENIRS[legIndex]?.find((s) => !owned.includes(s.id));
}

export function setComplete(legIndex: number, owned: readonly string[]): boolean {
  const set = SOUVENIRS[legIndex];
  return !!set?.length && set.every((s) => owned.includes(s.id));
}
