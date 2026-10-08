import { describe, expect, it } from 'vitest';
import { kwhPerHour, legAdvice, liftOffAdvice, minutesFor } from '@/game/coach';

const none = { nautical: 0, terrestrial: 0, transport: 0, strength: 0 };

describe('coach', () => {
  it('uses the game’s own rates: pace counts, lifting has none', () => {
    expect(kwhPerHour('terrestrial')).toBe(2);
    expect(kwhPerHour('strength')).toBe(1);
    expect(kwhPerHour('terrestrial', true)).toBe(4);
  });

  it('rounds minutes up to the next five, never short', () => {
    expect(minutesFor(1.0, 'terrestrial')).toBe(30);
    expect(minutesFor(0.1, 'terrestrial')).toBe(5);
    expect(minutesFor(1.0, 'terrestrial', { amplifier: true })).toBe(15);
  });

  it('Lift Off advice uses the player’s own discipline', () => {
    expect(liftOffAdvice(2.1, 'runner', false)?.line).toBe('A 65-minute run does it.');
    expect(liftOffAdvice(2.1, 'runner', true)?.line).toBe('A 35-minute run does it, with the Amplifier armed.');
    expect(liftOffAdvice(0, 'runner', false)).toBeNull();
  });

  it('a leg explains what the reserve is worth against it', () => {
    const a = legAdvice({ targetType: 'strength', remaining: 3, reserves: { ...none, terrestrial: 7.4 }, discipline: 'runner' });
    expect(a.situation).toBe('This leg runs on Strength. You have 7.4 Terrestrial at ½ value.');
    expect(a.shortKwh).toBe(0);
    expect(a.next).toBe('Enough for the leg. Next time a 180-minute lift would cover it at full value.');
  });

  it('sums the rest when there are several other types', () => {
    const a = legAdvice({ targetType: 'nautical', remaining: 4, reserves: { nautical: 2.1, terrestrial: 4.4, transport: 0.6, strength: 1.2 }, discipline: 'runner' });
    expect(a.situation).toBe('This leg runs on Nautical. You have 2.1 Nautical at full value, plus 6.2 kWh of other types at half to three-quarters.');
  });

  it('names the matched workout first, then the player’s own at its value', () => {
    const a = legAdvice({ targetType: 'strength', remaining: 3, reserves: { ...none, terrestrial: 2 }, discipline: 'runner' });
    expect(a.shortKwh).toBe(2);
    expect(a.next).toBe('2.0 kWh short. A 120-minute lift fills it, or a 120-minute run at ½ value.');
  });

  it('says so when the reserves match the leg', () => {
    const a = legAdvice({ targetType: 'nautical', remaining: 2, reserves: { ...none, nautical: 1 }, discipline: 'swimmer' });
    expect(a.situation).toBe("This leg runs on Nautical, and that's what you've got: 1.0 kWh at full value.");
    expect(a.next).toBe('1.0 kWh short. A 50-minute swim fills it.');
  });
});
