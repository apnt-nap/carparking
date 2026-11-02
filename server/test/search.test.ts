import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createMallSearch } from '../src/search.js';
import type { MallBase } from '../src/types.js';

const { malls } = JSON.parse(readFileSync(new URL('../data/malls.json', import.meta.url), 'utf8')) as { malls: MallBase[] };
const search = createMallSearch(malls);

describe('mall search aliases (FR-16)', () => {
  it.each([
    ['paragon', 'siam-paragon'],
    ['พารากอน', 'siam-paragon'],
    ['Siam Paragon', 'siam-paragon'],
    ['central world', 'centralworld'],
    ['CentralWorld', 'centralworld'],
    ['เซ็นทรัลเวิลด์', 'centralworld'],
    ['icon siam', 'iconsiam'],
    ['ไอคอนสยาม', 'iconsiam'],
    ['robinson', 'robinson-lat-krabang'],
    ['ลาดกระบัง', 'robinson-lat-krabang'],
    ['lotus', 'lotuss-rama-4'],
    ["Lotus's", 'lotuss-rama-4'],
    ['โลตัส', 'lotuss-rama-4'],
    ['paragn', 'siam-paragon'], // typo
    ['ไอคอน', 'iconsiam'], // partial
  ])('%s → %s', (q, id) => {
    expect(search(q)[0]).toBe(id);
  });

  it('returns nothing for empty or unrelated queries', () => {
    expect(search('')).toEqual([]);
    expect(search('   ')).toEqual([]);
    expect(search('zzzzqqq')).toEqual([]);
  });
});
