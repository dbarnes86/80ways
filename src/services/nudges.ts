/**
 * Reasons to come back, as local notifications on the iPhone (no server needed). Re-planned every
 * time the app opens, so they always reflect where the player is: no streak nag if you've already
 * worked out today, no raid alarm for a raid that's over.
 */
import { Capacitor } from '@capacitor/core';
import { getRaidSchedule, type ScheduledRaid } from '@/data/raids';
import { DEPARTURE_WINDOW_MINUTES, ENERGY_DECAY_RATE, ENERGY_TYPES } from '@/data/gameConstants';
import { computeStreak, toDayKey } from '@/lib/gameEngine';
import { decayByTomorrow, formatDeparture } from '@/game/voyage';
import { useActivityStore } from '@/stores/activityStore';
import { useEnergyStore } from '@/stores/energyStore';
import { selectHasJoined, useSeasonStore } from '@/stores/seasonStore';
import { useUserStore } from '@/stores/userStore';

const FLAG = 'atw80-nudges';
const IDS = { streak: 101, quests: 102, raidStart: 103, raidLast: 104, inbox: 105, departure: 106 };

export const nudgesSupported = () => Capacitor.isNativePlatform();

export function nudgesEnabled(): boolean {
  try {
    return localStorage.getItem(FLAG) === 'on';
  } catch {
    return false;
  }
}

/** Wrapped in an object: a Capacitor plugin returned bare from an async function looks like a promise. */
async function plugin() {
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  return { LocalNotifications };
}

/** Ask once. Returns whether the player said yes. */
export async function enableNudges(): Promise<boolean> {
  if (!nudgesSupported()) return false;
  const { LocalNotifications } = await plugin();
  const { display } = await LocalNotifications.requestPermissions();
  const on = display === 'granted';
  try {
    localStorage.setItem(FLAG, on ? 'on' : 'off');
  } catch {
    /* storage unavailable */
  }
  return on;
}

export interface NudgeInput {
  now: Date;
  /** Day keys with at least one workout. */
  workoutDays: Set<string>;
  streak: number;
  season: { startDate: Date; endDate: Date } | null;
  /** On the voyage: the departure time, whether today's on-time bonus is taken, and the reserves. */
  departure?: { minutes: number; doneToday: boolean; reserves: number; decay: number };
}

interface Planned {
  id: number;
  title: string;
  body: string;
  at: Date;
}

/** What to schedule, as data so it's testable. */
export function planNudges({ now, workoutDays, streak, season, departure }: NudgeInput): Planned[] {
  const out: Planned[] = [];
  const at = (days: number, h: number, m = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(h, m, 0, 0);
    return d;
  };

  // Evening nudge, only if today has no workout yet.
  const evening = at(0, 19, 30);
  if (!workoutDays.has(toDayKey(now)) && evening > now) {
    out.push({
      id: IDS.streak,
      title: streak > 0 ? `Your ${streak}-day streak is on the line` : 'Fogg is waiting',
      body: streak > 0 ? 'Any workout today keeps it alive.' : 'A short workout today gets the expedition moving.',
      at: evening,
    });
  }

  // Tomorrow morning: fresh quests.
  out.push({ id: IDS.quests, title: 'New quests are in', body: 'Three fresh quests and a chest for finishing them.', at: at(1, 8) });

  // When the departure window opens, if there's energy to spend and today's bonus is still there.
  if (departure && departure.reserves >= 0.1) {
    const at = new Date(now);
    at.setHours(0, departure.minutes - DEPARTURE_WINDOW_MINUTES, 0, 0);
    if (at <= now || departure.doneToday) at.setDate(at.getDate() + 1);
    out.push({
      id: IDS.departure,
      title: `Departure at ${formatDeparture(departure.minutes)}`,
      body:
        departure.decay >= 0.05
          ? `Your reserves lose ${departure.decay.toFixed(1)} kWh by tomorrow. Leave on time for a bonus.`
          : 'Leave on time for a bonus, and see what today’s encounter brings.',
      at,
    });
  }

  if (season) {
    const raids: ScheduledRaid[] = getRaidSchedule(season.startDate, season.endDate);
    const next = raids.find((r) => r.start > now);
    if (next) out.push({ id: IDS.raidStart, title: 'Detective Fix strikes!', body: `${next.name}. The crew needs your energy.`, at: next.start });
    const live = raids.find((r) => r.start <= now && r.end > now);
    if (live) {
      const lastCall = new Date(live.end.getTime() - 6 * 3_600_000);
      if (lastCall > now) out.push({ id: IDS.raidLast, title: 'Last chance to hit Fix', body: `${live.name} ends in 6 hours.`, at: lastCall });
    }
  }
  return out;
}

/** Replace whatever was scheduled with the current plan. */
export async function refreshNudges(input: NudgeInput) {
  if (!nudgesSupported() || !nudgesEnabled()) return;
  const { LocalNotifications } = await plugin();
  await LocalNotifications.cancel({ notifications: Object.values(IDS).map((id) => ({ id })) });
  const planned = planNudges(input);
  if (!planned.length) return;
  await LocalNotifications.schedule({
    notifications: planned.map((p) => ({ id: p.id, title: p.title, body: p.body, schedule: { at: p.at, allowWhileIdle: true } })),
  });
}

/** Re-plan from where the player is now. Safe to call any time; does nothing until enabled. */
export function replanNudges() {
  const dates = useActivityStore.getState().activities.map((a) => a.timestamp);
  const seasonState = useSeasonStore.getState();
  const season = seasonState.activeSeason;
  const user = useUserStore.getState();
  const energy = useEnergyStore.getState();
  const reserves = ENERGY_TYPES.reduce((t, k) => t + energy[k].current, 0);
  const sailing = selectHasJoined(seasonState) && seasonState.participation?.status === 'active';
  const now = new Date();
  void refreshNudges({
    now,
    workoutDays: new Set(dates.map(toDayKey)),
    streak: computeStreak(dates),
    season: season ? { startDate: season.startDate, endDate: season.endDate } : null,
    departure: sailing
      ? {
          minutes: user.departureMinutes,
          doneToday: !!user.voyageLog[toDayKey(now)]?.punctual,
          reserves,
          decay: decayByTomorrow(reserves, ENERGY_DECAY_RATE, user.effects.decayInhibitorUntil ? new Date(user.effects.decayInhibitorUntil) : null, now),
        }
      : undefined,
  }).catch((e) => console.warn('Couldn’t schedule notifications:', e));
}
