import Fuse from 'fuse.js';
import type { MallBase } from './types.js';

/** Lowercase and drop spaces/punctuation so "Central World", "centralworld" and "Lotus's" all compare equal. */
export function normalize(s: string): string {
  return s.normalize('NFC').toLowerCase().replace(/[\s'’\-_.]/g, '');
}

/** FR-16: fuzzy search over Thai and English names, branches, areas and aliases. Returns mall ids, best first. */
export function createMallSearch(malls: MallBase[]): (q: string) => string[] {
  const docs = malls.flatMap((m) =>
    [m.name_th, m.name_en, m.branch_th, m.branch_en, m.area_th, m.area_en, ...m.aliases]
      .map((text) => ({ id: m.id, text: normalize(text) })),
  );
  const fuse = new Fuse(docs, { keys: ['text'], threshold: 0.3, ignoreLocation: true, includeScore: true });

  return (q) => {
    const query = normalize(q);
    if (!query) return [];
    const best = new Map<string, number>();
    for (const r of fuse.search(query)) {
      const score = r.score ?? 1;
      if (score < (best.get(r.item.id) ?? Infinity)) best.set(r.item.id, score);
    }
    return [...best.entries()].sort((a, b) => a[1] - b[1]).map(([id]) => id);
  };
}
