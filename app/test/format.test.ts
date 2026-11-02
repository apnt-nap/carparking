import i18n from '../src/lib/i18n';
import type { MallSummary, Ticket } from '../src/lib/api';
import { clock, currentTicket, duration, history, nearestThree, priceText, spots } from '../src/lib/format';

const tk = (id: string, entry: string, exit: string | null): Ticket => ({
  id, plate_id: 'p', mall_id: 'm', entry_at: entry, exit_at: exit, fee_thb: 40, validated: false,
  status: exit ? 'closed' : 'open', paid_thb: exit ? 40 : 0, paid_at: exit, paid_from: exit ? 'wallet' : null,
});

const mall = (id: string, distance_km: number | null, total = 100, free = 50): MallSummary => ({
  id, name_th: id, name_en: id, brand: '', branch_th: '', branch_en: '', lat: 0, lng: 0, distance_km, free, total,
  availability: 'green', fees_summary_th: '', fees_summary_en: '', area_th: '', area_en: '', hours: { open: '10:00', close: '22:00' },
  fees: { free_minutes: 15, free_minutes_with_purchase: 120, hourly_thb: 20, summary_th: '', summary_en: '' },
});

beforeAll(() => i18n.changeLanguage('en'));

describe('format helpers', () => {
  it('clock shows hh:mm:ss (UI-35)', () => {
    expect(clock((1 * 3600 + 50 * 60 + 59) * 1000)).toBe('01:50:59');
    expect(clock(-5)).toBe('00:00:00');
    expect(duration(130 * 60000, i18n.t)).toBe('2 h 10 min');
  });

  it('price text for cards and search (UI-41)', () => {
    expect(priceText(mall('a', 1).fees, i18n.t)).toBe('20 ฿/hr · first 2 hr free with purchase');
  });

  it('history lists finished visits newest first (UI-40)', () => {
    const list = [tk('old', '2026-11-01T03:00:00Z', '2026-11-01T05:00:00Z'), tk('open', '2026-11-03T03:00:00Z', null), tk('new', '2026-11-02T03:00:00Z', '2026-11-02T04:00:00Z')];
    expect(history(list).map((x) => x.id)).toEqual(['new', 'old']);
  });

  it('the session card shows the open ticket, else a recent finished one (UI-36)', () => {
    const now = Date.parse('2026-11-02T06:00:00Z');
    expect(currentTicket([tk('done', '2026-11-02T03:00:00Z', '2026-11-02T04:00:00Z'), tk('open', '2026-11-02T05:00:00Z', null)], now)!.id).toBe('open');
    expect(currentTicket([tk('done', '2026-11-02T03:00:00Z', '2026-11-02T04:00:00Z')], now)!.id).toBe('done');
    expect(currentTicket([tk('done', '2026-10-30T03:00:00Z', '2026-10-30T04:00:00Z')], now)).toBeUndefined();
  });

  it('nearestThree: closest first; without location, recent searches then biggest malls (UI-5)', () => {
    expect(nearestThree([mall('far', 9), mall('near', 0.4), mall('mid', 3), mall('mid2', 3.4)]).map((m) => m.id)).toEqual(['near', 'mid', 'mid2']);
    const noLoc = [mall('small', null, 50), mall('big', null, 900), mall('recent', null, 10), mall('medium', null, 300)];
    expect(nearestThree(noLoc, ['recent']).map((m) => m.id)).toEqual(['recent', 'big', 'medium']);
  });

  it('spots always has words, not just colour (UI-43)', () => {
    expect(spots({ free: 12, availability: 'green' }, i18n.t)).toEqual({ text: '12 spots available', level: 'green' });
    expect(spots({ free: 0, availability: 'red' }, i18n.t)).toEqual({ text: 'Full', level: 'red' });
  });
});
