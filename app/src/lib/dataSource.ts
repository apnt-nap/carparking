import { storedValue } from './stored';

/**
 * Where data comes from:
 * - 'demo': the simulator runs on the phone (LocalParkingProvider). No PC or network needed.
 * - 'server': the mock server on a PC (npm run server), over HTTP and WebSocket.
 * Demo is the default unless EXPO_PUBLIC_API_URL is set. Users can switch in Settings.
 */
export type DataMode = 'demo' | 'server';

export const DEFAULT_MODE: DataMode = process.env.EXPO_PUBLIC_API_URL ? 'server' : 'demo';

let current: DataMode = DEFAULT_MODE;
const store = storedValue<DataMode>('app.dataMode');

export const getMode = (): DataMode => current;

export async function setMode(mode: DataMode) {
  current = mode;
  await store.set(mode);
}

/** The active mode, or undefined until the saved choice has loaded (the root layout waits for it). */
export function useDataMode(): DataMode | undefined {
  const saved = store.useValue();
  if (saved === undefined) return undefined;
  current = saved ?? DEFAULT_MODE;
  return current;
}
