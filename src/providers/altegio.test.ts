import assert from 'node:assert/strict';
import test from 'node:test';
import { composeAltegioReport } from './altegio.js';

test('composes business-safe Altegio aggregates', () => {
  const report = composeAltegioReport(
    {
      success: true,
      data: {
        income_total_stats: { current_sum: '1000.50', previous_sum: '800', change_percent: 25 },
        income_services_stats: { current_sum: '900' },
        income_goods_stats: { current_sum: '100.50' },
        income_average_stats: { current_sum: '50.25' },
        fullness_stats: { current_percent: 42.6, previous_percent: 36.6 },
        record_stats: {
          current_completed_count: 15,
          current_pending_count: 2,
          current_canceled_count: 3,
          current_total_count: 20,
          previous_total_count: 16,
          change_percent: 25,
        },
      },
    },
    [
      { label: 'Number of appointments', data: [['2026-01-01', 20]] },
      { label: 'Number of online bookings', data: [['2026-01-01', 12]] },
      { label: 'Number of appointments from new clients', data: [['2026-01-01', 4]] },
    ],
    [
      { label: 'Receptionist', data: 8 },
      { label: 'Denoise', data: 4 },
    ],
    [
      { label: 'Arrived', data: 15 },
      { label: 'No-show', data: 1 },
    ],
  );

  assert.deepEqual(report.summary, {
    revenue: 1000.5,
    previousRevenue: 800,
    revenueChangePercent: 25,
    serviceRevenue: 900,
    productRevenue: 100.5,
    averageCheck: 50.25,
    occupancyPercent: 42.6,
    previousOccupancyPercent: 36.6,
    totalAppointments: 20,
    previousTotalAppointments: 16,
    appointmentChangePercent: 25,
    onlineAppointments: 12,
    newClientAppointments: 4,
    completedAppointments: 15,
    pendingAppointments: 2,
    canceledAppointments: 3,
    noShows: 1,
  });
  assert.deepEqual(report.sources[0], { name: 'Receptionist', value: 8 });
});
