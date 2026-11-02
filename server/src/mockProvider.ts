import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { calculateFee } from './fees.js';
import { availability, distanceKm } from './geo.js';
import { plateKey } from './plates.js';
import type { ParkingProvider } from './provider.js';
import { createMallSearch } from './search.js';
import { mulberry32, stepFloor, targetOccupancy, type Rng } from './simulator.js';
import type {
  Bay, BayChange, BayType, Counts, FloorDetail, FloorSpec, FloorSummary, GateEvent, GateResult, Lang,
  MallBase, MallDetail, MallSummary, Origin, Plate, Ticket,
} from './types.js';

interface Options {
  now?: () => Date;
  rng?: Rng;
}

/** Simulated data source: in-memory malls, floors and bays, with a simulator that changes bay status (spec §3). */
export class MockParkingProvider implements ParkingProvider {
  private readonly malls = new Map<string, MallBase>();
  private readonly floors = new Map<string, FloorSpec>();
  private readonly bays = new Map<string, Bay[]>();
  private readonly listeners = new Set<(c: BayChange[]) => void>();
  private readonly plates: Plate[] = [];
  private readonly tickets: Ticket[] = [];
  private readonly searchIds: (q: string) => string[];
  private readonly now: () => Date;
  private readonly rng: Rng;
  private timer?: NodeJS.Timeout;

  constructor(malls: MallBase[], floors: FloorSpec[], opts: Options = {}) {
    this.now = opts.now ?? (() => new Date());
    this.rng = opts.rng ?? Math.random;
    for (const m of malls) this.malls.set(m.id, m);
    const start = this.now();
    for (const f of floors) {
      this.floors.set(f.id, f);
      const maxLift = Math.max(...f.bays.map((b) => b.lift_distance_m)) || 1;
      this.bays.set(f.id, f.bays.map((b) => ({
        ...b,
        status: this.rng() < targetOccupancy(start, f.order, b.lift_distance_m / maxLift) ? 'taken' : 'free',
        updated_at: start.toISOString(),
      })));
    }
    this.searchIds = createMallSearch(malls);
  }

  static fromDir(dataDir: URL, opts?: Options): MockParkingProvider {
    const read = (name: string) => JSON.parse(readFileSync(new URL(name, dataDir), 'utf8'));
    return new MockParkingProvider(read('malls.json').malls, read('floors.json').floors, opts);
  }

  /** FR-11: ticks well under the 5 s limit. */
  start(intervalMs = 3000): void {
    this.stop();
    this.timer = setInterval(() => this.tick(), intervalMs);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  tick(): BayChange[] {
    const now = this.now();
    const changes: BayChange[] = [];
    for (const [floorId, bays] of this.bays) {
      const floor = this.floors.get(floorId)!;
      for (const b of stepFloor(bays, floor.order, now, this.rng)) {
        changes.push({ bay_id: b.id, floor_id: floorId, mall_id: floor.mall_id, status: b.status, updated_at: b.updated_at });
      }
    }
    if (changes.length) for (const l of this.listeners) l(changes);
    return changes;
  }

  onBayChanges(listener: (c: BayChange[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private floorsOf(mallId: string): FloorSpec[] {
    return [...this.floors.values()].filter((f) => f.mall_id === mallId).sort((a, b) => a.order - b.order);
  }

  private count(bays: Bay[], type?: BayType): Counts {
    const list = type ? bays.filter((b) => b.type === type) : bays;
    return { free: list.filter((b) => b.status === 'free').length, total: list.length };
  }

  private summary(m: MallBase, origin?: Origin): MallSummary {
    const all = this.floorsOf(m.id).flatMap((f) => this.bays.get(f.id)!);
    const { free, total } = this.count(all);
    return {
      id: m.id, name_th: m.name_th, name_en: m.name_en, brand: m.brand, branch_th: m.branch_th, branch_en: m.branch_en,
      lat: m.lat, lng: m.lng,
      distance_km: origin ? distanceKm(origin, m) : null,
      free, total, availability: availability(free, total),
      fees_summary_th: m.fees.summary_th, fees_summary_en: m.fees.summary_en,
    };
  }

  async listMalls(origin?: Origin): Promise<MallSummary[]> {
    const list = [...this.malls.values()].map((m) => this.summary(m, origin));
    return origin ? list.sort((a, b) => a.distance_km! - b.distance_km!) : list; // FR-4
  }

  async getMall(id: string, sort: 'free' | 'order' = 'free'): Promise<MallDetail | undefined> {
    const m = this.malls.get(id);
    if (!m) return undefined;
    const floors: FloorSummary[] = this.floorsOf(id).map((f) => {
      const bays = this.bays.get(f.id)!;
      return {
        id: f.id, level: f.level, order: f.order, name_th: f.name_th, name_en: f.name_en,
        ...this.count(bays), best_choice: false,
        special: { ev: this.count(bays, 'ev'), accessible: this.count(bays, 'accessible'), family: this.count(bays, 'family') },
      };
    });
    const best = floors.reduce((a, b) => (b.free > a.free ? b : a), floors[0]); // FR-6
    if (best && best.free > 0) best.best_choice = true;
    if (sort === 'free') floors.sort((a, b) => b.free - a.free || a.order - b.order);
    const { levels: _l, aliases: _a, ...base } = m;
    const free = floors.reduce((n, f) => n + f.free, 0);
    const total = floors.reduce((n, f) => n + f.total, 0);
    return { ...base, free, total, availability: availability(free, total), floors };
  }

  async getFloor(id: string): Promise<FloorDetail | undefined> {
    const f = this.floors.get(id);
    if (!f) return undefined;
    return { ...f, bays: this.bays.get(id)!.map((b) => ({ ...b })) };
  }

  async search(q: string, _lang: Lang, origin?: Origin): Promise<MallSummary[]> {
    return this.searchIds(q).map((id) => this.summary(this.malls.get(id)!, origin));
  }

  async registerPlate(userId: string, number: string, province: string): Promise<Plate> {
    const key = plateKey(number, province);
    const existing = this.plates.find((p) => p.user_id === userId && plateKey(p.number, p.province) === key);
    if (existing) return existing;
    const plate: Plate = {
      id: randomUUID(), user_id: userId, number: number.trim().replace(/\s+/g, ' '), province: province.trim(),
      consent_at: this.now().toISOString(),
    };
    this.plates.push(plate);
    return plate;
  }

  async listPlates(userId: string): Promise<Plate[]> {
    return this.plates.filter((p) => p.user_id === userId);
  }

  /** NFR-5: deleting a plate also deletes its tickets. */
  async deletePlate(userId: string, plateId: string): Promise<boolean> {
    const i = this.plates.findIndex((p) => p.id === plateId && p.user_id === userId);
    if (i < 0) return false;
    this.plates.splice(i, 1);
    for (let t = this.tickets.length - 1; t >= 0; t--) if (this.tickets[t].plate_id === plateId) this.tickets.splice(t, 1);
    return true;
  }

  /** FR-22 to FR-24. */
  async gateEvent(e: GateEvent): Promise<GateResult> {
    const mall = this.malls.get(e.mall_id);
    if (!mall) return { action: 'fallback_ticket', reason: 'unknown_mall' };
    const key = plateKey(e.plate_number, e.province);
    const plate = this.plates.find((p) => plateKey(p.number, p.province) === key);
    if (!plate) return { action: 'fallback_ticket', reason: 'unregistered' };
    const at = e.at ?? this.now();
    const open = this.tickets.find((t) => t.plate_id === plate.id && t.mall_id === mall.id && t.status === 'open');

    if (e.direction === 'entry') {
      if (open) return { action: 'open_gate', ticket: open }; // repeated read at the gate
      const ticket: Ticket = {
        id: randomUUID(), plate_id: plate.id, mall_id: mall.id, entry_at: at.toISOString(), exit_at: null,
        fee_thb: 0, validated: false, status: 'open',
      };
      this.tickets.push(ticket);
      return { action: 'open_gate', ticket };
    }

    if (!open) return { action: 'fallback_ticket', reason: 'no_open_ticket' };
    open.validated = e.validated ?? false;
    open.exit_at = at.toISOString();
    open.fee_thb = calculateFee(mall.fees, Math.max(0, (at.getTime() - Date.parse(open.entry_at)) / 60000), open.validated);
    open.status = 'closed';
    return { action: 'open_gate', ticket: open };
  }

  async listTickets(userId: string): Promise<Ticket[]> {
    const ids = new Set(this.plates.filter((p) => p.user_id === userId).map((p) => p.id));
    const now = this.now().getTime();
    return this.tickets.filter((t) => ids.has(t.plate_id)).map((t) => t.status !== 'open' ? { ...t } : {
      ...t, // running fee for open tickets (FR-22)
      fee_thb: calculateFee(this.malls.get(t.mall_id)!.fees, Math.max(0, (now - Date.parse(t.entry_at)) / 60000)),
    });
  }
}
