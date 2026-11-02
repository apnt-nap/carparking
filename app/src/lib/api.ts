import Constants from 'expo-constants';
import { isValidPlate, isValidProvince } from '../../../server/src/plateFormat';
import type { FloorDetail, GateResult, MallDetail, MallSummary, Origin, Plate, Ticket } from '../../../server/src/types';
import { getMode } from './dataSource';
import { localProvider } from './localProvider';
import { getUserId } from './user';

export type {
  Bay, BayChange, FloorDetail, FloorSummary, GateResult, Lang, MallDetail, MallSummary, Origin, Plate, Ticket,
} from '../../../server/src/types';

export class ApiError extends Error {
  constructor(readonly status: number, path: string) {
    super(`${status} ${path}`);
  }
}

export interface GateRequest {
  mall_id: string;
  plate_number: string;
  province: string;
  direction: 'entry' | 'exit';
  validated?: boolean;
}

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

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new ApiError(res.status, path);
  return res.json() as Promise<T>;
}

/** Phase 2 calls carry the user id. Content-Type is only sent with a body, or Fastify rejects empty DELETEs. */
async function send<T>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: object): Promise<T> {
  const headers: Record<string, string> = { 'x-user-id': await getUserId() };
  if (body) headers['content-type'] = 'application/json';
  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: body && JSON.stringify(body) });
  if (!res.ok) throw new ApiError(res.status, path);
  return (res.status === 204 ? undefined : await res.json()) as T;
}

const originQuery = (o?: Origin) => (o ? `lat=${o.lat}&lng=${o.lng}` : '');

/** Server mode: the mock server's HTTP API (spec §6). */
const remote = {
  malls: (o?: Origin) => get<MallSummary[]>(`/malls?${originQuery(o)}`),
  mall: (id: string, sort: 'free' | 'order') => get<MallDetail>(`/malls/${encodeURIComponent(id)}?sort=${sort}`),
  floor: (id: string) => get<FloorDetail>(`/floors/${encodeURIComponent(id)}`),
  search: (q: string, lang: string, o?: Origin) =>
    get<MallSummary[]>(`/search?q=${encodeURIComponent(q)}&lang=${lang}&${originQuery(o)}`),
  // Phase 2 (FR-21 to FR-25). consent is only ever sent after the Terms screen was accepted.
  plates: () => send<Plate[]>('GET', '/plates'),
  addPlate: (number: string, province: string) => send<Plate>('POST', '/plates', { number, province, consent: true }),
  deletePlate: (id: string) => send<void>('DELETE', `/plates/${encodeURIComponent(id)}`),
  tickets: () => send<Ticket[]>('GET', '/tickets'),
  gate: (e: GateRequest) => send<GateResult>('POST', '/sim/gate', e),
};

type Api = typeof remote;

const orNotFound = <T>(path: string) => (v: T | undefined): T => {
  if (v === undefined) throw new ApiError(404, path);
  return v;
};

/** Demo mode: the same calls answered on the phone, with the same checks the server routes make. */
const local: Api = {
  malls: async (o) => (await localProvider()).listMalls(o),
  mall: async (id, sort) => (await localProvider()).getMall(id, sort).then(orNotFound(`/malls/${id}`)),
  floor: async (id) => (await localProvider()).getFloor(id).then(orNotFound(`/floors/${id}`)),
  search: async (q, lang, o) => (await localProvider()).search(q.slice(0, 100), lang === 'en' ? 'en' : 'th', o),
  plates: async () => (await localProvider()).listPlates(await getUserId()),
  addPlate: async (number, province) => {
    if (!isValidPlate(number) || !isValidProvince(province)) throw new ApiError(400, '/plates');
    return (await localProvider()).registerPlate(await getUserId(), number, province);
  },
  deletePlate: async (id) => {
    if (!(await (await localProvider()).deletePlate(await getUserId(), id))) throw new ApiError(404, `/plates/${id}`);
  },
  tickets: async () => (await localProvider()).listTickets(await getUserId()),
  gate: async (e) => (await localProvider()).gateEvent(e),
};

const backend = (): Api => (getMode() === 'demo' ? local : remote);

/** Every screen calls this; it follows the current data mode (Settings). */
export const api: Api = {
  malls: (o) => backend().malls(o),
  mall: (id, sort) => backend().mall(id, sort),
  floor: (id) => backend().floor(id),
  search: (q, lang, o) => backend().search(q, lang, o),
  plates: () => backend().plates(),
  addPlate: (n, p) => backend().addPlate(n, p),
  deletePlate: (id) => backend().deletePlate(id),
  tickets: () => backend().tickets(),
  gate: (e) => backend().gate(e),
};
