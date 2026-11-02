import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Bay, FloorDetail } from '../src/lib/api';
import { applyChanges } from '../src/lib/live';
import { routeTo, shortestPaths, suggestBay } from '../src/lib/route';

// Real generated data from the mock server, with every bay free.
const { floors } = JSON.parse(readFileSync(join(__dirname, '../../server/data/floors.json'), 'utf8'));
const load = (id: string, status: Bay['status'] = 'free'): FloorDetail => {
  const f = floors.find((x: FloorDetail) => x.id === id);
  return { ...f, bays: f.bays.map((b: Bay) => ({ ...b, status, updated_at: '' })) };
};

describe('lane routing (FR-12, FR-13)', () => {
  const floor = load('siam-paragon-b1');

  it('follows one-way lanes: the second aisle is only reachable via the first aisle and the right side', () => {
    const path = shortestPaths(floor).pathTo('a1c0')!;
    expect(path[0]).toBe('entry');
    expect(path).toContain('a0R');
    expect(path).toContain('a1R');
    expect(path.indexOf('a0R')).toBeLessThan(path.indexOf('a1R'));
  });

  it('never drives against a one-way edge', () => {
    const oneWay = new Set(floor.plan.edges.filter((e) => e.one_way).map((e) => `${e.from}>${e.to}`));
    const path = shortestPaths(floor).pathTo(floor.bays[floor.bays.length - 1].node)!;
    for (let i = 0; i + 1 < path.length; i++) expect(oneWay.has(`${path[i]}>${path[i + 1]}`)).toBe(true);
  });

  it('suggests the closest free bay to the ramp: first column of the first aisle', () => {
    const r = suggestBay(floor, 'ramp')!;
    expect(r.bay.node).toBe('a0c0');
    expect(r.bay.type).toBe('normal');
    expect(r.points[0]).toEqual({ x: 4, y: 5 }); // entry node
  });

  it('suggests the bay nearest the lifts when the user prefers the mall entrance', () => {
    const r = suggestBay(floor, 'lift')!;
    const normalFree = floor.bays.filter((b) => b.type === 'normal');
    expect(r.bay.lift_distance_m).toBe(Math.min(...normalFree.map((b) => b.lift_distance_m)));
  });

  it('skips taken bays and returns nothing when the floor is full', () => {
    const full = load('siam-paragon-b1', 'taken');
    expect(suggestBay(full, 'ramp')).toBeUndefined();
    const oneFree = applyChanges(full, [{ bay_id: full.bays[100].id, floor_id: full.id, mall_id: full.mall_id, status: 'free', updated_at: 'x' }]);
    expect(suggestBay(oneFree, 'ramp', ['normal', 'ev', 'accessible', 'family'])!.bay.id).toBe(full.bays[100].id);
  });

  it('routes to any tapped bay and ends at its centre', () => {
    const bay = floor.bays[50];
    const r = routeTo(floor, bay)!;
    expect(r.points.at(-1)).toEqual({ x: bay.x + bay.w / 2, y: bay.y + bay.h / 2 });
    expect(r.distance_m).toBeGreaterThan(0);
  });

  it('every bay on every floor has a route', () => {
    for (const f of floors) {
      const floor = load(f.id);
      const paths = shortestPaths(floor);
      for (const b of floor.bays) expect(routeTo(floor, b, paths)).toBeDefined();
    }
  });
});

describe('applyChanges (FR-11)', () => {
  it('updates only matching bays and keeps the object when nothing applies', () => {
    const floor = load('iconsiam-b1');
    expect(applyChanges(floor, [{ bay_id: 'x', floor_id: 'other', mall_id: 'm', status: 'taken', updated_at: '' }])).toBe(floor);
    const next = applyChanges(floor, [{ bay_id: floor.bays[0].id, floor_id: floor.id, mall_id: floor.mall_id, status: 'taken', updated_at: 't' }]);
    expect(next.bays[0].status).toBe('taken');
    expect(next.bays[1]).toBe(floor.bays[1]);
  });
});
