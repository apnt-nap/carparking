import Constants from 'expo-constants';
import { isValidPlate, isValidProvince } from '../../../server/src/plateFormat';
import { ERROR_STATUS, ProviderError } from '../../../server/src/provider';
import type {
  CarDetails, FloorDetail, GateResult, MallDetail, MallSummary, Origin, Plate, PublicAccount, Ticket, WalletView,
} from '../../../server/src/types';
import { getMode } from './dataSource';
import { localProvider } from './localProvider';
import { sessionStore } from './session';

export type {
  Bay, BayChange, CarDetails, FloorDetail, FloorSummary, GateResult, Lang, MallDetail, MallSummary, Origin, Plate,
  PublicAccount, Ticket, WalletTx, WalletView,
} from '../../../server/src/types';

/** status is HTTP-style; code is the provider's error code (e.g. "insufficient_balance") for a translated message. */
export class ApiError extends Error {
  constructor(readonly status: number, path: string, readonly code?: string) {
    super(`${status} ${path}${code ? ` ${code}` : ''}`);
  }
}

export interface GateRequest {
  mall_id: string;
  plate_number: string;
  province: string;
  direction: 'entry' | 'exit';
  validated?: boolean;
}

export type TopUpMethod = 'promptpay' | 'card';

/**
 * Server address: EXPO_PUBLIC_API_URL if set, else the machine running the Expo dev server, on port 3000.
 * That way a phone on the same Wi-Fi reaches the mock server without any config.
 */
function apiBase(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${host ?? 'localhost'}:3000`;
}

export const API_BASE = apiBase();
export const WS_BASE = API_BASE.replace(/^http/, 'ws');

/** The signed-in account id. Ticketless entry and the wallet need login (UI-44). */
async function accountId(): Promise<string> {
  const s = await sessionStore.get();
  if (!s) throw new ApiError(401, 'login', 'login_required');
  return s.id;
}

async function http<T>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: object, auth = false): Promise<T> {
  const headers: Record<string, string> = {};
  if (auth) headers['x-user-id'] = await accountId();
  // Content-Type only with a body, or Fastify rejects empty DELETEs.
  if (body) headers['content-type'] = 'application/json';
  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: body && JSON.stringify(body) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(res.status, path, typeof err.error === 'string' ? err.error : undefined);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

const originQuery = (o?: Origin) => (o ? `lat=${o.lat}&lng=${o.lng}` : '');

/** Server mode: the mock server's HTTP API (spec §6, UPDATE_LAYOUT_V2.md A5). */
const remote = {
  malls: (o?: Origin) => http<MallSummary[]>('GET', `/malls?${originQuery(o)}`),
  mall: (id: string, sort: 'free' | 'order') => http<MallDetail>('GET', `/malls/${encodeURIComponent(id)}?sort=${sort}`),
  floor: (id: string) => http<FloorDetail>('GET', `/floors/${encodeURIComponent(id)}`),
  search: (q: string, lang: string, o?: Origin) =>
    http<MallSummary[]>('GET', `/search?q=${encodeURIComponent(q)}&lang=${lang}&${originQuery(o)}`),
  // Phase 2. consent is only ever sent after the Terms screen was accepted.
  plates: () => http<Plate[]>('GET', '/plates', undefined, true),
  addPlate: (number: string, province: string, car?: CarDetails) =>
    http<Plate>('POST', '/plates', { number, province, consent: true, ...car }, true),
  deletePlate: (id: string) => http<void>('DELETE', `/plates/${encodeURIComponent(id)}`, undefined, true),
  tickets: () => http<Ticket[]>('GET', '/tickets', undefined, true),
  gate: (e: GateRequest) => http<GateResult>('POST', '/sim/gate', e),
  // Layout v2
  signUp: (email: string, password: string, display_name: string) =>
    http<PublicAccount>('POST', '/auth/signup', { email, password, display_name }),
  logIn: (email: string, password: string) => http<PublicAccount>('POST', '/auth/login', { email, password }),
  wallet: () => http<WalletView>('GET', '/wallet', undefined, true),
  topUp: (amount_thb: number, method: TopUpMethod) => http<WalletView>('POST', '/wallet/topup', { amount_thb, method }, true),
  payTicket: (id: string) => http<Ticket>('POST', `/tickets/${encodeURIComponent(id)}/pay`, undefined, true),
  addDemoTicket: (plate_id: string, mall_id: string, minutes_ago: number) =>
    http<Ticket>('POST', '/demo/ticket', { plate_id, mall_id, minutes_ago }, true),
  resetDemo: async (): Promise<void> => { throw new ApiError(400, '/demo/reset', 'demo_only'); },
};

type Api = typeof remote;

const orNotFound = <T>(path: string) => (v: T | undefined): T => {
  if (v === undefined) throw new ApiError(404, path, 'not_found');
  return v;
};

/** Turns the provider's business errors into ApiErrors, like the server does. */
async function local<T>(path: string, fn: (p: Awaited<ReturnType<typeof localProvider>>) => Promise<T>): Promise<T> {
  try {
    return await fn(await localProvider());
  } catch (e) {
    if (e instanceof ProviderError) throw new ApiError(ERROR_STATUS[e.code], path, e.code);
    throw e;
  }
}

/** Demo mode: the same calls answered on the phone, with the same checks the server routes make. */
const demo: Api = {
  malls: (o) => local('/malls', (p) => p.listMalls(o)),
  mall: (id, sort) => local(`/malls/${id}`, (p) => p.getMall(id, sort).then(orNotFound(`/malls/${id}`))),
  floor: (id) => local(`/floors/${id}`, (p) => p.getFloor(id).then(orNotFound(`/floors/${id}`))),
  search: (q, lang, o) => local('/search', (p) => p.search(q.slice(0, 100), lang === 'en' ? 'en' : 'th', o)),
  plates: async () => { const id = await accountId(); return local('/plates', (p) => p.listPlates(id)); },
  addPlate: async (number, province, car) => {
    if (!isValidPlate(number) || !isValidProvince(province)) throw new ApiError(400, '/plates', 'invalid_plate');
    const id = await accountId();
    return local('/plates', (p) => p.registerPlate(id, number, province, car));
  },
  deletePlate: async (plateId) => {
    const id = await accountId();
    const ok = await local('/plates', (p) => p.deletePlate(id, plateId));
    if (!ok) throw new ApiError(404, `/plates/${plateId}`, 'not_found');
  },
  tickets: async () => { const id = await accountId(); return local('/tickets', (p) => p.listTickets(id)); },
  gate: (e) => local('/sim/gate', (p) => p.gateEvent(e)),
  signUp: (email, password, name) => local('/auth/signup', (p) => p.signUp(email, password, name)),
  logIn: (email, password) => local('/auth/login', (p) => p.logIn(email, password)),
  wallet: async () => { const id = await accountId(); return local('/wallet', (p) => p.getWallet(id)); },
  topUp: async (amount, method) => { const id = await accountId(); return local('/wallet/topup', (p) => p.topUp(id, amount, method)); },
  payTicket: async (ticketId) => { const id = await accountId(); return local('/tickets/pay', (p) => p.payTicket(id, ticketId)); },
  addDemoTicket: async (plateId, mallId, mins) => {
    const id = await accountId();
    return local('/demo/ticket', (p) => p.addDemoTicket(id, plateId, mallId, mins));
  },
  resetDemo: () => local('/demo/reset', async (p) => p.reset()),
};

const backend = (): Api => (getMode() === 'demo' ? demo : remote);

/** Every screen calls this; it follows the current data mode (Settings). */
export const api: Api = {
  malls: (o) => backend().malls(o),
  mall: (id, sort) => backend().mall(id, sort),
  floor: (id) => backend().floor(id),
  search: (q, lang, o) => backend().search(q, lang, o),
  plates: () => backend().plates(),
  addPlate: (n, p, car) => backend().addPlate(n, p, car),
  deletePlate: (id) => backend().deletePlate(id),
  tickets: () => backend().tickets(),
  gate: (e) => backend().gate(e),
  signUp: (e, p, n) => backend().signUp(e, p, n),
  logIn: (e, p) => backend().logIn(e, p),
  wallet: () => backend().wallet(),
  topUp: (a, m) => backend().topUp(a, m),
  payTicket: (id) => backend().payTicket(id),
  addDemoTicket: (p, m, mins) => backend().addDemoTicket(p, m, mins),
  resetDemo: () => backend().resetDemo(),
};
