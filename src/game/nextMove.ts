/**
 * The one thing to do next. Home leads with it, so the player always knows where they are in the
 * game and has exactly one button to press. Pure, so the order is testable.
 */
import { ENERGY_THEME } from '@/data/energyTheme';
import { liftOffAdvice } from './coach';
import type { Discipline } from '@/stores/userStore';
import type { EnergyType } from '@/data/gameConstants';
import { chargeHint, type Quest } from './quests';

export type NextAction = 'claim' | 'log' | 'deploy' | 'board' | 'pass' | 'store' | 'raid' | 'quests';

export interface NextMove {
  id: string;
  kicker: string;
  title: string;
  body: string;
  action: NextAction;
  cta: string;
  quest?: Quest;
}

export interface NextMoveInput {
  claimable?: Quest;
  starterDone: boolean;
  starterProgress: number;
  starterRequired: number;
  level: number;
  unlockLevel: number;
  seasonOpen: boolean;
  joined: boolean;
  journeyDone: boolean;
  needsPass: boolean;
  passCity: string;
  leg?: { to: string; type: EnergyType; remaining: number };
  energy: number;
  raidActive: boolean;
  healthOn: boolean;
  credits: number;
  boosters: number;
  cheapestBooster: number;
  /** Unlocked yet (see unlocks.ts). */
  storeOpen: boolean;
  raidsOpen: boolean;
  discipline?: Discipline | null;
  /** An Amplifier is armed for the next workout. */
  armed?: boolean;
}

export function nextMove(s: NextMoveInput): NextMove {
  if (s.claimable) {
    return { id: 'claim', kicker: 'Reward waiting', title: s.claimable.title, body: 'Quest complete. Claim it.', action: 'claim', cta: 'Claim', quest: s.claimable };
  }

  if (s.raidsOpen && s.raidActive && s.joined && s.energy >= 0.1) {
    return { id: 'raid', kicker: 'Raid', title: 'Fix attacks!', body: 'The crew needs your energy. Hit him.', action: 'raid', cta: 'Join the raid' };
  }

  if (!s.starterDone) {
    const left = Math.max(0, s.starterRequired - s.starterProgress);
    return {
      id: 'liftoff',
      kicker: 'Lift Off',
      title: `${left.toFixed(1)} kWh to Lift Off`,
      body: `${liftOffAdvice(left, s.discipline ?? null, !!s.armed)?.line ?? 'Any workout counts.'} ${s.healthOn ? 'It lands here when you finish.' : 'Log it when you’re done.'}`,
      action: 'log',
      cta: s.healthOn ? 'Log one by hand' : 'Log a workout',
    };
  }

  if (s.level < s.unlockLevel) {
    return { id: 'level', kicker: `Level ${s.unlockLevel} to board`, title: 'Earn XP to board', body: 'Quests and workouts give XP.', action: 'quests', cta: 'See quests' };
  }

  if (!s.joined && s.seasonOpen) {
    return { id: 'board', kicker: 'Lift Off complete', title: 'Board the ship', body: 'The voyage starts now. Your first legs are free.', action: 'board', cta: 'Board the ship' };
  }

  if (s.joined && !s.journeyDone && s.needsPass) {
    return {
      id: 'pass',
      kicker: `${s.passCity} reached`,
      title: 'Keep sailing with the Season Pass',
      body: 'The rest of the voyage, raids and the leaderboard.',
      action: 'pass',
      cta: 'Get the Season Pass',
    };
  }

  if (s.joined && !s.journeyDone && s.leg) {
    const label = ENERGY_THEME[s.leg.type].label;
    if (s.energy >= 0.1) {
      return {
        id: 'deploy',
        kicker: `Next stop: ${s.leg.to}`,
        title: 'Stoke the boiler',
        body: `${s.leg.remaining.toFixed(1)} kWh to go. ${label} energy goes furthest.`,
        action: 'deploy',
        cta: 'Stoke the boiler',
      };
    }
    return {
      id: 'charge',
      kicker: `Next stop: ${s.leg.to}`,
      title: `Charge up with ${label}`,
      body: `${chargeHint(s.leg.type)} powers this leg.`,
      action: 'log',
      cta: s.healthOn ? 'Log one by hand' : 'Log a workout',
    };
  }

  if (s.storeOpen && s.boosters === 0 && s.credits >= s.cheapestBooster) {
    return { id: 'store', kicker: `${s.credits} coins`, title: 'Spend your coins', body: 'Boosters double a workout or stop your reserves fading.', action: 'store', cta: 'Open the Store' };
  }

  return { id: 'rest', kicker: 'All caught up', title: 'Go train', body: 'Your next workout will be waiting here.', action: 'log', cta: s.healthOn ? 'Log one by hand' : 'Log a workout' };
}
