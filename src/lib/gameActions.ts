/**
 * Player actions. Each one updates the local stores (so the UI reacts
 * instantly), writes to Supabase best-effort, and returns what happened so
 * the UI can celebrate it.
 */
import { supabase } from '@/lib/supabase';
import {
  BOOSTERS,
  CREDITS_JOURNEY_COMPLETE,
  CREDITS_PER_ACTIVITY,
  CREDITS_PER_LEG_BASE,
  CREDITS_PER_LEG_STEP,
  CREDITS_RAID_SUCCESS,
  CREDITS_STARTER_EVENT,
  DAILY_MISSION,
  DECAY_INHIBITOR_HOURS,
  ENERGY_TYPES,
  XP_PER_ENERGY_DEPLOYED,
  XP_PER_LEG_COMPLETED,
  type BoosterId,
  type EnergyType,
  type Intensity,
} from '@/data/gameConstants';
import { JOURNEY_LEGS } from '@/data/journeyLegs';
import { RAID_XP_FIRST_CONTRIBUTION, type ScheduledRaid } from '@/data/raids';
import {
  activityXP,
  calculateActivityEnergy,
  legCreditReward,
  planDeployment,
  toDayKey,
  type DeploymentPlan,
} from '@/lib/gameEngine';
import { activityToRow, getActiveUserId, schedulePush } from '@/lib/gameSync';
import { useActivityStore, type Activity } from '@/stores/activityStore';
import { useEnergyStore } from '@/stores/energyStore';
import { useProgressionStore } from '@/stores/progressionStore';
import { useRaidStore } from '@/stores/raidStore';
import { useSeasonStore } from '@/stores/seasonStore';
import { useUserStore } from '@/stores/userStore';

export interface Rewards {
  xp: number;
  credits: number;
  levelUp?: { level: number; name: string };
}

const withLevelTracking = <T>(fn: () => T): [T, Rewards['levelUp']] => {
  const before = useProgressionStore.getState().level;
  const out = fn();
  const after = useProgressionStore.getState();
  return [out, after.level > before ? { level: after.level, name: after.levelName } : undefined];
};

// ─── Log an activity ────────────────────────────────────────────
export interface LogActivityInput {
  activityType: string;
  targetType: EnergyType;
  durationMin: number;
  intensity: Intensity;
  distanceKm?: number;
  notes?: string;
  performedAt: Date;
  useAmplifier: boolean;
  useMultiCharge: boolean;
}

export interface LogActivityResult extends Rewards {
  activity: Activity;
  energy: number;
  spillover: Partial<Record<EnergyType, number>>;
  starterCompleted: boolean;
  dailyMissionCompleted: boolean;
}

export function logActivity(input: LogActivityInput): LogActivityResult {
  const user = useUserStore.getState();
  const amplifier = input.useAmplifier && user.consumeBooster('energyAmplifier');
  const multiCharge = input.useMultiCharge && useUserStore.getState().consumeBooster('multiCharge');

  const calc = calculateActivityEnergy({
    durationMin: input.durationMin,
    intensity: input.intensity,
    distanceKm: input.distanceKm,
    activityType: input.activityType,
    targetType: input.targetType,
    amplifier,
    multiCharge,
  });

  const activity: Activity = {
    id: crypto.randomUUID(),
    timestamp: input.performedAt.toISOString(),
    activityType: input.activityType,
    targetEnergyType: input.targetType,
    efficiency: calc.efficiency,
    duration: input.durationMin,
    distance: input.distanceKm && input.distanceKm > 0 ? input.distanceKm : undefined,
    intensity: input.intensity,
    notes: input.notes?.trim() || undefined,
    baseEnergy: calc.baseEnergy,
    actualEnergy: calc.actualEnergy,
    boosterUsed: [amplifier && 'energyAmplifier', multiCharge && 'multiCharge'].filter(Boolean).join(',') || undefined,
  };

  const energy = useEnergyStore.getState();
  energy.chargeEnergy(input.targetType, calc.actualEnergy);
  for (const [type, amt] of Object.entries(calc.spillover)) energy.chargeEnergy(type as EnergyType, amt);
  const totalEnergy = calc.actualEnergy + Object.values(calc.spillover).reduce((s, v) => s + v, 0);

  useActivityStore.getState().addActivity(activity);
  if (activity.distance) useUserStore.getState().addDistance(activity.distance);

  let xp = activityXP(input.intensity, calc.isOptimal);
  let credits = CREDITS_PER_ACTIVITY;
  let dailyMissionCompleted = false;

  const today = toDayKey(new Date());
  if (
    input.durationMin >= DAILY_MISSION.minDuration &&
    toDayKey(input.performedAt) === today &&
    useUserStore.getState().lastDailyMission !== today
  ) {
    dailyMissionCompleted = true;
    xp += DAILY_MISSION.xpReward;
    credits += DAILY_MISSION.creditReward;
    useUserStore.getState().setLastDailyMission(today);
  }

  const [starterCompleted, levelUp] = withLevelTracking(() => {
    const progression = useProgressionStore.getState();
    progression.incrementActivity(totalEnergy);
    progression.addXP(xp);
    return useProgressionStore.getState().updateStarterProgress(totalEnergy);
  });
  if (starterCompleted) credits += CREDITS_STARTER_EVENT;
  useUserStore.getState().addCredits(credits);

  const userId = getActiveUserId();
  if (userId) {
    void supabase.from('activities').insert(activityToRow(activity, userId)).then(({ error }) => {
      if (error) console.warn('Activity saved locally only:', error.message);
    });
  }
  schedulePush();

  return {
    activity,
    energy: calc.actualEnergy,
    spillover: calc.spillover,
    xp,
    credits,
    levelUp,
    starterCompleted,
    dailyMissionCompleted,
  };
}

// ─── Deploy energy to the current leg ───────────────────────────
export interface DeployResult extends Rewards {
  plan: DeploymentPlan;
  legCompleted: boolean;
  journeyComplete: boolean;
  legIndex: number;
  newProgress: number;
}

export async function deployToLeg(selection: Partial<Record<EnergyType, number>>): Promise<DeployResult> {
  const season = useSeasonStore.getState();
  const participation = season.participation;
  if (!participation || !season.activeSeason) throw new Error('Join the expedition first.');
  if (participation.status === 'completed') throw new Error('Your journey is already complete.');

  const legIndex = participation.currentLeg;
  const leg = JOURNEY_LEGS[legIndex];
  const required = leg.requiredEnergy.amount;
  const remaining = Math.max(0, required - participation.legProgress);

  const energy = useEnergyStore.getState();
  const capped = Object.fromEntries(
    ENERGY_TYPES.map((t) => [t, Math.min(selection[t] ?? 0, energy[t].current)]),
  ) as Record<EnergyType, number>;
  const plan = planDeployment(capped, leg.requiredEnergy.type, remaining);
  if (plan.totalDeployed <= 0) throw new Error('Select some energy to deploy.');

  for (const line of plan.lines) energy.deployEnergy(line.type, line.amount);

  const newProgress = Math.min(required, participation.legProgress + plan.totalEffective);
  const legCompleted = newProgress >= required - 1e-6;

  let xp = Math.round(plan.totalDeployed * XP_PER_ENERGY_DEPLOYED);
  let credits = 0;
  let journeyComplete = false;

  if (legCompleted) {
    ({ journeyComplete } = await useSeasonStore.getState().completeLeg());
    xp += XP_PER_LEG_COMPLETED;
    credits += legCreditReward(legIndex, CREDITS_PER_LEG_BASE, CREDITS_PER_LEG_STEP);
    if (journeyComplete) {
      credits += CREDITS_JOURNEY_COMPLETE;
      useUserStore.getState().incrementJourneysCompleted();
    }
  } else {
    await useSeasonStore.getState().setLegProgress(newProgress);
  }

  const [, levelUp] = withLevelTracking(() => useProgressionStore.getState().addXP(xp));
  if (credits) useUserStore.getState().addCredits(credits);

  const userId = getActiveUserId();
  if (userId) {
    const { error } = await supabase.from('energy_deployments').insert(
      plan.lines.map((l) => ({
        user_id: userId,
        season_id: season.activeSeason!.id,
        leg_id: leg.id,
        energy_type: l.type,
        amount: l.amount,
        efficiency: l.efficiency,
        effective_amount: l.effective,
      })),
    );
    if (error) console.warn('Failed to record deployment:', error.message);
  }
  schedulePush();

  return { plan, legCompleted, journeyComplete, legIndex, newProgress, xp, credits, levelUp };
}

// ─── Raids ──────────────────────────────────────────────────────
export interface RaidContributionResult extends Rewards {
  plan: DeploymentPlan;
}

export async function contributeToRaid(
  raid: ScheduledRaid,
  seasonId: string,
  selection: Partial<Record<EnergyType, number>>,
): Promise<RaidContributionResult> {
  const userId = getActiveUserId();
  if (!userId) throw new Error('Sign in to join raids.');

  const totals = useRaidStore.getState().totals[raid.key];
  const remaining = Math.max(0, raid.goalKwh - (totals?.total ?? 0));
  if (remaining <= 0) throw new Error('This raid has already been beaten!');

  const energy = useEnergyStore.getState();
  const capped = Object.fromEntries(
    ENERGY_TYPES.map((t) => [t, Math.min(selection[t] ?? 0, energy[t].current)]),
  ) as Record<EnergyType, number>;
  const plan = planDeployment(capped, raid.type, remaining);
  if (plan.totalDeployed <= 0) throw new Error('Select some energy to contribute.');

  const { error } = await supabase.from('raid_contributions').insert(
    plan.lines.map((l) => ({
      user_id: userId,
      season_id: seasonId,
      raid_key: raid.key,
      energy_type: l.type,
      amount: l.amount,
      effective_amount: l.effective,
    })),
  );
  if (error) throw new Error(`Couldn't reach the raid HQ: ${error.message}`);

  for (const line of plan.lines) energy.deployEnergy(line.type, line.amount);

  const awardKey = `${seasonId}:${raid.key}`;
  const firstTime = !useUserStore.getState().raidXpAwarded.includes(awardKey);
  let xp = Math.round(plan.totalDeployed * XP_PER_ENERGY_DEPLOYED);
  if (firstTime) {
    xp += RAID_XP_FIRST_CONTRIBUTION;
    useUserStore.getState().markRaidXpAwarded(awardKey);
  }
  useRaidStore.getState().addLocalContribution(raid.key, plan.totalEffective, !(totals?.yourContribution));

  const [, levelUp] = withLevelTracking(() => useProgressionStore.getState().addXP(xp));
  schedulePush();
  return { plan, xp, credits: 0, levelUp };
}

export function claimRaidReward(seasonId: string, raidKey: string): Rewards | null {
  const key = `${seasonId}:${raidKey}`;
  const user = useUserStore.getState();
  if (user.raidRewardsClaimed.includes(key)) return null;
  user.markRaidRewardClaimed(key);
  user.addCredits(CREDITS_RAID_SUCCESS);
  schedulePush();
  return { xp: 0, credits: CREDITS_RAID_SUCCESS };
}

// ─── Store ──────────────────────────────────────────────────────
export function buyBooster(id: BoosterId): boolean {
  const user = useUserStore.getState();
  if (!user.spendCredits(BOOSTERS[id].price)) return false;
  useUserStore.getState().addBooster(id);
  schedulePush();
  return true;
}

export function activateDecayInhibitor(): Date | null {
  const user = useUserStore.getState();
  if (!user.consumeBooster('decayInhibitor')) return null;
  // Settle decay up to now, then freeze from now (or extend an active freeze).
  useEnergyStore.getState().applyDecay(user.effects.decayInhibitorUntil ? new Date(user.effects.decayInhibitorUntil) : null);
  const current = user.effects.decayInhibitorUntil ? new Date(user.effects.decayInhibitorUntil) : null;
  const base = current && current > new Date() ? current : new Date();
  const until = new Date(base.getTime() + DECAY_INHIBITOR_HOURS * 3_600_000);
  useUserStore.getState().setDecayInhibitorUntil(until.toISOString());
  schedulePush();
  return until;
}
