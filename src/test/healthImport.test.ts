// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { activityIdFor, intensityFor, planImport, planWorkout, type HealthWorkout } from '@/lib/healthImport';
import { calculateActivityEnergy, getNativeEnergyType } from '@/lib/gameEngine';

const workout = (over: Partial<HealthWorkout> = {}): HealthWorkout => ({
  workoutType: 'running',
  duration: 30 * 60,
  totalEnergyBurned: 300,
  totalDistance: 5_230,
  startDate: '2026-10-05T07:00:00Z',
  sourceName: 'Apple Watch',
  platformId: 'A1B2C3D4-0000-0000-0000-000000000001',
  ...over,
});

describe('planWorkout', () => {
  it('turns a Watch run into a terrestrial activity with distance and effort', () => {
    expect(planWorkout(workout())).toMatchObject({
      activityType: 'Running',
      targetType: 'terrestrial',
      durationMin: 30,
      intensity: 'vigorous',
      distanceKm: 5.23,
      sourceName: 'Apple Watch',
    });
  });

  it.each([
    ['swimmingPool', 'Swimming', 'nautical'],
    ['rowingMachine', 'Rowing', 'nautical'],
    ['cycling', 'Cycling', 'transport'],
    ['bikingStationary', 'Cycling', 'transport'],
    ['traditionalStrengthTraining', 'Weightlifting', 'strength'],
    ['highIntensityIntervalTraining', 'HIIT', 'strength'],
    ['yoga', 'Yoga', 'strength'],
    ['tennis', 'Racket sports', 'terrestrial'],
    ['somethingNew', 'Workout', 'terrestrial'],
  ])('maps %s to %s (%s)', (type, name, reserve) => {
    const plan = planWorkout(workout({ workoutType: type }))!;
    expect(plan.activityType).toBe(name);
    expect(plan.targetType).toBe(reserve);
  });

  it('always charges the native reserve, so imports are 100% efficient', () => {
    const plan = planWorkout(workout({ workoutType: 'swimming' }))!;
    expect(getNativeEnergyType(plan.activityType)).toBe(plan.targetType);
    expect(calculateActivityEnergy({ ...plan, durationMin: plan.durationMin }).efficiency).toBe(1);
  });

  it('skips short sessions, meditation and anything without a HealthKit id', () => {
    expect(planWorkout(workout({ duration: 4 * 60 }))).toBeNull();
    expect(planWorkout(workout({ workoutType: 'mindAndBody' }))).toBeNull();
    expect(planWorkout(workout({ platformId: undefined }))).toBeNull();
  });

  it('caps very long workouts at the table limit', () => {
    expect(planWorkout(workout({ workoutType: 'hiking', duration: 12 * 3600 }))!.durationMin).toBe(600);
  });
});

describe('intensityFor', () => {
  it('reads effort from calories per minute', () => {
    expect(intensityFor('Running', 30, 90)).toBe('light');
    expect(intensityFor('Running', 30, 180)).toBe('moderate');
    expect(intensityFor('Running', 30, 300)).toBe('vigorous');
  });

  it('falls back to the sport when there are no calories', () => {
    expect(intensityFor('Walking', 30)).toBe('light');
    expect(intensityFor('Cycling', 30)).toBe('moderate');
  });
});

describe('planImport', () => {
  it('drops ones already imported and duplicates, oldest first', () => {
    const a = workout({ platformId: 'a', startDate: '2026-10-05T07:00:00Z' });
    const b = workout({ platformId: 'b', startDate: '2026-10-03T07:00:00Z' });
    const c = workout({ platformId: 'c', startDate: '2026-10-04T07:00:00Z' });
    const plans = planImport([a, b, c, a], new Set(['c']));
    expect(plans.map((p) => p.externalId)).toEqual(['b', 'a']);
  });
});

describe('activityIdFor', () => {
  it('is a stable UUID per player and workout', async () => {
    const id = await activityIdFor('user-1', 'workout-1');
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(await activityIdFor('user-1', 'workout-1')).toBe(id);
    expect(await activityIdFor('user-2', 'workout-1')).not.toBe(id);
  });
});
