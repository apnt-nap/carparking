import { storedValue } from './stored';

/** FR-15: the bay the user said they parked in. */
export interface ParkedSpot {
  mall_id: string;
  mall_name_th: string;
  mall_name_en: string;
  floor_id: string;
  bay_id: string;
  zone_name_th: string;
  zone_name_en: string;
  saved_at: string;
}

const store = storedValue<ParkedSpot>('app.parked');
export const saveParked = store.set;

/** Current parked spot, kept in sync across screens. */
export function useParked() {
  return { parked: store.useValue() ?? null, save: saveParked };
}
