import type {
  BayChange, FloorDetail, GateEvent, GateResult, Lang, MallDetail, MallSummary, Origin, Plate, Ticket,
} from './types.js';

/**
 * The only way the API reaches parking data (NFR-3). The simulator implements it today;
 * a real mall or sensor feed would implement the same interface.
 */
export interface ParkingProvider {
  listMalls(origin?: Origin): Promise<MallSummary[]>;
  getMall(id: string, sort?: 'free' | 'order'): Promise<MallDetail | undefined>;
  getFloor(id: string): Promise<FloorDetail | undefined>;
  search(q: string, lang: Lang, origin?: Origin): Promise<MallSummary[]>;
  /** Returns an unsubscribe function. */
  onBayChanges(listener: (changes: BayChange[]) => void): () => void;

  // Phase 2 (FR-21 to FR-25)
  registerPlate(userId: string, number: string, province: string): Promise<Plate>;
  listPlates(userId: string): Promise<Plate[]>;
  deletePlate(userId: string, plateId: string): Promise<boolean>;
  gateEvent(event: GateEvent): Promise<GateResult>;
  listTickets(userId: string): Promise<Ticket[]>;
}
