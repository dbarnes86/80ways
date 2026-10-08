import { describe, expect, it } from 'vitest';
import { nextMove, type NextMoveInput } from '@/game/nextMove';
import type { Quest } from '@/game/quests';

const base: NextMoveInput = {
  starterDone: false,
  starterProgress: 1.5,
  starterRequired: 5,
  level: 1,
  unlockLevel: 3,
  seasonOpen: true,
  joined: false,
  journeyDone: false,
  needsPass: false,
  passCity: 'Paris',
  energy: 0,
  raidActive: false,
  healthOn: true,
  credits: 0,
  boosters: 0,
  cheapestBooster: 60,
  storeOpen: true,
  raidsOpen: true,
};

const quest = { id: 'd:x:move', title: 'Get moving' } as Quest;

describe('nextMove', () => {
  it('a reward waiting always comes first', () => {
    expect(nextMove({ ...base, claimable: quest }).action).toBe('claim');
  });

  it('before Lift Off, says how much is left and names the workout', () => {
    const m = nextMove({ ...base, discipline: 'runner' });
    expect(m.id).toBe('liftoff');
    expect(m.title).toBe('3.5 kWh to Lift Off');
    expect(m.body).toMatch(/^A \d+-minute run does it\./);
  });

  it('an armed Amplifier halves the workout it names', () => {
    const plain = nextMove({ ...base, discipline: 'lifter' }).body.match(/(\d+)-minute/)![1];
    const armed = nextMove({ ...base, discipline: 'lifter', armed: true }).body.match(/(\d+)-minute/)![1];
    expect(Number(armed)).toBeLessThan(Number(plain));
    expect(nextMove({ ...base, discipline: 'lifter', armed: true }).body).toContain('Amplifier armed');
  });

  it('after Lift Off, board the ship (free)', () => {
    expect(nextMove({ ...base, starterDone: true, level: 3 }).action).toBe('board');
  });

  it('on board with energy: stoke the boiler toward the next stop', () => {
    const m = nextMove({ ...base, starterDone: true, level: 3, joined: true, energy: 2, leg: { to: 'Paris', type: 'nautical', remaining: 3 } });
    expect(m.action).toBe('deploy');
    expect(m.kicker).toBe('Next stop: Paris');
  });

  it('on board without energy: says which workouts power the leg', () => {
    const m = nextMove({ ...base, starterDone: true, level: 3, joined: true, energy: 0, leg: { to: 'Paris', type: 'nautical', remaining: 5 } });
    expect(m.id).toBe('charge');
    expect(m.body).toContain('Swim, row or paddle');
  });

  it('past the free legs without a pass: the Season Pass', () => {
    expect(nextMove({ ...base, starterDone: true, level: 3, joined: true, needsPass: true, energy: 4 }).action).toBe('pass');
  });

  it('never points at something not unlocked yet', () => {
    expect(nextMove({ ...base, starterDone: true, level: 3, joined: true, energy: 2, raidActive: true, raidsOpen: false, leg: { to: 'Suez', type: 'terrestrial', remaining: 2 } }).action).toBe('deploy');
  });

  it('a live raid beats sailing when you have energy', () => {
    expect(nextMove({ ...base, starterDone: true, level: 3, joined: true, energy: 2, raidActive: true, leg: { to: 'Suez', type: 'terrestrial', remaining: 2 } }).action).toBe('raid');
  });
});
