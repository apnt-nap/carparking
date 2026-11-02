// Data model from SYSTEM_REQUIREMENTS.md §5. Geometry is in metres.

export type Lang = 'th' | 'en';
export type BayType = 'normal' | 'ev' | 'accessible' | 'family';
export type BayStatus = 'free' | 'taken';
export type Availability = 'green' | 'amber' | 'red' | 'grey';

export interface FeeRule {
  free_minutes: number;
  free_minutes_with_purchase: number;
  hourly_thb: number;
  summary_th: string;
  summary_en: string;
}

export interface Level {
  level: string;
  name_th: string;
  name_en: string;
}

/** A mall as stored in data/malls.json. */
export interface MallBase {
  id: string;
  name_th: string;
  name_en: string;
  brand: string;
  branch_th: string;
  branch_en: string;
  area_th: string;
  area_en: string;
  aliases: string[];
  lat: number;
  lng: number;
  address_th: string;
  address_en: string;
  hours: { open: string; close: string };
  fees: FeeRule;
  levels: Level[]; // ordered: index 0 is the floor closest to the mall entrance
}

export interface Rect { x: number; y: number; w: number; h: number }
export interface LaneNode { id: string; x: number; y: number }
/** Driving direction is from → to when one_way is true. */
export interface LaneEdge { from: string; to: string; one_way: boolean }
export interface Ramp extends Rect { id: string; kind: 'entry' | 'exit'; node: string; label_th: string; label_en: string }
export interface Lobby extends Rect { id: string; node: string; label_th: string; label_en: string }

export interface FloorPlan {
  width: number;
  height: number;
  outline: Rect;
  nodes: LaneNode[];
  edges: LaneEdge[];
  ramps: Ramp[];
  lobbies: Lobby[];
}

/** A bay as generated; status is added at runtime by the provider. */
export interface BaySpec extends Rect {
  id: string;
  floor_id: string;
  zone: string;
  zone_name_th: string;
  zone_name_en: string;
  rotation: number;
  type: BayType;
  node: string; // lane node a car stops at to enter this bay
  lift_distance_m: number;
}

export interface Bay extends BaySpec {
  status: BayStatus;
  updated_at: string;
}

export interface FloorSpec {
  id: string;
  mall_id: string;
  level: string;
  order: number;
  name_th: string;
  name_en: string;
  plan: FloorPlan;
  bays: BaySpec[];
}

export interface Plate {
  id: string;
  user_id: string;
  number: string;
  province: string;
  consent_at: string;
}

export interface Ticket {
  id: string;
  plate_id: string;
  mall_id: string;
  entry_at: string;
  exit_at: string | null;
  fee_thb: number;
  validated: boolean;
  status: 'open' | 'paid' | 'closed';
}

export interface Origin { lat: number; lng: number }

export interface Counts { free: number; total: number }

export interface MallSummary {
  id: string;
  name_th: string;
  name_en: string;
  brand: string;
  branch_th: string;
  branch_en: string;
  lat: number;
  lng: number;
  distance_km: number | null;
  free: number;
  total: number;
  availability: Availability;
  fees_summary_th: string;
  fees_summary_en: string;
}

export interface FloorSummary {
  id: string;
  level: string;
  order: number;
  name_th: string;
  name_en: string;
  free: number;
  total: number;
  best_choice: boolean;
  special: Record<'ev' | 'accessible' | 'family', Counts>;
}

export interface MallDetail extends Omit<MallBase, 'levels' | 'aliases'> {
  free: number;
  total: number;
  availability: Availability;
  floors: FloorSummary[];
}

export interface FloorDetail extends Omit<FloorSpec, 'bays'> {
  bays: Bay[];
}

export interface BayChange {
  bay_id: string;
  floor_id: string;
  mall_id: string;
  status: BayStatus;
  updated_at: string;
}

export interface GateEvent {
  mall_id: string;
  plate_number: string;
  province: string;
  direction: 'entry' | 'exit';
  validated?: boolean;
  at?: Date;
}

/** fallback_ticket = use the normal ticket machine (FR-24). */
export type GateResult =
  | { action: 'open_gate'; ticket: Ticket }
  | { action: 'fallback_ticket'; reason: 'unregistered' | 'no_open_ticket' | 'unknown_mall' };
