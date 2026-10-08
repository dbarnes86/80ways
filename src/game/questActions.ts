/**
 * Claiming quests and opening chests. Each claim pays out through the reward bus, so it gets the
 * same celebration as everything else.
 */
import { useEffect, useMemo, useState } from 'react';
import { toDayKey } from '@/lib/gameEngine';
import { useMembershipStore } from '@/stores/membershipStore';
import type { BoosterId } from '@/data/gameConstants';
import { schedulePush } from '@/lib/gameSync';
import { useActivityStore } from '@/stores/activityStore';
import { useProgressionStore } from '@/stores/progressionStore';
import { selectHasJoined, useSeasonStore } from '@/stores/seasonStore';
import { useUserStore } from '@/stores/userStore';
import {
  allClaimed,
  claimableCount,
  currentStory,
  dailyChestId,
  dailyQuests,
  pruneClaimed,
  weeklyChestId,
  weeklyQuests,
  type Quest,
  type QuestContext,
} from './quests';
import { announce, celebrate, type ChestTier } from './rewards';

export function questContext(now = new Date()): QuestContext {
  const p = useProgressionStore.getState();
  const u = useUserStore.getState();
  const season = useSeasonStore.getState();
  const joined = selectHasJoined(season);
  return {
    now,
    activities: useActivityStore.getState().activities,
    deployLog: u.deployLog,
    level: p.level,
    starterEventCompleted: p.starterEventCompleted,
    joinedSeason: joined,
    currentLeg: joined ? season.participation!.currentLeg : 0,
    journeyComplete: joined && season.participation!.status === 'completed',
    member: useMembershipStore.getState().membership?.tier === 'member',
    raidsJoined: u.raidXpAwarded.length,
    claimed: new Set(u.questsClaimed),
  };
}

/** Today's date key, refreshed each minute and on returning to the app, so quests roll over at midnight. */
function useDayKey(): string {
  const [day, setDay] = useState(() => toDayKey(new Date()));
  useEffect(() => {
    const check = () => setDay(toDayKey(new Date()));
    const timer = setInterval(check, 60_000);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);
  return day;
}

/** Re-renders when anything a quest depends on changes. */
export function useQuestContext(): QuestContext {
  const activities = useActivityStore((s) => s.activities);
  const level = useProgressionStore((s) => s.level);
  const starter = useProgressionStore((s) => s.starterEventCompleted);
  const claimed = useUserStore((s) => s.questsClaimed);
  const deployLog = useUserStore((s) => s.deployLog);
  const raids = useUserStore((s) => s.raidXpAwarded);
  const participation = useSeasonStore((s) => s.participation);
  const season = useSeasonStore((s) => s.activeSeason);
  const membership = useMembershipStore((s) => s.membership);
  const day = useDayKey();
  return useMemo(() => questContext(), [activities, level, starter, claimed, deployLog, raids, participation, season, membership, day]);
}

export function useQuests() {
  const ctx = useQuestContext();
  return useMemo(
    () => ({
      daily: dailyQuests(ctx),
      weekly: weeklyQuests(ctx),
      story: currentStory(ctx),
      claimable: claimableCount(ctx),
      dailyChestClaimed: ctx.claimed.has(dailyChestId(ctx.now)),
      weeklyChestClaimed: ctx.claimed.has(weeklyChestId(ctx.now)),
    }),
    [ctx],
  );
}

const CHESTS: Record<ChestTier, { credits: [number, number]; xp: number; boosterChance: number; boosters: BoosterId[] }> = {
  bronze: { credits: [40, 80], xp: 20, boosterChance: 0.25, boosters: ['energyAmplifier'] },
  silver: { credits: [100, 160], xp: 60, boosterChance: 0.75, boosters: ['energyAmplifier', 'decayInhibitor'] },
  gold: { credits: [220, 320], xp: 150, boosterChance: 1, boosters: ['multiCharge', 'decayInhibitor'] },
};

/** Roll a chest and queue its opening. The contents are paid when it's rolled, not when tapped. */
export function grantChest(tier: ChestTier, title: string, rand: () => number = Math.random) {
  const c = CHESTS[tier];
  const credits = Math.round(c.credits[0] + rand() * (c.credits[1] - c.credits[0]));
  const booster = rand() < c.boosterChance ? c.boosters[Math.floor(rand() * c.boosters.length)] : undefined;

  const before = useProgressionStore.getState().level;
  useProgressionStore.getState().addXP(c.xp);
  useUserStore.getState().addCredits(credits);
  if (booster) useUserStore.getState().addBooster(booster);
  const after = useProgressionStore.getState();

  celebrate({ kind: 'chest', tier, title, credits, xp: c.xp, booster });
  if (after.level > before) announce({ levelUp: { level: after.level, name: after.levelName } }, { floats: false });
}

export function claimQuest(quest: Quest) {
  const ctx = questContext();
  if (!quest.complete || ctx.claimed.has(quest.id)) return;

  const ids = [quest.id];
  const before = useProgressionStore.getState().level;
  if (quest.xp) useProgressionStore.getState().addXP(quest.xp);
  if (quest.credits) useUserStore.getState().addCredits(quest.credits);
  const after = useProgressionStore.getState();

  if (quest.xp || quest.credits) celebrate({ kind: 'quest', title: quest.title, xp: quest.xp, credits: quest.credits });
  if (after.level > before) announce({ levelUp: { level: after.level, name: after.levelName } }, { floats: false });
  if (quest.chest) grantChest(quest.chest, quest.title);

  // Finishing the set opens a bonus chest.
  if (quest.period === 'daily' && allClaimed(dailyQuests(ctx), ctx.claimed, quest.id) && !ctx.claimed.has(dailyChestId(ctx.now))) {
    ids.push(dailyChestId(ctx.now));
    grantChest(new Date().getDay() === 0 ? 'silver' : 'bronze', 'Daily set complete');
  }
  if (quest.period === 'weekly' && allClaimed(weeklyQuests(ctx), ctx.claimed, quest.id) && !ctx.claimed.has(weeklyChestId(ctx.now))) {
    ids.push(weeklyChestId(ctx.now));
    grantChest('gold', 'Telegrams complete');
  }

  const user = useUserStore.getState();
  user.markQuestsClaimed(ids);
  useUserStore.setState({ questsClaimed: pruneClaimed(useUserStore.getState().questsClaimed, ctx.now) });
  schedulePush();
}
