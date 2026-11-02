import AsyncStorage from '@react-native-async-storage/async-storage';
import { MockParkingProvider, type MockOptions, type MockState } from '../../../server/src/mockProvider';
import type { FloorSpec, GateEvent, GateResult, MallBase, Plate } from '../../../server/src/types';

// The generated data is bundled into the app. require() keeps TypeScript from inferring a type for the 850 KB file.
const MALLS: MallBase[] = require('../../../server/data/malls.json').malls;
const FLOORS: FloorSpec[] = require('../../../server/data/floors.json').floors;

const KEY = 'app.demoState';

// shortcut: Math.random ids are fine for demo data on one phone; use expo-crypto if ids ever leave the device.
const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

/**
 * Demo mode: the same simulator the mock server uses (ParkingProvider, NFR-3), running on the phone.
 * Plates and tickets are saved with AsyncStorage so they survive restarts; bays are re-simulated each launch.
 */
export class LocalParkingProvider extends MockParkingProvider {
  static async create(opts: MockOptions = {}): Promise<LocalParkingProvider> {
    const p = new LocalParkingProvider(MALLS, FLOORS, { newId, ...opts });
    try {
      const saved = await AsyncStorage.getItem(KEY);
      if (saved) p.restore(JSON.parse(saved) as MockState);
    } catch {
      // Unreadable demo data: start empty rather than crash.
    }
    return p;
  }

  private save() {
    return AsyncStorage.setItem(KEY, JSON.stringify(this.snapshot())).catch(() => {});
  }

  override async registerPlate(userId: string, number: string, province: string): Promise<Plate> {
    const plate = await super.registerPlate(userId, number, province);
    await this.save();
    return plate;
  }

  override async deletePlate(userId: string, plateId: string): Promise<boolean> {
    const ok = await super.deletePlate(userId, plateId);
    await this.save();
    return ok;
  }

  override async gateEvent(e: GateEvent): Promise<GateResult> {
    const result = await super.gateEvent(e);
    await this.save();
    return result;
  }
}

let shared: Promise<LocalParkingProvider> | undefined;

/** The app-wide demo provider, created and started on first use. */
export function localProvider(): Promise<LocalParkingProvider> {
  shared ??= LocalParkingProvider.create().then((p) => {
    p.start(3000); // FR-11: same 3 s tick as the server
    return p;
  });
  return shared;
}
