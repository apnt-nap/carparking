import AsyncStorage from '@react-native-async-storage/async-storage';
import { MockParkingProvider, type MockOptions, type MockState } from '../../../server/src/mockProvider';
import type {
  CarDetails, FloorSpec, GateEvent, GateResult, MallBase, PayMethod, Plate, PublicAccount, Ticket, WalletView,
} from '../../../server/src/types';

// The generated data is bundled into the app. require() keeps TypeScript from inferring a type for the 850 KB file.
const MALLS: MallBase[] = require('../../../server/data/malls.json').malls;
const FLOORS: FloorSpec[] = require('../../../server/data/floors.json').floors;

const KEY = 'app.demoState';

// shortcut: Math.random ids are fine for demo data on one phone; use expo-crypto if ids ever leave the device.
const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

/** SHA-256 for demo passwords: expo-crypto on the phone, Web Crypto in tests. */
async function sha256(text: string): Promise<string> {
  try {
    const Crypto = require('expo-crypto') as typeof import('expo-crypto');
    const hex = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, text);
    // A stubbed or broken module must never produce a "hash" that matches every password.
    if (typeof hex === 'string' && /^[0-9a-f]{64}$/i.test(hex)) return hex.toLowerCase();
  } catch {
    // fall through to Web Crypto
  }
  if (!globalThis.crypto?.subtle) throw new Error('No SHA-256 available');
  const buf = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Demo mode: the same simulator the mock server uses (ParkingProvider, NFR-3), running on the phone.
 * Plates and tickets are saved with AsyncStorage so they survive restarts; bays are re-simulated each launch.
 */
export class LocalParkingProvider extends MockParkingProvider {
  static async create(opts: MockOptions = {}): Promise<LocalParkingProvider> {
    const p = new LocalParkingProvider(MALLS, FLOORS, { newId, sha256, ...opts });
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

  /** Runs a change, then saves to the phone (even if the change threw after partly applying). */
  private async saved<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } finally {
      await this.save();
    }
  }

  override registerPlate(userId: string, number: string, province: string, car?: CarDetails): Promise<Plate> {
    return this.saved(() => super.registerPlate(userId, number, province, car));
  }

  override signUp(email: string, password: string, displayName: string): Promise<PublicAccount> {
    return this.saved(() => super.signUp(email, password, displayName));
  }

  override topUp(accountId: string, amount: number, method: Exclude<PayMethod, 'wallet'>): Promise<WalletView> {
    return this.saved(() => super.topUp(accountId, amount, method));
  }

  override payTicket(accountId: string, ticketId: string): Promise<Ticket> {
    return this.saved(() => super.payTicket(accountId, ticketId));
  }

  override addDemoTicket(accountId: string, plateId: string, mallId: string, minutesAgo: number): Promise<Ticket> {
    return this.saved(() => super.addDemoTicket(accountId, plateId, mallId, minutesAgo));
  }

  override reset(): void {
    super.reset();
    void this.save();
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
