import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { generateFloor } from '../scripts/generate-floors.js';
import type { FloorSpec, MallBase } from '../src/types.js';

const read = (f: string) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const malls: MallBase[] = read('malls.json').malls;
const floors: FloorSpec[] = read('floors.json').floors;

function reachable(f: FloorSpec, from: string, reverse = false): Set<string> {
  const seen = new Set([from]);
  const queue = [from];
  while (queue.length) {
    const n = queue.shift()!;
    for (const e of f.plan.edges) {
      const [a, b] = reverse ? [e.to, e.from] : [e.from, e.to];
      const next = a === n ? b : !e.one_way && b === n ? a : undefined;
      if (next && !seen.has(next)) { seen.add(next); queue.push(next); }
    }
  }
  return seen;
}

describe('generated floors (Milestone 1 step 2)', () => {
  it('committed floors.json matches the generator output', () => {
    expect(floors).toEqual(malls.flatMap((m) => m.levels.map((_, i) => generateFloor(m, i))));
  });

  it('gives every mall 3–6 floors', () => {
    for (const m of malls) {
      const n = floors.filter((f) => f.mall_id === m.id).length;
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(6);
    }
  });

  it.each(floors.map((f) => [f.id, f] as const))('%s: 80–250 bays, special bays, every bay reachable and can exit', (_, f) => {
    expect(f.bays.length).toBeGreaterThanOrEqual(80);
    expect(f.bays.length).toBeLessThanOrEqual(250);
    for (const t of ['ev', 'accessible', 'family']) expect(f.bays.some((b) => b.type === t)).toBe(true);
    const fromEntry = reachable(f, 'entry');
    const toExit = reachable(f, 'exit', true);
    for (const b of f.bays) {
      expect(fromEntry.has(b.node)).toBe(true);
      expect(toExit.has(b.node)).toBe(true);
    }
    expect(new Set(f.bays.map((b) => b.id)).size).toBe(f.bays.length);
  });
});
