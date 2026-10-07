import { describe, expect, it } from 'vitest';
import { planNudges } from '@/services/nudges';
import { getRaidSchedule } from '@/data/raids';

const NOW = new Date('2026-10-07T12:00:00');

describe('planNudges', () => {
  it('nags in the evening only if there is no workout today', () => {
    const none = planNudges({ now: NOW, workoutDays: new Set(), streak: 4, season: null });
    expect(none.find((n) => n.id === 101)?.title).toBe('Your 4-day streak is on the line');
    expect(none.find((n) => n.id === 101)?.at.getHours()).toBe(19);

    const done = planNudges({ now: NOW, workoutDays: new Set(['2026-10-07']), streak: 4, season: null });
    expect(done.find((n) => n.id === 101)).toBeUndefined();
  });

  it('skips the evening nudge once the evening has passed', () => {
    const late = planNudges({ now: new Date('2026-10-07T21:00:00'), workoutDays: new Set(), streak: 0, season: null });
    expect(late.find((n) => n.id === 101)).toBeUndefined();
  });

  it('always lines up tomorrow morning’s quests', () => {
    const q = planNudges({ now: NOW, workoutDays: new Set(), streak: 0, season: null }).find((n) => n.id === 102)!;
    expect(q.at.getDate()).toBe(8);
    expect(q.at.getHours()).toBe(8);
  });

  it('warns when the next raid starts', () => {
    const season = { startDate: new Date('2026-10-01T00:00:00'), endDate: new Date('2027-03-30T00:00:00') };
    const next = getRaidSchedule(season.startDate, season.endDate).find((r) => r.start > NOW)!;
    const raid = planNudges({ now: NOW, workoutDays: new Set(), streak: 0, season }).find((n) => n.id === 103)!;
    expect(raid.at.getTime()).toBe(next.start.getTime());
  });
});
