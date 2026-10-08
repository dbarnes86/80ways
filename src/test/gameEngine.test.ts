import { describe, expect, it } from 'vitest';
import {
  activityXP,
  calculateActivityEnergy,
  computeStreak,
  decayedAmount,
  getDistanceCovered,
  getPlayerNarrativeDay,
  longestStreak,
  planDeployment,
} from '@/lib/gameEngine';
import { getLevelFromXP, LEVEL_THRESHOLDS, TOTAL_DISTANCE_KM } from '@/data/gameConstants';
import { getRaidSchedule, getRaidStatus } from '@/data/raids';
import { JOURNEY_LEGS } from '@/data/journeyLegs';

describe('calculateActivityEnergy', () => {
  it('gives 1 kWh for a moderate 30-minute matched activity', () => {
    const r = calculateActivityEnergy({ durationMin: 30, intensity: 'moderate', activityType: 'Running', targetType: 'terrestrial' });
    expect(r.actualEnergy).toBeCloseTo(1);
    expect(r.isOptimal).toBe(true);
  });

  it('halves energy when cross-charging and adds the distance bonus', () => {
    const r = calculateActivityEnergy({ durationMin: 60, intensity: 'vigorous', distanceKm: 10, activityType: 'Running', targetType: 'nautical' });
    expect(r.baseEnergy).toBeCloseTo(3.0 + 2.0);
    expect(r.actualEnergy).toBeCloseTo(2.5);
    expect(r.isOptimal).toBe(false);
  });

  it('applies amplifier and multi-charge', () => {
    const r = calculateActivityEnergy({
      durationMin: 60, intensity: 'moderate', activityType: 'Rowing', targetType: 'nautical', amplifier: true, multiCharge: true,
    });
    expect(r.actualEnergy).toBeCloseTo(4);
    expect(r.spillover).toEqual({ terrestrial: 1, transport: 1, strength: 1 });
  });
});

describe('activityXP', () => {
  it('adds the matched bonus', () => {
    expect(activityXP('moderate', true)).toBe(35);
    expect(activityXP('light', false)).toBe(10);
  });
});

describe('planDeployment', () => {
  it('spends the best-efficiency reserve first and never overshoots', () => {
    const plan = planDeployment({ nautical: 5, strength: 4 }, 'nautical', 6);
    expect(plan.lines[0].type).toBe('nautical');
    expect(plan.totalEffective).toBeCloseTo(6);
    // 5 nautical @100% + 1 kWh effective from strength @75%
    expect(plan.lines[1].amount).toBeCloseTo(1 / 0.75);
    expect(plan.unused).toBeCloseTo(4 - 1 / 0.75);
  });

  it('spends nothing when the target is already met', () => {
    const plan = planDeployment({ terrestrial: 3 }, 'terrestrial', 0);
    expect(plan.totalDeployed).toBe(0);
    expect(plan.unused).toBe(3);
  });
});

describe('decay', () => {
  it('compounds 5% per day', () => {
    expect(decayedAmount(10, 0.05, 24)).toBeCloseTo(9.5);
    expect(decayedAmount(10, 0.05, 48)).toBeCloseTo(9.025);
    expect(decayedAmount(10, 0.05, 0)).toBe(10);
  });
});

describe('narrative progress', () => {
  it('maps leg progress onto the 80 days', () => {
    expect(getPlayerNarrativeDay(0, 0)).toBe(1);
    expect(getPlayerNarrativeDay(2, 0)).toBe(JOURNEY_LEGS[1].daysNarrative);
    expect(getPlayerNarrativeDay(10, 1)).toBe(80);
    expect(getPlayerNarrativeDay(5, 0.5, true)).toBe(80);
  });

  it('covers the full route when complete', () => {
    expect(getDistanceCovered(10, 0, true)).toBe(JOURNEY_LEGS.reduce((s, l) => s + l.distance, 0));
    expect(getDistanceCovered(0, 0)).toBe(0);
    expect(TOTAL_DISTANCE_KM).toBeGreaterThan(0);
  });
});

describe('streaks', () => {
  const today = new Date(2026, 9, 7, 12);
  const day = (offset: number) => new Date(2026, 9, 7 + offset, 9);

  it('counts consecutive days ending today or yesterday', () => {
    expect(computeStreak([day(0), day(-1), day(-2)], today)).toBe(3);
    expect(computeStreak([day(-1), day(-2)], today)).toBe(2);
    expect(computeStreak([day(-2)], today)).toBe(0);
  });

  it('finds the longest run', () => {
    expect(longestStreak([day(-10), day(-9), day(-8), day(-3), day(-1)])).toBe(3);
  });
});

describe('levels', () => {
  it('handles max level without NaN', () => {
    const top = getLevelFromXP(LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 1000);
    expect(top.level).toBe(LEVEL_THRESHOLDS.length);
    expect(top.progress).toBe(1);
  });

  it('starter XP alone unlocks the main journey level', () => {
    expect(getLevelFromXP(150).level).toBe(3);
  });
});

describe('raid schedule', () => {
  it('schedules raids inside the season, two weeks apart', () => {
    const start = new Date('2026-10-07T00:00:00Z');
    const end = new Date(start.getTime() + 180 * 86_400_000);
    const raids = getRaidSchedule(start, end);
    expect(raids.length).toBe(13);
    expect(raids[1].start.getTime() - raids[0].start.getTime()).toBe(14 * 86_400_000);
    expect(raids.every((r) => r.end <= end)).toBe(true);
    expect(new Set(raids.map((r) => r.key)).size).toBe(raids.length);
    expect(getRaidStatus(raids[0], new Date(raids[0].start.getTime() + 1000))).toBe('active');
    expect(getRaidStatus(raids[0], start)).toBe('upcoming');
  });
});
