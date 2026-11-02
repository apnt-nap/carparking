import { describe, expect, it } from 'vitest';
import { baseOccupancy, mulberry32, stepFloor, targetOccupancy } from '../src/simulator.js';
import type { Bay } from '../src/types.js';

// Bangkok is UTC+7, so 14:00 local = 07:00 UTC. 2026-11-04 is a Wednesday, 2026-11-07 a Saturday.
const wedAfternoon = new Date('2026-11-04T07:00:00Z');
const satAfternoon = new Date('2026-11-07T07:00:00Z');
const wedNight = new Date('2026-11-04T20:00:00Z'); // 03:00 local

function bays(n: number): Bay[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `b${i}`, floor_id: 'f', zone: 'A', zone_name_th: '', zone_name_en: '', x: 0, y: 0, w: 2.5, h: 5,
    rotation: 0, type: 'normal', node: 'n', lift_distance_m: i, status: 'free', updated_at: '',
  }));
}

describe('simulator', () => {
  it('keeps every target between 2% and 98% for any hour, floor and lift distance', () => {
    for (let h = 0; h < 24 * 7; h++) {
      const d = new Date(Date.UTC(2026, 10, 2, h));
      for (let order = 0; order < 8; order++) {
        for (const lift of [0, 0.5, 1]) {
          const p = targetOccupancy(d, order, lift);
          expect(p).toBeGreaterThanOrEqual(0.02);
          expect(p).toBeLessThanOrEqual(0.98);
        }
      }
    }
  });

  it('is fuller at weekends, at 11:00–20:00, on lower floors and near lifts', () => {
    expect(baseOccupancy(satAfternoon)).toBeGreaterThan(baseOccupancy(wedAfternoon));
    expect(baseOccupancy(wedAfternoon)).toBeGreaterThan(baseOccupancy(wedNight));
    expect(targetOccupancy(wedAfternoon, 0, 0.5)).toBeGreaterThan(targetOccupancy(wedAfternoon, 3, 0.5));
    expect(targetOccupancy(wedAfternoon, 1, 0)).toBeGreaterThan(targetOccupancy(wedAfternoon, 1, 1));
  });

  it('changes at most round(3%) of bays per tick', () => {
    const list = bays(200);
    const rng = mulberry32(1);
    for (let i = 0; i < 100; i++) expect(stepFloor(list, 0, wedAfternoon, rng).length).toBeLessThanOrEqual(6);
  });

  it('settles near the expected occupancy', () => {
    const list = bays(200);
    const rng = mulberry32(2);
    for (let i = 0; i < 2000; i++) stepFloor(list, 1, wedAfternoon, rng);
    const taken = list.filter((b) => b.status === 'taken').length / list.length;
    const expected = list.reduce((s, b) => s + targetOccupancy(wedAfternoon, 1, b.lift_distance_m / 199), 0) / list.length;
    expect(Math.abs(taken - expected)).toBeLessThan(0.08);
  });
});
