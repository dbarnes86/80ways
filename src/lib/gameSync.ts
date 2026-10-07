/**
 * Local-first persistence. The zustand stores are the source of truth for the
 * UI; Supabase holds the cross-device copy. Every write here is best-effort so
 * the game keeps working if the network (or a not-yet-applied migration) fails.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { ENERGY_TYPES, type EnergyType, type Intensity } from '@/data/gameConstants';
import { useActivityStore, type Activity } from '@/stores/activityStore';
import { useEnergyStore } from '@/stores/energyStore';
import { useProgressionStore } from '@/stores/progressionStore';
import { useRaidStore } from '@/stores/raidStore';
import { useSeasonStore } from '@/stores/seasonStore';
import { useUserStore, type UserGameData } from '@/stores/userStore';

const OWNER_KEY = 'atw80-local-owner';
/** Set while this device holds changes the server hasn't confirmed. */
const DIRTY_KEY = 'atw80-unsaved-changes';
let activeUserId: string | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;

export const getActiveUserId = () => activeUserId;

const storage = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* storage unavailable */
    }
  },
  remove: (k: string) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* storage unavailable */
    }
  },
};

/** Wipe every local store. Used on sign-out and when a different account signs in on this device. */
export function resetLocalGame() {
  useActivityStore.getState().reset();
  useEnergyStore.getState().reset();
  useProgressionStore.getState().reset();
  useSeasonStore.getState().reset();
  useUserStore.getState().reset();
  useRaidStore.getState().reset();
}

/** Make sure local state belongs to this user before we read or write it. */
export function claimLocalState(userId: string) {
  activeUserId = userId;
  const owner = storage.get(OWNER_KEY);
  if (owner && owner !== userId) {
    resetLocalGame();
    storage.remove(DIRTY_KEY);
  }
  storage.set(OWNER_KEY, userId);
}

export function releaseLocalState() {
  activeUserId = null;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = null;
}

interface GameState {
  energy: Record<EnergyType, { current: number; lastUpdated: string }>;
  user: UserGameData;
}

const buildGameState = (): GameState => {
  const energy = useEnergyStore.getState();
  const u = useUserStore.getState();
  return {
    energy: Object.fromEntries(
      ENERGY_TYPES.map((t) => [t, { current: energy[t].current, lastUpdated: new Date(energy[t].lastUpdated).toISOString() }]),
    ) as GameState['energy'],
    user: {
      inventory: u.inventory,
      effects: u.effects,
      stats: u.stats,
      lastDailyMission: u.lastDailyMission,
      raidXpAwarded: u.raidXpAwarded,
      raidRewardsClaimed: u.raidRewardsClaimed,
      settings: u.settings,
    },
  };
};

const applyGameState = (raw: Json | undefined) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return;
  const state = raw as unknown as Partial<GameState>;
  if (state.energy) useEnergyStore.getState().setReserves(state.energy);
  if (state.user) useUserStore.getState().hydrate(state.user);
};

const rowToActivity = (r: {
  id: string; performed_at: string; activity_type: string; target_energy_type: string; efficiency: number;
  duration_min: number; distance_km: number | null; intensity: string; notes: string | null;
  base_energy: number; actual_energy: number; booster_used: string | null;
}): Activity => ({
  id: r.id,
  timestamp: r.performed_at,
  activityType: r.activity_type,
  targetEnergyType: r.target_energy_type as EnergyType,
  efficiency: Number(r.efficiency),
  duration: r.duration_min,
  distance: r.distance_km != null ? Number(r.distance_km) : undefined,
  intensity: r.intensity as Intensity,
  notes: r.notes ?? undefined,
  baseEnergy: Number(r.base_energy),
  actualEnergy: Number(r.actual_energy),
  boosterUsed: r.booster_used ?? undefined,
});

export const activityToRow = (a: Activity, userId: string) => ({
  id: a.id,
  user_id: userId,
  activity_type: a.activityType,
  target_energy_type: a.targetEnergyType,
  intensity: a.intensity,
  duration_min: a.duration,
  distance_km: a.distance ?? null,
  base_energy: a.baseEnergy,
  actual_energy: a.actualEnergy,
  efficiency: a.efficiency,
  booster_used: a.boosterUsed ?? null,
  notes: a.notes || null,
  performed_at: a.timestamp,
});

/** Load the player's saved game from Supabase into the local stores. */
export async function pullGameState(userId: string) {
  const { data, error } = await supabase
    .from('player_progression')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to load progression:', error);
  } else if (data) {
    // Server wins, unless this device holds changes the server never received.
    if (!storage.get(DIRTY_KEY)) {
      useProgressionStore.getState().hydrate({
        xp: data.xp,
        starterEventCompleted: data.starter_event_completed,
        starterEventProgress: Number(data.starter_event_progress),
        totalActivities: data.total_activities,
        totalEnergyGenerated: Number(data.total_energy_generated),
      });
      applyGameState(data.game_state);
    } else {
      await pushGameState(userId);
    }
  } else {
    await pushGameState(userId);
  }

  const acts = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .order('performed_at', { ascending: false })
    .limit(1000);

  if (acts.error) {
    console.warn('Activity history unavailable on server:', acts.error.message);
    return;
  }

  const serverIds = new Set(acts.data.map((r) => r.id));
  useActivityStore.getState().mergeActivities(acts.data.map(rowToActivity));

  // Upload anything logged on this device before the server could take it.
  const missing = useActivityStore.getState().activities.filter((a) => !serverIds.has(a.id));
  if (missing.length > 0) {
    const { error: upErr } = await supabase
      .from('activities')
      .upsert(missing.map((a) => activityToRow(a, userId)), { onConflict: 'id', ignoreDuplicates: true });
    if (upErr) console.warn('Failed to backfill activities:', upErr.message);
  }
}

/** Save progression + game state. Core columns and game_state go separately so one can't block the other. */
export async function pushGameState(userId: string) {
  const p = useProgressionStore.getState();
  const { error } = await supabase.from('player_progression').upsert(
    {
      user_id: userId,
      xp: p.xp,
      level: p.level,
      starter_event_completed: p.starterEventCompleted,
      starter_event_progress: p.starterEventProgress,
      total_energy_generated: p.totalEnergyGenerated,
      total_activities: p.totalActivities,
    },
    { onConflict: 'user_id' },
  );
  if (error) {
    console.error('Failed to save progression:', error);
    return;
  }

  const gs = await supabase
    .from('player_progression')
    .update({ game_state: buildGameState() as unknown as Json })
    .eq('user_id', userId);
  if (gs.error) console.warn('Failed to save game state:', gs.error.message);

  // Only clear if nothing new was scheduled while we were saving.
  if (!pushTimer) storage.remove(DIRTY_KEY);
}

export function schedulePush() {
  const userId = activeUserId;
  if (!userId) return;
  storage.set(DIRTY_KEY, new Date().toISOString());
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void pushGameState(userId);
  }, 800);
}

/** Flush any pending save immediately (e.g. before sign-out). */
export async function flushPush() {
  const userId = activeUserId;
  if (!pushTimer || !userId) return;
  clearTimeout(pushTimer);
  pushTimer = null;
  await pushGameState(userId);
}

if (typeof document !== 'undefined') {
  // Save before the tab goes to the background (mobile app switch, tab close).
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flushPush();
  });
}
