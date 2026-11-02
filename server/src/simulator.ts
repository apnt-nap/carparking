import type { Bay } from './types.js';

export type Rng = () => number;

/** Deterministic PRNG so tests and generated data are repeatable. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFrom(s: string): number {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.codePointAt(0)!, 16777619);
  return h >>> 0;
}

/** Thailand is UTC+7 all year (no daylight saving). */
function bangkokClock(d: Date) {
  const t = new Date(d.getTime() + 7 * 3600_000);
  return { day: t.getUTCDay(), hour: t.getUTCHours() + t.getUTCMinutes() / 60 };
}

/** Mall-wide occupancy by time: fuller at weekends and 11:00–20:00. */
export function baseOccupancy(d: Date): number {
  const { day, hour } = bangkokClock(d);
  const weekend = day === 0 || day === 6;
  if (hour >= 11 && hour < 20) return weekend ? 0.85 : 0.65;
  if (hour >= 9 && hour < 22) return weekend ? 0.55 : 0.4;
  return 0.08;
}

/**
 * Chance a given bay is taken. Lower floors (order 0 is closest to the mall) and bays near the lifts fill first.
 * liftNorm is 0 for the bay nearest the lift and 1 for the farthest.
 */
export function targetOccupancy(d: Date, floorOrder: number, liftNorm: number): number {
  const p = baseOccupancy(d) + 0.12 - 0.06 * floorOrder + 0.2 * (0.5 - liftNorm);
  return Math.min(0.98, Math.max(0.02, p));
}

/**
 * One simulator tick for one floor: re-rolls `fraction` of the bays against their target.
 * Mutates the bays it changes and returns them. Never changes more than round(fraction × bays).
 */
export function stepFloor(bays: Bay[], floorOrder: number, now: Date, rng: Rng, fraction = 0.03): Bay[] {
  if (bays.length === 0) return [];
  const maxLift = Math.max(...bays.map((b) => b.lift_distance_m)) || 1;
  const picks = Math.max(1, Math.round(bays.length * fraction));
  const changed = new Set<Bay>();
  for (let i = 0; i < picks; i++) {
    const bay = bays[Math.floor(rng() * bays.length)];
    const want = rng() < targetOccupancy(now, floorOrder, bay.lift_distance_m / maxLift) ? 'taken' : 'free';
    if (bay.status !== want) {
      bay.status = want;
      bay.updated_at = now.toISOString();
      changed.add(bay);
    }
  }
  return [...changed];
}
