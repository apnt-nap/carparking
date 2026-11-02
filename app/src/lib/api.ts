import Constants from 'expo-constants';
import type { FloorDetail, MallDetail, MallSummary, Origin } from '../../../server/src/types';

export type { Bay, BayChange, FloorDetail, FloorSummary, Lang, MallDetail, MallSummary, Origin } from '../../../server/src/types';

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
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json() as Promise<T>;
}

const originQuery = (o?: Origin) => (o ? `lat=${o.lat}&lng=${o.lng}` : '');

export const api = {
  malls: (o?: Origin) => get<MallSummary[]>(`/malls?${originQuery(o)}`),
  mall: (id: string, sort: 'free' | 'order') => get<MallDetail>(`/malls/${encodeURIComponent(id)}?sort=${sort}`),
  floor: (id: string) => get<FloorDetail>(`/floors/${encodeURIComponent(id)}`),
  search: (q: string, lang: string, o?: Origin) =>
    get<MallSummary[]>(`/search?q=${encodeURIComponent(q)}&lang=${lang}&${originQuery(o)}`),
};
