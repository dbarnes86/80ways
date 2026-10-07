/**
 * Apple Health on the iPhone app: ask once, then pull new workouts in whenever the app opens.
 * On the web every function reports "unavailable" and does nothing.
 */
import { Capacitor } from '@capacitor/core';
import { logActivity, type Rewards } from '@/lib/gameActions';
import { activityIdFor, BACKFILL_DAYS, planImport, type HealthWorkout } from '@/lib/healthImport';
import { useActivityStore } from '@/stores/activityStore';

const DAY_MS = 86_400_000;
/** Re-read a day before the last sync: Watch workouts can land in Health a little late. */
const OVERLAP_MS = DAY_MS;

interface HealthState {
  connected: boolean;
  lastSync?: string;
}

const key = (userId: string) => `atw80-health:${userId}`;

function readState(userId: string): HealthState {
  try {
    const raw = localStorage.getItem(key(userId));
    return raw ? (JSON.parse(raw) as HealthState) : { connected: false };
  } catch {
    return { connected: false };
  }
}

function writeState(userId: string, state: HealthState) {
  try {
    localStorage.setItem(key(userId), JSON.stringify(state));
  } catch {
    // Private mode or full storage: the next open just re-reads the overlap window.
  }
}

export const isHealthPlatform = () => Capacitor.getPlatform() === 'ios';

export const isHealthConnected = (userId: string) => isHealthPlatform() && readState(userId).connected;

export interface HealthSyncResult extends Rewards {
  imported: number;
  energy: number;
  starterCompleted: boolean;
  dailyMissionCompleted: boolean;
  /** Names of the workouts brought in, newest last, for the summary line. */
  activities: string[];
}

const EMPTY: HealthSyncResult = { imported: 0, energy: 0, xp: 0, credits: 0, starterCompleted: false, dailyMissionCompleted: false, activities: [] };

async function plugin() {
  const { Health } = await import('@capgo/capacitor-health');
  return Health;
}

/**
 * Show the Health permission sheet, then import the last week. HealthKit never says whether
 * read access was refused (it just returns nothing), so "connected" means "we asked".
 */
export async function connectHealth(userId: string): Promise<HealthSyncResult> {
  if (!isHealthPlatform()) return EMPTY;
  const Health = await plugin();
  const { available } = await Health.isAvailable();
  if (!available) throw new Error('Apple Health isn’t available on this device.');
  await Health.requestAuthorization({ read: ['workouts'] });
  writeState(userId, { connected: true });
  return syncHealth(userId);
}

let running: Promise<HealthSyncResult> | null = null;

/** Import any workouts since the last sync. Safe to call often; overlapping calls share one run. */
export function syncHealth(userId: string): Promise<HealthSyncResult> {
  if (!isHealthPlatform() || !readState(userId).connected) return Promise.resolve(EMPTY);
  running ??= runSync(userId).finally(() => {
    running = null;
  });
  return running;
}

async function runSync(userId: string): Promise<HealthSyncResult> {
  const Health = await plugin();
  const state = readState(userId);
  const now = new Date();
  const since = state.lastSync
    ? new Date(new Date(state.lastSync).getTime() - OVERLAP_MS)
    : new Date(now.getTime() - BACKFILL_DAYS * DAY_MS);

  const { workouts } = await Health.queryWorkouts({ startDate: since.toISOString(), endDate: now.toISOString(), limit: 200, ascending: true });

  const known = new Set(useActivityStore.getState().activities.map((a) => a.id));
  const withIds = await Promise.all(
    planImport(workouts as HealthWorkout[], new Set()).map(async (plan) => ({ plan, id: await activityIdFor(userId, plan.externalId) })),
  );

  const result: HealthSyncResult = { ...EMPTY, activities: [] };
  for (const { plan, id } of withIds) {
    if (known.has(id)) continue;
    const r = logActivity({
      id,
      activityType: plan.activityType,
      targetType: plan.targetType,
      durationMin: plan.durationMin,
      intensity: plan.intensity,
      distanceKm: plan.distanceKm,
      notes: `From ${plan.sourceName}`,
      performedAt: plan.performedAt,
      useAmplifier: false,
      useMultiCharge: false,
    });
    result.imported += 1;
    result.energy += r.energy;
    result.xp += r.xp;
    result.credits += r.credits;
    result.starterCompleted ||= r.starterCompleted;
    result.dailyMissionCompleted ||= r.dailyMissionCompleted;
    if (r.levelUp) result.levelUp = r.levelUp;
    result.activities.push(plan.activityType);
  }

  writeState(userId, { connected: true, lastSync: now.toISOString() });
  return result;
}
