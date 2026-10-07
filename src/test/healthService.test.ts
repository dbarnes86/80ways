import { describe, expect, it, vi } from 'vitest';

// A stand-in for Capacitor's plugin proxy: every property, `then` included, is a native method.
const calls: string[] = [];
const fakeHealth = new Proxy(
  {},
  {
    get: (_, prop: string) => (..._args: unknown[]) => {
      calls.push(prop);
      if (prop === 'isAvailable') return Promise.resolve({ available: true });
      if (prop === 'requestAuthorization') return Promise.resolve({ readAuthorized: ['workouts'], readDenied: [] });
      if (prop === 'queryWorkouts')
        return Promise.resolve({
          workouts: [{ workoutType: 'running', duration: 1800, totalEnergyBurned: 300, startDate: new Date().toISOString(), platformId: 'w-1' }],
        });
      return new Promise(() => {}); // what an unknown method does: never settles
    },
  },
);

vi.mock('@capgo/capacitor-health', () => ({ Health: fakeHealth }));
vi.mock('@capacitor/core', async (orig) => {
  const real = await orig<typeof import('@capacitor/core')>();
  return { ...real, Capacitor: { ...real.Capacitor, getPlatform: () => 'ios', isNativePlatform: () => false } };
});

describe('connectHealth', () => {
  it('asks for workouts, imports them and never treats the plugin as a promise', async () => {
    const { connectHealth, isHealthConnected } = await import('@/services/healthService');
    const result = await connectHealth('user-1');
    expect(calls).not.toContain('then');
    expect(calls).toEqual(['isAvailable', 'requestAuthorization', 'queryWorkouts']);
    expect(result.imported).toBe(1);
    expect(result.activities).toEqual(['Running']);
    expect(isHealthConnected('user-1')).toBe(true);
  });
});
