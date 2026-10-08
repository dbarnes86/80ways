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
};

const quest = { id: 'd:x:move', title: 'Get moving' } as Quest;

describe('nextMove', () => {
  it('a reward waiting always comes first', () => {
    expect(nextMove({ ...base, claimable: quest }).action).toBe('claim');
  });

  it('before Lift Off, says how much is left', () => {
    const m = nextMove(base);
    expect(m.id).toBe('liftoff');
    expect(m.title).toBe('3.5 kWh to Lift Off');
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

  it('a live raid beats sailing when you have energy', () => {
    expect(nextMove({ ...base, starterDone: true, level: 3, joined: true, energy: 2, raidActive: true, leg: { to: 'Suez', type: 'terrestrial', remaining: 2 } }).action).toBe('raid');
  });
});
