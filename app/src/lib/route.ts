import type { Bay, FloorDetail } from './api';

export type Preference = 'ramp' | 'lift';

export interface Route {
  bay: Bay;
  /** Points to draw, in metres: entry ramp → lanes → the bay itself. */
  points: { x: number; y: number }[];
  distance_m: number;
}

/** Dijkstra from the entry ramp over the lane graph, following one-way edges (FR-12). */
export function shortestPaths(floor: FloorDetail, from = 'entry') {
  const pos = new Map(floor.plan.nodes.map((n) => [n.id, n]));
  const adj = new Map<string, { to: string; w: number }[]>();
  const link = (a: string, b: string) => {
    const p = pos.get(a)!;
    const q = pos.get(b)!;
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a)!.push({ to: b, w: Math.hypot(p.x - q.x, p.y - q.y) });
  };
  for (const e of floor.plan.edges) {
    link(e.from, e.to);
    if (!e.one_way) link(e.to, e.from);
  }

  const dist = new Map<string, number>([[from, 0]]);
  const prev = new Map<string, string>();
  const done = new Set<string>();
  // shortcut: linear scan instead of a heap; fine for a few hundred nodes per floor, use a heap if floors get much bigger.
  for (;;) {
    let u: string | undefined;
    for (const [id, d] of dist) if (!done.has(id) && (u === undefined || d < dist.get(u)!)) u = id;
    if (u === undefined) break;
    done.add(u);
    for (const { to, w } of adj.get(u) ?? []) {
      const nd = dist.get(u)! + w;
      if (nd < (dist.get(to) ?? Infinity)) { dist.set(to, nd); prev.set(to, u); }
    }
  }

  const pathTo = (node: string): string[] | undefined => {
    if (!dist.has(node)) return undefined;
    const path = [node];
    while (path[0] !== from) path.unshift(prev.get(path[0])!);
    return path;
  };
  return { dist, pathTo, pos };
}

/** Route from the entry ramp to a bay, or undefined if the lanes can't reach it. */
export function routeTo(floor: FloorDetail, bay: Bay, paths = shortestPaths(floor)): Route | undefined {
  const nodes = paths.pathTo(bay.node);
  if (!nodes) return undefined;
  const lane = paths.pos.get(bay.node)!;
  const centre = { x: bay.x + bay.w / 2, y: bay.y + bay.h / 2 };
  return {
    bay,
    points: [...nodes.map((id) => ({ x: paths.pos.get(id)!.x, y: paths.pos.get(id)!.y })), centre],
    distance_m: paths.dist.get(bay.node)! + Math.hypot(centre.x - lane.x, centre.y - lane.y),
  };
}

/**
 * FR-12: the free bay to suggest. 'ramp' = shortest drive from the entry ramp;
 * 'lift' = shortest walk to the mall entrance. Special bays are only suggested when asked for.
 */
export function suggestBay(floor: FloorDetail, pref: Preference, allow: Bay['type'][] = ['normal']): Route | undefined {
  const paths = shortestPaths(floor);
  let best: { bay: Bay; score: number } | undefined;
  for (const bay of floor.bays) {
    if (bay.status !== 'free' || !allow.includes(bay.type)) continue;
    const drive = paths.dist.get(bay.node);
    if (drive === undefined) continue;
    const score = pref === 'ramp' ? drive : bay.lift_distance_m + drive / 1000; // drive breaks ties
    if (!best || score < best.score) best = { bay, score };
  }
  return best && routeTo(floor, best.bay, paths);
}
