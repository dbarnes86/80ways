/**
 * What the game shows, and when. A new player sees one screen and one thing to do; each level
 * opens up a little more, announced on the level-up screen. Keeps the start simple and gives
 * levelling a point.
 */
import { useEffect, useState } from 'react';
import { useProgressionStore } from '@/stores/progressionStore';

export type Feature = 'quests' | 'reserves' | 'map' | 'pass' | 'store' | 'raids' | 'ranks';

export const UNLOCKS: { feature: Feature; level: number; label: string; blurb: string }[] = [
  { feature: 'quests', level: 2, label: 'Quests', blurb: 'Three new quests every day' },
  { feature: 'reserves', level: 2, label: 'Energy reserves', blurb: 'See what each workout charges' },
  { feature: 'map', level: 3, label: 'The Map', blurb: 'Your route around the world' },
  { feature: 'pass', level: 3, label: 'Season Pass', blurb: 'The whole voyage' },
  { feature: 'store', level: 4, label: 'The Chandlery', blurb: 'Your coins buy kit here' },
  { feature: 'raids', level: 5, label: 'Raids', blurb: 'Take on Detective Fix with the crew' },
  { feature: 'ranks', level: 6, label: 'Ranks', blurb: 'See how far ahead you are' },
];

export const unlockLevel = (f: Feature) => UNLOCKS.find((u) => u.feature === f)!.level;
export const isUnlocked = (f: Feature, level: number) => level >= unlockLevel(f);

const ANNOUNCED_KEY = 'atw80-announced-unlocks';

/** For players who were already past some unlocks before this existed: count those as announced. */
export function seedAnnouncedUnlocks(level: number) {
  try {
    if (localStorage.getItem(ANNOUNCED_KEY) !== null) return;
    localStorage.setItem(ANNOUNCED_KEY, JSON.stringify(UNLOCKS.filter((u) => u.level <= level).map((u) => u.feature)));
  } catch {
    /* storage unavailable */
  }
}

/**
 * Everything up to this level not yet announced, marked announced. A batch of workouts can jump
 * two levels at once; nothing it unlocks should appear unexplained.
 */
export function takeUnannouncedUnlocks(level: number) {
  let done: string[] = [];
  try {
    done = JSON.parse(localStorage.getItem(ANNOUNCED_KEY) ?? '[]');
  } catch {
    /* storage unavailable */
  }
  const fresh = UNLOCKS.filter((u) => u.level <= level && !done.includes(u.feature));
  try {
    localStorage.setItem(ANNOUNCED_KEY, JSON.stringify([...done, ...fresh.map((u) => u.feature)]));
  } catch {
    /* storage unavailable */
  }
  return fresh.map(({ label, blurb }) => ({ label, blurb }));
}

export function useUnlocked(f: Feature): boolean {
  return useProgressionStore((s) => isUnlocked(f, s.level));
}

const SEEN_KEY = 'atw80-seen-unlocks';

function readSeen(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}

/** Unlocked but not yet visited: the tab wears a NEW badge until you open it. */
export function useIsNew(f: Feature): [boolean, () => void] {
  const unlocked = useUnlocked(f);
  const [seen, setSeen] = useState(readSeen);
  useEffect(() => {
    const sync = () => setSeen(readSeen());
    window.addEventListener('atw80-unlock-seen', sync);
    return () => window.removeEventListener('atw80-unlock-seen', sync);
  }, []);
  const markSeen = () => {
    if (seen.has(f)) return;
    const next = new Set(seen).add(f);
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify([...next]));
    } catch {
      /* storage unavailable */
    }
    setSeen(next);
    window.dispatchEvent(new Event('atw80-unlock-seen'));
  };
  return [unlocked && !seen.has(f), markSeen];
}
