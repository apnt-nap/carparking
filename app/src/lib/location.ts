import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import type { Origin } from './api';

/** FR-1 fallback when location permission is refused: central Bangkok (Democracy Monument area). */
export const BANGKOK: Origin = { lat: 13.7563, lng: 100.5018 };

let cached: { origin: Origin; granted: boolean } | undefined;

/** The user's position, or central Bangkok if they say no. Asked once per app run. */
export function useUserLocation() {
  const [state, setState] = useState(cached);
  useEffect(() => {
    if (cached) return;
    let alive = true;
    (async () => {
      try {
        const { granted } = await Location.requestForegroundPermissionsAsync();
        if (!granted) throw new Error('denied');
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        cached = { origin: { lat: pos.coords.latitude, lng: pos.coords.longitude }, granted: true };
      } catch {
        cached = { origin: BANGKOK, granted: false };
      }
      if (alive) setState(cached);
    })();
    return () => { alive = false; };
  }, []);
  return state; // undefined while asking
}
