import type { EnergyType } from './gameConstants';

export interface AchievementContext {
  totalActivities: number;
  totalDistanceKm: number;
  totalEnergy: number;
  level: number;
  starterEventCompleted: boolean;
  joinedSeason: boolean;
  /** Index of the leg the player is on (or the last leg if finished). */
  currentLeg: number;
  journeyComplete: boolean;
  journeysCompleted: number;
  longestStreak: number;
  energyTypesUsed: Set<EnergyType>;
  raidsJoined: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earned: (c: AchievementContext) => boolean;
}

const reached = (c: AchievementContext, leg: number) => c.journeyComplete || c.currentLeg > leg;

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-steps', name: 'First Steps', description: 'Log your first activity', icon: '👟', rarity: 'common', earned: (c) => c.totalActivities >= 1 },
  { id: 'lift-off', name: 'Lift Off', description: 'Complete the starter event', icon: '🚀', rarity: 'common', earned: (c) => c.starterEventCompleted },
  { id: 'all-aboard', name: 'All Aboard', description: 'Join a season expedition', icon: '⚓', rarity: 'common', earned: (c) => c.joinedSeason },
  { id: 'suez', name: 'Gateway to the East', description: 'Reach Suez', icon: '🏜️', rarity: 'common', earned: (c) => c.joinedSeason && reached(c, 2) },
  { id: 'halfway', name: 'Halfway Round', description: 'Reach Yokohama', icon: '🗾', rarity: 'rare', earned: (c) => c.joinedSeason && reached(c, 6) },
  { id: 'new-world', name: 'New World', description: 'Cross America to New York', icon: '🚂', rarity: 'epic', earned: (c) => c.joinedSeason && reached(c, 8) },
  { id: 'wager-won', name: 'Wager Won', description: 'Complete the journey around the world', icon: '🌍', rarity: 'legendary', earned: (c) => c.journeysCompleted >= 1 },
  { id: 'century', name: 'Century Club', description: 'Cover 100 km in total', icon: '💯', rarity: 'rare', earned: (c) => c.totalDistanceKm >= 100 },
  { id: 'streak-7', name: 'Creature of Habit', description: '7-day activity streak', icon: '🔥', rarity: 'rare', earned: (c) => c.longestStreak >= 7 },
  { id: 'streak-30', name: 'Clockwork Fogg', description: '30-day activity streak', icon: '⏱️', rarity: 'legendary', earned: (c) => c.longestStreak >= 30 },
  { id: 'all-rounder', name: 'All-Rounder', description: 'Charge all four reserve types', icon: '⚡', rarity: 'rare', earned: (c) => c.energyTypesUsed.size >= 4 },
  { id: 'raider', name: 'Thorn in Fix’s Side', description: 'Contribute to a community raid', icon: '🗡️', rarity: 'rare', earned: (c) => c.raidsJoined >= 1 },
  { id: 'power-plant', name: 'Power Plant', description: 'Generate 100 kWh in total', icon: '🔋', rarity: 'epic', earned: (c) => c.totalEnergy >= 100 },
  { id: 'globe-trotter', name: 'Globe Trotter', description: 'Reach level 5', icon: '🧭', rarity: 'epic', earned: (c) => c.level >= 5 },
];
