import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ENCOUNTERS, SOUVENIRS } from '@/data/encounters';
import { ENCOUNTER_BONUS, ENERGY_TYPES, PUNCTUALITY_BONUS, SOUVENIR_SET_CREDITS, TOTAL_LEGS } from '@/data/gameConstants';
import { JOURNEY_LEGS } from '@/data/journeyLegs';
import { bonusRate, decayByTomorrow, drawEncounter, inDepartureWindow, judgeEncounter, nextSouvenir, setComplete } from '@/game/voyage';
import { planNudges } from '@/services/nudges';

// Every write resolves cleanly; no network in tests.
vi.mock('@/lib/supabase', () => {
  const ok = Promise.resolve({ error: null, data: null });
  const chain: Record<string, unknown> = {};
  for (const k of ['from', 'insert', 'update', 'upsert', 'eq', 'select']) chain[k] = () => chain;
  chain.then = ok.then.bind(ok);
  return { supabase: chain };
});

const { deployToLeg } = await import('@/lib/gameActions');
const { useEnergyStore } = await import('@/stores/energyStore');
const { useSeasonStore } = await import('@/stores/seasonStore');
const { useUserStore } = await import('@/stores/userStore');
const { toDayKey } = await import('@/lib/gameEngine');

describe('the encounter deck', () => {
  it('has cards and three souvenirs for every leg', () => {
    expect(ENCOUNTERS).toHaveLength(TOTAL_LEGS);
    expect(SOUVENIRS).toHaveLength(TOTAL_LEGS);
    for (const deck of ENCOUNTERS) expect(deck.length).toBeGreaterThanOrEqual(3);
    for (const set of SOUVENIRS) expect(set).toHaveLength(3);
  });

  it('gives every card two choices that favour different energy', () => {
    for (const card of ENCOUNTERS.flat()) {
      expect(card.choices[0].favours).not.toBe(card.choices[1].favours);
      for (const c of card.choices) expect(ENERGY_TYPES).toContain(c.favours);
    }
  });

  it('uses unique ids', () => {
    const cards = ENCOUNTERS.flat().map((c) => c.id);
    const keepsakes = SOUVENIRS.flat().map((s) => s.id);
    expect(new Set(cards).size).toBe(cards.length);
    expect(new Set(keepsakes).size).toBe(keepsakes.length);
  });

  it('deals the same card all day, and varies across days', () => {
    expect(drawEncounter(3, '2026-10-14')).toBe(drawEncounter(3, '2026-10-14'));
    const seen = new Set(Array.from({ length: 14 }, (_, i) => drawEncounter(3, `2026-10-${String(i + 1).padStart(2, '0')}`)!.id));
    expect(seen.size).toBeGreaterThan(1);
    expect(drawEncounter(99, '2026-10-14')).toBeUndefined();
  });
});

describe('judging an encounter', () => {
  it('turns on the share of the spend that was the favoured kind', () => {
    expect(judgeEncounter([{ type: 'nautical', amount: 1 }], 'nautical')).toBe('triumph');
    expect(judgeEncounter([{ type: 'nautical', amount: 1 }, { type: 'strength', amount: 1 }], 'nautical')).toBe('triumph');
    expect(judgeEncounter([{ type: 'nautical', amount: 1 }, { type: 'strength', amount: 3 }], 'nautical')).toBe('steady');
    expect(judgeEncounter([{ type: 'strength', amount: 2 }], 'nautical')).toBe('setback');
    expect(judgeEncounter([], 'nautical')).toBe('setback');
  });

  it('never tops 20%, and a setback costs nothing', () => {
    expect(bonusRate('triumph', true)).toBeCloseTo(0.2);
    expect(bonusRate('setback', false)).toBe(0);
    expect(bonusRate(undefined, true)).toBe(PUNCTUALITY_BONUS);
  });
});

describe('the departure window', () => {
  it('is open an hour either side', () => {
    const at = (h: number, m: number) => new Date(2026, 9, 14, h, m);
    expect(inDepartureWindow(at(20, 45), 20 * 60 + 45)).toBe(true);
    expect(inDepartureWindow(at(19, 45), 20 * 60 + 45)).toBe(true);
    expect(inDepartureWindow(at(21, 46), 20 * 60 + 45)).toBe(false);
    expect(inDepartureWindow(at(12, 0), 20 * 60 + 45)).toBe(false);
  });

  it('wraps round midnight', () => {
    expect(inDepartureWindow(new Date(2026, 9, 14, 0, 15), 23 * 60 + 30)).toBe(true);
  });
});

describe('decay by tomorrow', () => {
  it('is a day of decay, less any frozen hours', () => {
    const now = new Date(2026, 9, 14, 12);
    expect(decayByTomorrow(10, 0.05, null, now)).toBeCloseTo(0.5);
    expect(decayByTomorrow(10, 0.05, new Date(now.getTime() + 48 * 3_600_000), now)).toBe(0);
    expect(decayByTomorrow(10, 0.05, new Date(now.getTime() - 3_600_000), now)).toBeCloseTo(0.5);
  });
});

describe('souvenirs', () => {
  it('hand out a stop’s keepsakes in turn, then the set is complete', () => {
    const owned: string[] = [];
    for (let i = 0; i < 3; i++) owned.push(nextSouvenir(4, owned)!.id);
    expect(nextSouvenir(4, owned)).toBeUndefined();
    expect(setComplete(4, owned)).toBe(true);
    expect(setComplete(5, owned)).toBe(false);
  });
});

describe('the departure nudge', () => {
  const NOW = new Date('2026-10-14T12:00:00');
  const dep = { minutes: 20 * 60 + 45, doneToday: false, reserves: 4, decay: 0.2 };

  it('fires as the window opens, naming what the reserves will lose', () => {
    const n = planNudges({ now: NOW, workoutDays: new Set(), streak: 0, season: null, departure: dep }).find((p) => p.id === 106)!;
    expect(n.at.getHours()).toBe(19);
    expect(n.at.getMinutes()).toBe(45);
    expect(n.body).toContain('0.2 kWh');
  });

  it('moves to tomorrow once today’s is taken, and stays quiet with nothing to spend', () => {
    const done = planNudges({ now: NOW, workoutDays: new Set(), streak: 0, season: null, departure: { ...dep, doneToday: true } }).find((p) => p.id === 106)!;
    expect(done.at.getDate()).toBe(15);
    const empty = planNudges({ now: NOW, workoutDays: new Set(), streak: 0, season: null, departure: { ...dep, reserves: 0 } });
    expect(empty.find((p) => p.id === 106)).toBeUndefined();
  });
});

describe('stoking the boiler with an encounter', () => {
  const leg = 3; // Suez → Bombay, nautical, 8 kWh
  const today = toDayKey(new Date());
  const card = drawEncounter(leg, today)!;

  beforeEach(() => {
    useUserStore.getState().reset();
    useEnergyStore.getState().reset();
    useSeasonStore.setState({
      activeSeason: { id: 's1', seasonNumber: 1, name: 'S1', description: null, startDate: new Date(2026, 0, 1), endDate: new Date(2027, 0, 1), status: 'active', totalDistanceKm: 0 },
      participation: { id: 'p1', seasonId: 's1', joinedAt: '', joinedAtLeg: leg, currentLeg: leg, legProgress: 0, status: 'active' },
    });
    // Never inside the departure window, so only the encounter counts.
    const now = new Date();
    useUserStore.setState({ departureMinutes: (now.getHours() * 60 + now.getMinutes() + 720) % 1440 });
  });

  it('pays the encounter bonus once a day and brings a souvenir home', async () => {
    const choice = 0;
    const favours = card.choices[choice].favours;
    useEnergyStore.getState().chargeEnergy(favours, 4);

    const res = await deployToLeg({ [favours]: 2 }, { id: card.id, choice });
    expect(res.encounter?.outcome).toBe('triumph');
    expect(res.punctual).toBe(false);
    expect(res.bonus).toBeCloseTo(res.plan.totalEffective * ENCOUNTER_BONUS.triumph);
    expect(res.newProgress).toBeCloseTo(res.plan.totalEffective * (1 + ENCOUNTER_BONUS.triumph));
    expect(res.souvenir?.id).toBe(SOUVENIRS[leg][0].id);
    expect(useUserStore.getState().voyageLog[today].encounter?.id).toBe(card.id);

    // A second play the same day is just a deployment.
    const again = await deployToLeg({ [favours]: 1 }, { id: card.id, choice });
    expect(again.encounter).toBeUndefined();
    expect(again.bonus).toBe(0);
  });

  it('ignores a card the day didn’t deal', async () => {
    useEnergyStore.getState().chargeEnergy('nautical', 4);
    const res = await deployToLeg({ nautical: 1 }, { id: 'not-today', choice: 0 });
    expect(res.encounter).toBeUndefined();
    expect(res.bonus).toBe(0);
  });

  it('pays coins for finishing a set', async () => {
    useUserStore.setState({ souvenirs: SOUVENIRS[leg].slice(0, 2).map((s) => s.id) });
    const favours = card.choices[1].favours;
    useEnergyStore.getState().chargeEnergy(favours, 4);
    const res = await deployToLeg({ [favours]: 1 }, { id: card.id, choice: 1 });
    expect(res.souvenirCredits).toBe(SOUVENIR_SET_CREDITS);
    expect(useUserStore.getState().inventory.credits).toBe(SOUVENIR_SET_CREDITS);
  });

  it('adds the on-time bonus inside the window', async () => {
    const now = new Date();
    useUserStore.setState({ departureMinutes: now.getHours() * 60 + now.getMinutes() });
    useEnergyStore.getState().chargeEnergy('nautical', 4);
    const res = await deployToLeg({ nautical: 1 });
    expect(res.punctual).toBe(true);
    expect(res.bonus).toBeCloseTo(PUNCTUALITY_BONUS);
    expect(JOURNEY_LEGS[leg].requiredEnergy.type).toBe('nautical');
  });
});
