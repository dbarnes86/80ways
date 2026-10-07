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
  /** What Fix says at full health, below two thirds, below one third, and once beaten. */
  taunts: [string, string, string, string];
}

const RAID_TEMPLATES: RaidTemplate[] = [
  {
    name: "Fix's Telegraph Blockade",
    type: 'terrestrial',
    goalKwh: 40,
    narrative: 'Fix has bribed the clerks along the line. Runners are needed to carry Fogg’s messages by hand before the warrant outpaces him.',
    taunts: [
      'Every clerk from here to Bombay is in my pocket, Mr. Fogg.',
      'Runners? You think legs can outpace the wire?',
      'Stop. Stop running. That message must not arrive!',
      'Hang it all. The line is open again.',
    ],
  },
  {
    name: 'Storm off Aden',
    type: 'nautical',
    goalKwh: 45,
    narrative: 'A gale batters the Mongolia in the Gulf of Aden. Every oar and pump is needed to keep her on schedule.',
    taunts: [
      'The sea is on my side tonight.',
      'Bail all you like. The Gulf will have you.',
      'Impossible. The pumps are holding?',
      'Even the weather has deserted me.',
    ],
  },
  {
    name: 'The Coal Bunker Heist',
    type: 'strength',
    goalKwh: 35,
    narrative: 'Someone has tipped the coal overboard at Bombay. The crew must haul fresh fuel aboard by hand.',
    taunts: [
      'No coal, no steam, no Fogg.',
      "Hauling it by hand? You'll break your backs first.",
      'Put that shovel down this instant!',
      'Bunkers full. Curse your stubbornness.',
    ],
  },
  {
    name: 'The Missing Rails at Kholby',
    type: 'transport',
    goalKwh: 40,
    narrative: 'The railway simply stops fifty miles short. Fix is delighted. Find another way across before the train to Calcutta leaves.',
    taunts: [
      'Fifty miles of nothing. Enjoy the walk.',
      "An elephant? You can't be serious.",
      "It's working. Why is it working?",
      'Through the jungle and out the other side. Unbelievable.',
    ],
  },
  {
    name: 'The Hong Kong Detour',
    type: 'terrestrial',
    goalKwh: 45,
    narrative: 'Fix has lured Passepartout into a back-street tavern. Search the docks and get him to the Carnatic before she sails.',
    taunts: [
      'Passepartout is enjoying himself. Leave him be.',
      'Searching every tavern on the waterfront? Admirable. Futile.',
      'No, not that door!',
      "He's aboard the Carnatic. I've lost him again.",
    ],
  },
  {
    name: 'Typhoon in the China Sea',
    type: 'nautical',
    goalKwh: 50,
    narrative: 'The little Tankadere is caught in a typhoon. Bail, row and hold the line until Shanghai.',
    taunts: [
      'No little schooner survives a typhoon.',
      'Still afloat? The next wave will finish it.',
      'Hold the line? Against that?',
      "Shanghai on the horizon. I don't believe it.",
    ],
  },
  {
    name: 'The Medicine Bow Bridge',
    type: 'transport',
    goalKwh: 50,
    narrative: 'The bridge is unsafe and Fix wants the train to wait. The engineer proposes full steam ahead. Give it everything.',
    taunts: [
      'Wait for the bridge to be repaired. Weeks, I should think.',
      "Full steam? You'll go straight into the river!",
      "You're actually going to try it. Madmen.",
      "Across. The bridge collapsed behind you, and you're across.",
    ],
  },
  {
    name: 'Burning the Henrietta',
    type: 'strength',
    goalKwh: 55,
    narrative: 'The coal is gone mid-Atlantic. Fogg has bought the ship, and now her timbers must be torn up to feed the boilers.',
    taunts: [
      'Mid-Atlantic and out of coal. Checkmate.',
      'Burning the cabins? The ship will be a husk!',
      'Not the masts. You need the masts!',
      'A bare hull steaming into Liverpool. You absolute lunatics.',
    ],
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

/** Boss phase from remaining health: 0 full, 1 below two thirds, 2 below one third, 3 defeated. */
export function bossPhase(total: number, goal: number): 0 | 1 | 2 | 3 {
  const hp = Math.max(0, 1 - total / goal);
  if (hp <= 0) return 3;
  if (hp <= 1 / 3) return 2;
  if (hp <= 2 / 3) return 1;
  return 0;
}

export function formatTimeLeft(target: Date, now: Date = new Date()): string {
  const ms = Math.max(0, target.getTime() - now.getTime());
  const hours = Math.floor(ms / 3_600_000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  return `${hours}h ${mins}m`;
}
