import { STORE } from '@/config/store';
import type { LanguageCode } from '@/types';
import { localeFor } from './money';

export function addBusinessDays(from: Date, days: number): Date {
  const d = new Date(from);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return d;
}

/** Illustrative delivery window: handling time plus transit time, in business days. */
export function deliveryWindow(minDays: number, maxDays: number, from: Date = new Date()): { start: Date; end: Date } {
  return {
    start: addBusinessDays(from, STORE.handlingDays.min + minDays),
    end: addBusinessDays(from, STORE.handlingDays.max + maxDays),
  };
}

export function formatDate(value: string | Date, language: LanguageCode, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat(localeFor(language), opts).format(d);
}

export function formatShortDate(value: Date, language: LanguageCode): string {
  return formatDate(value, language, { weekday: 'short', day: 'numeric', month: 'short' });
}
