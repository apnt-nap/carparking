import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

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

const KEY = 'app.parked';
const listeners = new Set<(p: ParkedSpot | null) => void>();

export async function saveParked(p: ParkedSpot | null) {
  if (p) await AsyncStorage.setItem(KEY, JSON.stringify(p));
  else await AsyncStorage.removeItem(KEY);
  listeners.forEach((l) => l(p));
}

/** Current parked spot, kept in sync across screens. */
export function useParked() {
  const [parked, setParked] = useState<ParkedSpot | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((s) => setParked(s ? JSON.parse(s) : null)).catch(() => setParked(null));
    listeners.add(setParked);
    return () => { listeners.delete(setParked); };
  }, []);
  return { parked, save: useCallback(saveParked, []) };
}
