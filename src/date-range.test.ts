import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultDateRange, parseDateRange } from './date-range.js';

test('builds a complete 30-day default range ending yesterday', () => {
  assert.deepEqual(defaultDateRange(new Date('2026-09-15T10:00:00Z')), {
    startDate: '2026-08-16',
    endDate: '2026-09-14',
  });
});

test('rejects reversed and oversized ranges', () => {
  assert.throws(() => parseDateRange('2026-09-10', '2026-09-01', 366));
  assert.throws(() => parseDateRange('2024-01-01', '2026-01-01', 366));
});

