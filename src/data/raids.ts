/**
 * Community raids: Detective Fix sabotages the expedition and every
 * player in the season pools energy to push back.
 *
 * Raids are scheduled deterministically from the season start date, so
 * every client agrees on the calendar without an admin tool. Contributions
 * are stored in `raid_contributions` and totalled server-side.
 */
import type { EnergyType } from './gameConstants';

export const RAID_FIRST_START_DAY = 5;
export const RAID_INTERVAL_DAYS = 14;
export const RAID_DURATION_HOURS = 72;
export const RAID_XP_FIRST_CONTRIBUTION = 100;

interface RaidTemplate {
  name: string;
  type: EnergyType;
  goalKwh: number;
  narrative: string;
}

const RAID_TEMPLATES: RaidTemplate[] = [
  {
    name: "Fix's Telegraph Blockade",
    type: 'terrestrial',
    goalKwh: 40,
    narrative: 'Fix has bribed the clerks along the line. Runners are needed to carry Fogg’s messages by hand before the warrant outpaces him.',
  },
  {
    name: 'Storm off Aden',
    type: 'nautical',
    goalKwh: 45,
    narrative: 'A gale batters the Mongolia in the Gulf of Aden. Every oar and pump is needed to keep her on schedule.',
  },
  {
    name: 'The Coal Bunker Heist',
    type: 'strength',
    goalKwh: 35,
    narrative: 'Someone has tipped the coal overboard at Bombay. The crew must haul fresh fuel aboard by hand.',
  },
  {
    name: 'The Missing Rails at Kholby',
    type: 'transport',
    goalKwh: 40,
    narrative: 'The railway simply stops fifty miles short. Fix is delighted. Find another way across before the train to Calcutta leaves.',
  },
  {
    name: 'The Hong Kong Detour',
    type: 'terrestrial',
    goalKwh: 45,
    narrative: 'Fix has lured Passepartout into a back-street tavern. Search the docks and get him to the Carnatic before she sails.',
  },
  {
    name: 'Typhoon in the China Sea',
    type: 'nautical',
    goalKwh: 50,
    narrative: 'The little Tankadere is caught in a typhoon. Bail, row and hold the line until Shanghai.',
  },
  {
    name: 'The Medicine Bow Bridge',
    type: 'transport',
    goalKwh: 50,
    narrative: 'The bridge is unsafe and Fix wants the train to wait. The engineer proposes full steam ahead. Give it everything.',
  },
  {
    name: 'Burning the Henrietta',
    type: 'strength',
    goalKwh: 55,
    narrative: 'The coal is gone mid-Atlantic. Fogg has bought the ship, and now her timbers must be torn up to feed the boilers.',
  },
];

export type RaidStatus = 'upcoming' | 'active' | 'ended';

export interface ScheduledRaid extends RaidTemplate {
  key: string;
  index: number;
  start: Date;
  end: Date;
}

export function getRaidSchedule(seasonStart: Date, seasonEnd: Date): ScheduledRaid[] {
  const raids: ScheduledRaid[] = [];
  const dayMs = 86_400_000;
  for (let i = 0; ; i++) {
    const start = new Date(seasonStart.getTime() + (RAID_FIRST_START_DAY + i * RAID_INTERVAL_DAYS) * dayMs);
    if (start >= seasonEnd) break;
    const end = new Date(Math.min(start.getTime() + RAID_DURATION_HOURS * 3_600_000, seasonEnd.getTime()));
    raids.push({ ...RAID_TEMPLATES[i % RAID_TEMPLATES.length], key: `raid-${i}`, index: i, start, end });
  }
  return raids;
}

export function getRaidStatus(raid: ScheduledRaid, now: Date = new Date()): RaidStatus {
  if (now < raid.start) return 'upcoming';
  if (now > raid.end) return 'ended';
  return 'active';
}

export function formatTimeLeft(target: Date, now: Date = new Date()): string {
  const ms = Math.max(0, target.getTime() - now.getTime());
  const hours = Math.floor(ms / 3_600_000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  return `${hours}h ${mins}m`;
}
