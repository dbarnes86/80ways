import { beforeEach, describe, expect, it } from 'vitest';
import { isUnlocked, seedAnnouncedUnlocks, takeUnannouncedUnlocks } from '@/game/unlocks';

describe('unlocks', () => {
  beforeEach(() => localStorage.clear());

  it('a new player sees only the basics', () => {
    expect(isUnlocked('quests', 1)).toBe(false);
    expect(isUnlocked('map', 2)).toBe(false);
    expect(isUnlocked('map', 3)).toBe(true);
  });

  it('jumping two levels announces everything in between, once', () => {
    seedAnnouncedUnlocks(1);
    expect(takeUnannouncedUnlocks(3).map((u) => u.label)).toEqual(['Quests', 'Energy reserves', 'The Map', 'Season Pass']);
    expect(takeUnannouncedUnlocks(3)).toEqual([]);
    expect(takeUnannouncedUnlocks(4).map((u) => u.label)).toEqual(['The Chandlery']);
  });

  it('existing players are not re-told about things they already had', () => {
    seedAnnouncedUnlocks(4);
    expect(takeUnannouncedUnlocks(5).map((u) => u.label)).toEqual(['Raids']);
  });
});
