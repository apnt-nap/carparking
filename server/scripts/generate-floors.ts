/**
 * Generates data/floors.json from data/malls.json (Milestone 1, step 2; spec FR-7, FR-9, FR-14).
 *
 * Layout per floor: 3–5 horizontal aisles, each with a row of bays above and below a 6 m lane.
 * Traffic is one-way in a serpentine: entry ramp → aisle 0 left→right → down the right side →
 * aisle 1 right→left → … → exit ramp. Every bay is reachable from the entry and can reach the exit.
 * Run: npm run generate (output is deterministic, so re-running gives the same file).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { mulberry32, seedFrom } from '../src/simulator.js';
import type { BaySpec, FloorSpec, LaneEdge, LaneNode, Lobby, MallBase, Ramp } from '../src/types.js';

const BAY_W = 2.5;
const BAY_D = 5;
const LANE = 6;
const BAND = BAY_D * 2 + LANE; // one aisle: bays + lane + bays
const SIDE = 8; // width of the turning lanes at each end
const TOP = 10; // strip at the top for the entry ramp and lift lobby
const BOTTOM = 8; // strip at the bottom for the exit ramp

const r2 = (n: number) => Math.round(n * 100) / 100;

export function generateFloor(mall: MallBase, order: number): FloorSpec {
  const lv = mall.levels[order];
  const id = `${mall.id}-${lv.level.toLowerCase()}`;
  const rng = mulberry32(seedFrom(id));

  const aisles = 3 + Math.floor(rng() * 3); // 3..5
  const minCols = Math.ceil(40 / aisles); // 2 rows × aisles × cols ≥ 80 bays
  const maxCols = Math.min(25, Math.floor(125 / aisles)); // ≤ 250 bays
  const cols = minCols + Math.floor(rng() * (maxCols - minCols + 1));
  const width = SIDE * 2 + cols * BAY_W;
  const height = TOP + aisles * BAND + BOTTOM;

  const nodes: LaneNode[] = [];
  const edges: LaneEdge[] = [];
  const laneY = (a: number) => TOP + a * BAND + BAY_D + LANE / 2;
  const colX = (c: number) => SIDE + c * BAY_W + BAY_W / 2;

  for (let a = 0; a < aisles; a++) {
    const y = laneY(a);
    const row: LaneNode[] = [
      { id: `a${a}L`, x: SIDE / 2, y },
      ...Array.from({ length: cols }, (_, c) => ({ id: `a${a}c${c}`, x: colX(c), y })),
      { id: `a${a}R`, x: width - SIDE / 2, y },
    ];
    nodes.push(...row);
    const dir = a % 2 === 0 ? row : [...row].reverse();
    for (let i = 0; i + 1 < dir.length; i++) edges.push({ from: dir[i].id, to: dir[i + 1].id, one_way: true });
    if (a + 1 < aisles) {
      const side = a % 2 === 0 ? 'R' : 'L';
      edges.push({ from: `a${a}${side}`, to: `a${a + 1}${side}`, one_way: true });
    }
  }

  const last = aisles - 1;
  const endSide = last % 2 === 0 ? 'R' : 'L';
  const entry: LaneNode = { id: 'entry', x: SIDE / 2, y: TOP / 2 };
  const exit: LaneNode = { id: 'exit', x: endSide === 'R' ? width - SIDE / 2 : SIDE / 2, y: height - BOTTOM / 2 };
  nodes.push(entry, exit);
  edges.push({ from: 'entry', to: 'a0L', one_way: true }, { from: `a${last}${endSide}`, to: 'exit', one_way: true });

  const ramps: Ramp[] = [
    { id: 'ramp-in', kind: 'entry', node: 'entry', x: 0, y: 0, w: SIDE, h: TOP, label_th: 'ทางขึ้น/เข้า', label_en: 'Ramp in' },
    { id: 'ramp-out', kind: 'exit', node: 'exit', x: exit.x - SIDE / 2, y: height - BOTTOM, w: SIDE, h: BOTTOM, label_th: 'ทางลง/ออก', label_en: 'Ramp out' },
  ];
  const midCol = Math.floor(cols / 2);
  const lobby: Lobby = {
    id: 'lift-1', node: `a0c${midCol}`, x: width / 2 - 6, y: 0, w: 12, h: TOP - 2,
    label_th: 'ลิฟต์/บันไดเลื่อน ไปห้าง', label_en: 'Lifts/escalators to mall',
  };
  const lobbyCx = lobby.x + lobby.w / 2;
  const lobbyCy = lobby.y + lobby.h;

  const bays: BaySpec[] = [];
  for (let a = 0; a < aisles; a++) {
    for (const side of [0, 1]) {
      const y = TOP + a * BAND + (side === 0 ? 0 : BAY_D + LANE);
      for (let c = 0; c < cols; c++) {
        const x = SIDE + c * BAY_W;
        const zone = String.fromCharCode(65 + a * 2 + (c < cols / 2 ? 0 : 1));
        bays.push({
          id: `${id}-${zone}${String(bays.length + 1).padStart(3, '0')}`,
          floor_id: id,
          zone,
          zone_name_th: `${lv.level} โซน ${zone}`,
          zone_name_en: `${lv.level} Zone ${zone}`,
          x: r2(x), y: r2(y), w: BAY_W, h: BAY_D, rotation: 0,
          type: 'normal',
          node: `a${a}c${c}`,
          lift_distance_m: r2(Math.hypot(x + BAY_W / 2 - lobbyCx, y + BAY_D / 2 - lobbyCy)),
        });
      }
    }
  }

  // Special bays: accessible and family nearest the lifts, EV chargers in the far corner.
  const byLift = [...bays].sort((p, q) => p.lift_distance_m - q.lift_distance_m);
  byLift.slice(0, 4).forEach((b) => (b.type = 'accessible'));
  byLift.slice(4, 8).forEach((b) => (b.type = 'family'));
  byLift.slice(-6).forEach((b) => (b.type = 'ev'));

  return {
    id, mall_id: mall.id, level: lv.level, order, name_th: lv.name_th, name_en: lv.name_en,
    plan: {
      width: r2(width), height: r2(height),
      outline: { x: 0, y: 0, w: r2(width), h: r2(height) },
      nodes: nodes.map((n) => ({ ...n, x: r2(n.x), y: r2(n.y) })),
      edges, ramps, lobbies: [lobby],
    },
    bays,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dataDir = new URL('../data/', import.meta.url);
  const { malls } = JSON.parse(readFileSync(new URL('malls.json', dataDir), 'utf8')) as { malls: MallBase[] };
  const floors = malls.flatMap((m) => m.levels.map((_, i) => generateFloor(m, i)));
  writeFileSync(
    new URL('floors.json', dataDir),
    JSON.stringify({ _note: 'Generated by scripts/generate-floors.ts. Do not edit by hand.', floors }) + '\n',
  );
  console.log(`Wrote ${floors.length} floors, ${floors.reduce((n, f) => n + f.bays.length, 0)} bays`);
}
