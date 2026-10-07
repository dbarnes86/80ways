/**
 * Collecting workouts from the inbox: each one becomes an activity (energy, XP, credits) with the
 * reward moments that go with it.
 */
import { logActivity, type LogActivityResult } from '@/lib/gameActions';
import { calculateActivityEnergy } from '@/lib/gameEngine';
import { useInboxStore, type InboxItem } from '@/stores/inboxStore';
import { useActivityStore } from '@/stores/activityStore';
import { announce } from './rewards';

/** Energy an inbox workout will give, for showing on its card before it's collected. */
export const previewEnergy = (item: InboxItem) =>
  calculateActivityEnergy({
    durationMin: item.durationMin,
    intensity: item.intensity,
    distanceKm: item.distanceKm,
    activityType: item.activityType,
    targetType: item.targetType,
  }).actualEnergy;

/** Turn one inbox workout into an activity. Floats its numbers; big moments are announced by the caller. */
export function collectItem(item: InboxItem, boosters: { amplifier?: boolean; multiCharge?: boolean } = {}): LogActivityResult | null {
  // Already an activity (synced from another device, or a re-import): drop it, pay nothing.
  if (useActivityStore.getState().activities.some((a) => a.id === item.id)) {
    useInboxStore.getState().remove(item.id);
    return null;
  }
  const r = logActivity({
    id: item.id,
    activityType: item.activityType,
    targetType: item.targetType,
    durationMin: item.durationMin,
    intensity: item.intensity,
    distanceKm: item.distanceKm,
    notes: `From ${item.sourceName}`,
    performedAt: new Date(item.performedAt),
    useAmplifier: !!boosters.amplifier,
    useMultiCharge: !!boosters.multiCharge,
  });
  useInboxStore.getState().remove(item.id);
  announce({ energy: r.energy });
  return r;
}

/** After a batch: one XP and coin total, then the milestones, biggest last. */
export function announceMilestones(results: LogActivityResult[]) {
  const levelUp = results.reduce<LogActivityResult['levelUp']>((acc, r) => r.levelUp ?? acc, undefined);
  announce({
    xp: results.reduce((t, r) => t + r.xp, 0),
    credits: results.reduce((t, r) => t + r.credits, 0),
    starterCompleted: results.some((r) => r.starterCompleted),
    levelUp,
  });
}
