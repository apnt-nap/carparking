import type { TFunction } from 'i18next';
import type { FeeRule } from '../../../server/src/types';
import type { MallSummary, Ticket } from './api';

/** "2 hr" / "30 min" (UI-41). */
export function freeTime(minutes: number, t: TFunction): string {
  return minutes % 60 === 0 ? t('price.hours', { count: minutes / 60 }) : t('price.minutes', { count: minutes });
}

/** UI-41: "20 ฿/hr · first 2 hr free with purchase". */
export function priceText(fees: FeeRule, t: TFunction): string {
  return t('price.short', { rate: fees.hourly_thb, free: freeTime(fees.free_minutes_with_purchase, t) });
}

/** Elapsed time as hh:mm:ss (UI-35). Negative inputs show 00:00:00. */
export function clock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

/** "2 h 10 min" (UI-36, UI-40). */
export function duration(ms: number, t: TFunction): string {
  const mins = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? t('time.hm', { h, m }) : t('time.m', { m });
}

export const locale = (lang: string) => (lang === 'th' ? 'th-TH' : 'en-GB');

export function timeOf(iso: string, lang: string): string {
  return new Date(iso).toLocaleTimeString(locale(lang), { hour: '2-digit', minute: '2-digit' });
}

export function dateOf(iso: string, lang: string): string {
  return new Date(iso).toLocaleDateString(locale(lang), { day: 'numeric', month: 'short', year: 'numeric' });
}

/** UI-40: finished visits, newest first. */
export function history(tickets: Ticket[]): Ticket[] {
  return tickets.filter((x) => x.status === 'closed').sort((a, b) => b.entry_at.localeCompare(a.entry_at));
}

/** UI-35/36: the ticket the session card shows: an open one, else the latest closed one from the last 12 hours. */
export function currentTicket(tickets: Ticket[], now: number): Ticket | undefined {
  const open = tickets.filter((x) => x.status === 'open').sort((a, b) => b.entry_at.localeCompare(a.entry_at))[0];
  if (open) return open;
  const last = history(tickets)[0];
  return last && last.exit_at && now - Date.parse(last.exit_at) < 12 * 3600_000 ? last : undefined;
}

/** UI-5: the three closest malls; without a location, recent searches, then the biggest malls. */
export function nearestThree(malls: MallSummary[], recentIds: string[] = []): MallSummary[] {
  if (malls.some((m) => m.distance_km !== null)) {
    return [...malls].sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity)).slice(0, 3);
  }
  const recent = recentIds.map((id) => malls.find((m) => m.id === id)).filter((m): m is MallSummary => !!m);
  const popular = [...malls].sort((a, b) => b.total - a.total).filter((m) => !recent.includes(m));
  return [...recent, ...popular].slice(0, 3);
}

/** UI-43: spots text and level, always words as well as colour. */
export function spots(m: Pick<MallSummary, 'free' | 'availability'>, t: TFunction): { text: string; level: 'green' | 'amber' | 'red' | 'grey' } {
  if (m.availability === 'grey') return { text: t('map.noData'), level: 'grey' };
  if (m.free === 0) return { text: t('map.full'), level: 'red' };
  if (m.availability === 'green') return { text: t('map.spots', { count: m.free }), level: 'green' };
  return { text: t('map.filling', { count: m.free }), level: m.availability };
}
