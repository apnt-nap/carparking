import type { Availability, Origin } from './types.js';

/** Straight-line distance in km, rounded to 0.1. */
export function distanceKm(a: Origin, b: Origin): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(h)) * 10) / 10;
}

/** FR-2 marker colour. */
export function availability(free: number, total: number): Availability {
  if (total === 0) return 'grey';
  const r = free / total;
  if (r > 0.3) return 'green';
  if (r >= 0.1) return 'amber';
  return 'red';
}
