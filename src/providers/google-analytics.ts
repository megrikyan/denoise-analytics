import type { AppConfig } from '../config.js';
import { GoogleClient } from '../google-client.js';
import type { AnalyticsReport, DateRange, DailyPoint, RankedRow } from '../types.js';

interface GaValue { value?: string }
interface GaRow { dimensionValues?: GaValue[]; metricValues?: GaValue[] }
interface GaReport { rows?: GaRow[] }
interface GaBatchResponse { reports?: GaReport[] }

const numberAt = (row: GaRow, index: number): number =>
  Number(row.metricValues?.[index]?.value ?? 0);

export async function fetchGoogleAnalytics(
  config: AppConfig,
  range: DateRange,
): Promise<AnalyticsReport> {
  if (!config.ga4PropertyId) throw new Error('GA4_PROPERTY_ID is not configured.');
  const client = new GoogleClient(config.credentialsPath, [
    'https://www.googleapis.com/auth/analytics.readonly',
  ]);
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(config.ga4PropertyId)}:batchRunReports`;
  const dateRanges = [{ startDate: range.startDate, endDate: range.endDate }];
  const response = await client.request<GaBatchResponse>(url, {
    method: 'POST',
    body: JSON.stringify({
      requests: [
        {
          dateRanges,
          dimensions: [{ name: 'date' }],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'keyEvents' },
            { name: 'totalRevenue' },
          ],
          orderBys: [{ dimension: { dimensionName: 'date' } }],
        },
        {
          dateRanges,
          dimensions: [{ name: 'sessionDefaultChannelGroup' }],
          metrics: [
            { name: 'sessions' },
            { name: 'keyEvents' },
            { name: 'totalRevenue' },
          ],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: '25',
        },
        {
          dateRanges,
          dimensions: [{ name: 'eventName' }],
          metrics: [{ name: 'eventCount' }, { name: 'keyEvents' }],
          orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
          limit: '50',
        },
      ],
    }),
  });
  const dailyRows = response.reports?.[0]?.rows ?? [];
  const daily: DailyPoint[] = dailyRows.map((row) => ({
    date: row.dimensionValues?.[0]?.value ?? '',
    sessions: numberAt(row, 0),
    users: numberAt(row, 1),
    keyEvents: numberAt(row, 2),
  }));
  const summary = dailyRows.reduce(
    (total, row) => ({
      sessions: total.sessions + numberAt(row, 0),
      users: total.users + numberAt(row, 1),
      keyEvents: total.keyEvents + numberAt(row, 2),
      revenue: total.revenue + numberAt(row, 3),
    }),
    { sessions: 0, users: 0, keyEvents: 0, revenue: 0 },
  );
  const channels: RankedRow[] = (response.reports?.[1]?.rows ?? []).map((row) => ({
    name: row.dimensionValues?.[0]?.value ?? '(not set)',
    sessions: numberAt(row, 0),
    keyEvents: numberAt(row, 1),
  }));
  const events: RankedRow[] = (response.reports?.[2]?.rows ?? []).map((row) => ({
    name: row.dimensionValues?.[0]?.value ?? '(not set)',
    sessions: numberAt(row, 0),
    keyEvents: numberAt(row, 1),
  }));
  return { summary, daily, channels, events };
}

