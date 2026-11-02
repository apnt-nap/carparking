import { readFileSync } from 'node:fs';
import { MockParkingProvider, type MockOptions } from './mockProvider.js';

/** Builds the simulator from data/malls.json and data/floors.json (Node only; the app bundles the JSON instead). */
export function loadMockProvider(dataDir: URL, opts?: MockOptions): MockParkingProvider {
  const read = (name: string) => JSON.parse(readFileSync(new URL(name, dataDir), 'utf8'));
  return new MockParkingProvider(read('malls.json').malls, read('floors.json').floors, opts);
}
