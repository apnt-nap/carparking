import { describe, expect, it } from 'vitest';
import { calculateFee } from '../src/fees.js';
import type { FeeRule } from '../src/types.js';

const rule: FeeRule = { free_minutes: 15, free_minutes_with_purchase: 120, hourly_thb: 20, summary_th: '', summary_en: '' };

describe('calculateFee (FR-8, FR-23)', () => {
  it('is free inside the free period', () => {
    expect(calculateFee(rule, 0)).toBe(0);
    expect(calculateFee(rule, 15)).toBe(0);
  });
  it('charges every started hour after the free period', () => {
    expect(calculateFee(rule, 16)).toBe(20);
    expect(calculateFee(rule, 75)).toBe(20);
    expect(calculateFee(rule, 76)).toBe(40);
  });
  it('uses the longer free period with purchase validation', () => {
    expect(calculateFee(rule, 120, true)).toBe(0);
    expect(calculateFee(rule, 121, true)).toBe(20);
    expect(calculateFee(rule, 121, false)).toBe(40);
  });
  it('rejects negative or invalid durations', () => {
    expect(() => calculateFee(rule, -1)).toThrow(RangeError);
    expect(() => calculateFee(rule, Number.NaN)).toThrow(RangeError);
  });
});
