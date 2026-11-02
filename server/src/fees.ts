import type { FeeRule } from './types.js';

/** Parking fee in THB (FR-8, FR-23). Every started hour after the free period is charged in full. */
export function calculateFee(rule: FeeRule, minutes: number, validated = false): number {
  if (!Number.isFinite(minutes) || minutes < 0) throw new RangeError('minutes must be a number >= 0');
  const free = validated ? rule.free_minutes_with_purchase : rule.free_minutes;
  if (minutes <= free) return 0;
  return Math.ceil((minutes - free) / 60) * rule.hourly_thb;
}
