import type {
  BayChange, CarDetails, FloorDetail, GateEvent, GateResult, Lang, MallDetail, MallSummary, Origin, PayMethod, Plate,
  PublicAccount, Ticket, WalletView,
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
  registerPlate(userId: string, number: string, province: string, car?: CarDetails): Promise<Plate>;
  listPlates(userId: string): Promise<Plate[]>;
  deletePlate(userId: string, plateId: string): Promise<boolean>;
  gateEvent(event: GateEvent): Promise<GateResult>;
  listTickets(userId: string): Promise<Ticket[]>;

  // Layout v2 (UPDATE_LAYOUT_V2.md A5). Errors are thrown as ProviderError with a code.
  signUp(email: string, password: string, displayName: string): Promise<PublicAccount>;
  logIn(email: string, password: string): Promise<PublicAccount>;
  getWallet(accountId: string): Promise<WalletView>;
  topUp(accountId: string, amountThb: number, method: Exclude<PayMethod, 'wallet'>): Promise<WalletView>;
  payTicket(accountId: string, ticketId: string): Promise<Ticket>;
  /** UI-25: demo e-ticket that started minutesAgo. */
  addDemoTicket(accountId: string, plateId: string, mallId: string, minutesAgo: number): Promise<Ticket>;
}

export type ProviderErrorCode =
  | 'invalid_email' | 'weak_password' | 'invalid_name' | 'email_taken' | 'bad_credentials'
  | 'invalid_amount' | 'invalid_car' | 'not_found' | 'insufficient_balance' | 'nothing_due';

/** Expected business errors; the server and the app map the code to an HTTP-style status. */
export class ProviderError extends Error {
  constructor(readonly code: ProviderErrorCode) {
    super(code);
    this.name = 'ProviderError';
  }
}

export const ERROR_STATUS: Record<ProviderErrorCode, number> = {
  invalid_email: 400, weak_password: 400, invalid_name: 400, invalid_amount: 400, invalid_car: 400,
  email_taken: 409, bad_credentials: 401, not_found: 404, insufficient_balance: 402, nothing_due: 409,
};
