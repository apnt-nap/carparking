import { calculateFee } from './fees.js';
import { availability, distanceKm } from './geo.js';
import { plateKey } from './plateFormat.js';
import { ProviderError, type ParkingProvider } from './provider.js';
import { createMallSearch } from './search.js';
import { mulberry32, stepFloor, targetOccupancy, type Rng } from './simulator.js';
import type {
  Account, Bay, BayChange, BayType, CarDetails, Counts, FloorDetail, FloorSpec, FloorSummary, GateEvent, GateResult, Lang,
  MallBase, MallDetail, MallSummary, Origin, PayMethod, Plate, PublicAccount, Ticket, WalletTx, WalletView,
} from './types.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
export const TOPUP_MIN = 20;
export const TOPUP_MAX = 5000;

/** Default hash: SHA-256 hex via Web Crypto (Node 20+). The app passes expo-crypto instead (Hermes has no crypto.subtle). */
async function webSha256(text: string): Promise<string> {
  const buf = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface MockOptions {
  now?: () => Date;
  rng?: Rng;
  /** Id generator; defaults to crypto.randomUUID (Node). The app passes its own because Hermes has no crypto. */
  newId?: () => string;
  /** SHA-256 hex of a string, for demo passwords. */
  sha256?: (text: string) => Promise<string>;
}

/** Everything a user creates, so a caller can save and restore it (the app keeps it on the phone). */
export interface MockState {
  plates: Plate[];
  tickets: Ticket[];
  accounts?: Account[];
  transactions?: WalletTx[];
}

/**
 * Simulated data source: in-memory malls, floors and bays, with a simulator that changes bay status (spec §3).
 * Uses no Node modules, so the app's offline demo mode runs this same class on the phone.
 */
export class MockParkingProvider implements ParkingProvider {
  private readonly malls = new Map<string, MallBase>();
  private readonly floors = new Map<string, FloorSpec>();
  private readonly bays = new Map<string, Bay[]>();
  private readonly listeners = new Set<(c: BayChange[]) => void>();
  private plates: Plate[] = [];
  private tickets: Ticket[] = [];
  private accounts: Account[] = [];
  private transactions: WalletTx[] = [];
  private readonly sha256: (text: string) => Promise<string>;
  private readonly searchIds: (q: string) => string[];
  private readonly now: () => Date;
  private readonly rng: Rng;
  private readonly newId: () => string;
  private timer?: ReturnType<typeof setInterval>;

  constructor(malls: MallBase[], floors: FloorSpec[], opts: MockOptions = {}) {
    this.now = opts.now ?? (() => new Date());
    this.rng = opts.rng ?? Math.random;
    this.newId = opts.newId ?? (() => globalThis.crypto.randomUUID());
    this.sha256 = opts.sha256 ?? webSha256;
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

  snapshot(): MockState {
    const copy = <T>(xs: T[]) => xs.map((x) => ({ ...x }));
    return { plates: copy(this.plates), tickets: copy(this.tickets), accounts: copy(this.accounts), transactions: copy(this.transactions) };
  }

  restore(state: MockState): void {
    const copy = <T>(xs: T[] | undefined) => (xs ?? []).map((x) => ({ ...x }));
    this.plates = copy(state.plates);
    // Tickets saved before v2 have no payment fields.
    this.tickets = copy(state.tickets).map((t) => ({ ...t, paid_thb: t.paid_thb ?? 0, paid_at: t.paid_at ?? null, paid_from: t.paid_from ?? null }));
    this.accounts = copy(state.accounts);
    this.transactions = copy(state.transactions);
  }

  /** UI-25 "Reset demo data": forget plates, tickets, accounts and wallet. Bays keep simulating. */
  reset(): void {
    this.plates = [];
    this.tickets = [];
    this.accounts = [];
    this.transactions = [];
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
      fees: { ...m.fees }, area_th: m.area_th, area_en: m.area_en, hours: { ...m.hours },
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

  async registerPlate(userId: string, number: string, province: string, car: CarDetails = {}): Promise<Plate> {
    const model = car.car_model?.trim();
    if ((model && model.length > 40) || (car.car_color && !COLOR_RE.test(car.car_color))) throw new ProviderError('invalid_car');
    const key = plateKey(number, province);
    const existing = this.plates.find((p) => p.user_id === userId && plateKey(p.number, p.province) === key);
    if (existing) return existing;
    const plate: Plate = {
      id: this.newId(), user_id: userId, number: number.trim().replace(/\s+/g, ' '), province: province.trim(),
      consent_at: this.now().toISOString(),
      ...(model ? { car_model: model } : {}),
      ...(car.car_color ? { car_color: car.car_color } : {}),
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
        id: this.newId(), plate_id: plate.id, mall_id: mall.id, entry_at: at.toISOString(), exit_at: null,
        fee_thb: 0, validated: false, status: 'open', paid_thb: 0, paid_at: null, paid_from: null,
      };
      this.tickets.push(ticket);
      return { action: 'open_gate', ticket };
    }

    if (!open) return { action: 'fallback_ticket', reason: 'no_open_ticket' };
    open.validated = e.validated ?? false;
    open.exit_at = at.toISOString();
    open.fee_thb = calculateFee(mall.fees, Math.max(0, (at.getTime() - Date.parse(open.entry_at)) / 60000), open.validated);
    // UI-16 / UI-20: anything still due is paid from the wallet if it covers it, otherwise at the ticket machine.
    const due = open.fee_thb - open.paid_thb;
    if (due > 0) {
      if (this.balanceOf(plate.user_id) >= due) this.charge(plate.user_id, open, due, at);
      else Object.assign(open, { paid_thb: open.fee_thb, paid_at: at.toISOString(), paid_from: 'gate' });
    }
    open.status = 'closed';
    return { action: 'open_gate', ticket: open };
  }

  async listTickets(userId: string): Promise<Ticket[]> {
    const ids = new Set(this.plates.filter((p) => p.user_id === userId).map((p) => p.id));
    return this.tickets.filter((t) => ids.has(t.plate_id)).map((t) => (t.status === 'open' ? { ...t, fee_thb: this.runningFee(t) } : { ...t }));
  }

  private runningFee(t: Ticket): number {
    return calculateFee(this.malls.get(t.mall_id)!.fees, Math.max(0, (this.now().getTime() - Date.parse(t.entry_at)) / 60000));
  }

  // ---------- Layout v2: accounts and wallet (UI-16, UI-21 to UI-23, A5) ----------

  private publicAccount(a: Account): PublicAccount {
    return { id: a.id, email: a.email, display_name: a.display_name, created_at: a.created_at };
  }

  async signUp(email: string, password: string, displayName: string): Promise<PublicAccount> {
    const mail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(mail) || mail.length > 120) throw new ProviderError('invalid_email');
    if (password.length < 6 || password.length > 128) throw new ProviderError('weak_password');
    const name = displayName.trim();
    if (!name || name.length > 60) throw new ProviderError('invalid_name');
    if (this.accounts.some((a) => a.email === mail)) throw new ProviderError('email_taken');
    const salt = this.newId();
    const hash = await this.sha256(`${salt}:${password}`);
    // Defence in depth: refuse to store anything that isn't a real SHA-256 hex digest.
    if (!/^[0-9a-f]{64}$/i.test(hash)) throw new Error('Password hashing failed');
    const account: Account = {
      id: this.newId(), email: mail, display_name: name, salt, password_hash: hash, created_at: this.now().toISOString(),
    };
    this.accounts.push(account);
    return this.publicAccount(account);
  }

  async logIn(email: string, password: string): Promise<PublicAccount> {
    const a = this.accounts.find((x) => x.email === email.trim().toLowerCase());
    // Same error for unknown email and wrong password, so it doesn't reveal which accounts exist.
    if (!a || (await this.sha256(`${a.salt}:${password}`)) !== a.password_hash) throw new ProviderError('bad_credentials');
    return this.publicAccount(a);
  }

  private balanceOf(accountId: string): number {
    return this.transactions
      .filter((x) => x.account_id === accountId)
      .reduce((sum, x) => sum + (x.type === 'payment' ? -x.amount_thb : x.amount_thb), 0);
  }

  private charge(accountId: string, ticket: Ticket, amount: number, at: Date) {
    this.transactions.push({
      id: this.newId(), account_id: accountId, type: 'payment', amount_thb: amount, method: 'wallet',
      ticket_id: ticket.id, created_at: at.toISOString(),
    });
    ticket.paid_thb += amount;
    ticket.paid_at = at.toISOString();
    ticket.paid_from = 'wallet';
  }

  async getWallet(accountId: string): Promise<WalletView> {
    const txs = this.transactions.filter((x) => x.account_id === accountId);
    return { balance_thb: this.balanceOf(accountId), transactions: [...txs].reverse().map((x) => ({ ...x })) };
  }

  /** UI-23: demo top-up. Whole baht, 20 to 5,000. No real money moves (NFR-9). */
  async topUp(accountId: string, amountThb: number, method: Exclude<PayMethod, 'wallet'>): Promise<WalletView> {
    if (!Number.isInteger(amountThb) || amountThb < TOPUP_MIN || amountThb > TOPUP_MAX) throw new ProviderError('invalid_amount');
    if (!this.accounts.some((a) => a.id === accountId)) throw new ProviderError('not_found');
    this.transactions.push({
      id: this.newId(), account_id: accountId, type: 'topup', amount_thb: amountThb, method, created_at: this.now().toISOString(),
    });
    return this.getWallet(accountId);
  }

  /** UI-16: pay what is due now from the wallet. The ticket stays open until the car exits. */
  async payTicket(accountId: string, ticketId: string): Promise<Ticket> {
    const t = this.tickets.find((x) => x.id === ticketId);
    const plate = t && this.plates.find((p) => p.id === t.plate_id);
    if (!t || !plate || plate.user_id !== accountId || t.status !== 'open') throw new ProviderError('not_found');
    const due = this.runningFee(t) - t.paid_thb;
    if (due <= 0) throw new ProviderError('nothing_due');
    if (this.balanceOf(accountId) < due) throw new ProviderError('insufficient_balance');
    this.charge(accountId, t, due, this.now());
    return { ...t, fee_thb: this.runningFee(t) };
  }

  /** UI-25: an open ticket that started minutesAgo, for demos without the gate simulator. */
  async addDemoTicket(accountId: string, plateId: string, mallId: string, minutesAgo: number): Promise<Ticket> {
    const plate = this.plates.find((p) => p.id === plateId && p.user_id === accountId);
    if (!plate || !this.malls.has(mallId)) throw new ProviderError('not_found');
    const mins = Math.min(24 * 60, Math.max(0, Math.round(minutesAgo)));
    const at = new Date(this.now().getTime() - mins * 60000);
    const result = await this.gateEvent({ mall_id: mallId, plate_number: plate.number, province: plate.province, direction: 'entry', at });
    if (result.action !== 'open_gate') throw new ProviderError('not_found');
    return { ...result.ticket, fee_thb: this.runningFee(result.ticket) };
  }
}
