import type { DateRange } from './types.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function defaultDateRange(now = new Date()): DateRange {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 29);
  return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
}

export function parseDateRange(
  startDate: unknown,
  endDate: unknown,
  maxDays: number,
  now = new Date(),
): DateRange {
  const fallback = defaultDateRange(now);
  const start = typeof startDate === 'string' && startDate ? startDate : fallback.startDate;
  const end = typeof endDate === 'string' && endDate ? endDate : fallback.endDate;
  if (!ISO_DATE.test(start) || !ISO_DATE.test(end)) {
    throw new Error('Dates must use YYYY-MM-DD.');
  }
  const startMs = Date.parse(`${start}T00:00:00Z`);
  const endMs = Date.parse(`${end}T00:00:00Z`);
  const days = Math.floor((endMs - startMs) / 86_400_000) + 1;
  if (!Number.isFinite(days) || days < 1 || days > maxDays) {
    throw new Error(`Date range must contain between 1 and ${maxDays} days.`);
  }
  return { startDate: start, endDate: end };
}

