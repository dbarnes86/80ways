import { describe, expect, it } from 'vitest';
import {
  allClaimed,
  claimableCount,
  currentStory,
  dailyQuests,
  pruneClaimed,
  storyQuests,
  weekKey,
  weeklyQuests,
  type QuestActivity,
  type QuestContext,
} from '@/game/quests';

const NOW = new Date('2026-10-07T15:00:00'); // a Wednesday

const act = (over: Partial<QuestActivity> = {}): QuestActivity => ({
  timestamp: '2026-10-07T07:30:00',
  duration: 30,
  actualEnergy: 0.6,
  targetEnergyType: 'terrestrial',
  ...over,
});

const ctx = (over: Partial<QuestContext> = {}): QuestContext => ({
  now: NOW,
  activities: [],
  deployLog: {},
  level: 1,
  starterEventCompleted: false,
  joinedSeason: false,
  currentLeg: 0,
  journeyComplete: false,
  member: false,
  raidsJoined: 0,
  claimed: new Set(),
  ...over,
});

describe('daily quests', () => {
  it('deals three, the same three all day', () => {
    const a = dailyQuests(ctx());
    const b = dailyQuests(ctx({ now: new Date('2026-10-07T23:00:00') }));
    expect(a).toHaveLength(3);
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id));
    expect(a.every((q) => q.id.startsWith('d:2026-10-07:'))).toBe(true);
  });

  it('a 30-minute workout completes the first quest', () => {
    const [first] = dailyQuests(ctx({ activities: [act()] }));
    expect(first.complete).toBe(true);
  });

  it("only counts today's workouts", () => {
    const [first] = dailyQuests(ctx({ activities: [act({ timestamp: '2026-10-06T07:30:00' })] }));
    expect(first.complete).toBe(false);
  });

  it('the charge quest counts only its reserve', () => {
    const charge = dailyQuests(ctx())[1];
    const type = charge.energy!;
    const other = type === 'strength' ? 'nautical' : 'strength';
    expect(dailyQuests(ctx({ activities: [act({ targetEnergyType: other })] }))[1].progress).toBe(0);
    expect(dailyQuests(ctx({ activities: [act({ targetEnergyType: type })] }))[1].complete).toBe(true);
  });

  it('marks claimed quests', () => {
    const id = dailyQuests(ctx())[0].id;
    expect(dailyQuests(ctx({ claimed: new Set([id]) }))[0].claimed).toBe(true);
  });
});

describe('weekly quests', () => {
  it('unlock at level 2', () => {
    expect(weeklyQuests(ctx())).toEqual([]);
    expect(weeklyQuests(ctx({ level: 2 }))).toHaveLength(3);
  });

  it('weeks start on Monday', () => {
    expect(weekKey(NOW)).toBe('2026-10-05');
    expect(weekKey(new Date('2026-10-11T22:00:00'))).toBe('2026-10-05');
    expect(weekKey(new Date('2026-10-12T01:00:00'))).toBe('2026-10-12');
  });

  it('count workouts and minutes across the week', () => {
    const acts = [act({ timestamp: '2026-10-05T08:00:00' }), act({ timestamp: '2026-10-06T08:00:00' }), act(), act({ timestamp: '2026-10-04T08:00:00' })];
    const [workouts, minutes] = weeklyQuests(ctx({ level: 2, activities: acts }));
    expect(workouts.progress).toBe(3);
    expect(workouts.complete).toBe(true);
    expect(minutes.progress).toBe(90);
  });

  it('count energy spent on the expedition once boarded', () => {
    const q = weeklyQuests(ctx({ level: 3, joinedSeason: true, deployLog: { '2026-10-05': 1.5, '2026-10-07': 1.5, '2026-10-01': 9 } }))[2];
    expect(q.progress).toBe(3);
    expect(q.complete).toBe(true);
  });
});

describe('story', () => {
  it('starts at "Fuel the engine" and moves on as chapters are claimed', () => {
    expect(currentStory(ctx())?.title).toBe('Fuel the engine');
    expect(currentStory(ctx({ claimed: new Set(['s:fuel']) }))?.title).toBe('Lift Off');
  });

  it('a leg counts once the player has moved past it', () => {
    const paris = storyQuests(ctx({ joinedSeason: true, currentLeg: 2 })).find((q) => q.title === 'Reach Paris')!;
    expect(paris.complete).toBe(true);
    const suez = storyQuests(ctx({ joinedSeason: true, currentLeg: 2 })).find((q) => q.title === 'Reach Suez')!;
    expect(suez.complete).toBe(false);
  });

  it('finishing the journey completes the last chapter', () => {
    const last = storyQuests(ctx({ joinedSeason: true, currentLeg: 10, journeyComplete: true })).at(-1)!;
    expect(last.title).toBe('Reach London');
    expect(last.complete).toBe(true);
  });
});

describe('fairness', () => {
  it('boarding mid-week does not swap out a claimed weekly quest', () => {
    const before = weeklyQuests(ctx({ level: 2 }))[2];
    expect(before.id).toBe('w:2026-10-05:variety');
    const after = weeklyQuests(ctx({ level: 3, joinedSeason: true, claimed: new Set([before.id]) }))[2];
    expect(after.id).toBe(before.id);
  });

  it('the raid chapter only appears for pass holders, so free players are never stuck on it', () => {
    const titles = (member: boolean) => storyQuests(ctx({ member })).map((q) => q.title);
    expect(titles(false)).not.toContain('Face Detective Fix');
    expect(titles(true)).toContain('Face Detective Fix');
  });
});

describe('bookkeeping', () => {
  it('counts claimable quests for the badge', () => {
    expect(claimableCount(ctx({ activities: [act()] }))).toBeGreaterThanOrEqual(2); // first daily + "Fuel the engine"
  });

  it('knows when a set is finished, counting the one being claimed', () => {
    const qs = dailyQuests(ctx());
    expect(allClaimed(qs, new Set([qs[0].id, qs[1].id]), qs[2].id)).toBe(true);
    expect(allClaimed(qs, new Set([qs[0].id]), qs[2].id)).toBe(false);
  });

  it('prunes old daily and weekly ids but keeps the story', () => {
    expect(pruneClaimed(['d:2026-09-01:move', 'w:2026-09-01:workouts', 's:fuel', 'd:2026-10-06:move'], NOW)).toEqual(['s:fuel', 'd:2026-10-06:move']);
  });
});
