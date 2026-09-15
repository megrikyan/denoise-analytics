import { readFileSync } from 'node:fs';
import type { AppConfig } from '../config.js';
import type { AltegioNamedMetric, AltegioReport, DateRange } from '../types.js';

interface AltegioCredentials {
  partnerToken: string;
  userToken: string;
  companyId: number;
}

interface SumStats {
  current_sum?: string | number;
  previous_sum?: string | number;
  change_percent?: number;
}

interface OverallEnvelope {
  success?: boolean;
  data?: {
    income_total_stats?: SumStats;
    income_services_stats?: SumStats;
    income_goods_stats?: SumStats;
    income_average_stats?: SumStats;
    fullness_stats?: {
      current_percent?: number;
      previous_percent?: number;
    };
    record_stats?: {
      current_completed_count?: number;
      current_pending_count?: number;
      current_canceled_count?: number;
      current_total_count?: number;
      previous_total_count?: number;
      change_percent?: number;
    };
  };
  meta?: { message?: string } | Array<unknown>;
}

interface DailySeries {
  label?: string;
  data?: Array<[string, number]>;
}

interface ScalarSeries {
  label?: string;
  data?: number;
}

function numberValue(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function loadCredentials(path: string): AltegioCredentials {
  const value = JSON.parse(readFileSync(path, 'utf8')) as Partial<AltegioCredentials>;
  if (
    typeof value.partnerToken !== 'string' ||
    !value.partnerToken ||
    typeof value.userToken !== 'string' ||
    !value.userToken ||
    !Number.isInteger(value.companyId) ||
    numberValue(value.companyId) <= 0
  ) {
    throw new Error('Altegio credentials file is invalid.');
  }
  return value as AltegioCredentials;
}

function errorMessage(body: unknown): string {
  if (!body || typeof body !== 'object') return '';
  const value = body as { message?: unknown; meta?: { message?: unknown } };
  if (typeof value.meta?.message === 'string') return value.meta.message;
  return typeof value.message === 'string' ? value.message : '';
}

async function request<T>(path: string, credentials: AltegioCredentials): Promise<T> {
  const response = await fetch(`https://api.alteg.io/api/v1${path}`, {
    headers: {
      Accept: 'application/vnd.api.v2+json',
      Authorization: `Bearer ${credentials.partnerToken}, User ${credentials.userToken}`,
    },
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await response.json().catch(() => null)) as T | null;
  if (!response.ok || body === null) {
    const detail = errorMessage(body);
    throw new Error(`Altegio API returned ${response.status}${detail ? `: ${detail}` : ''}.`);
  }
  return body;
}

function totalSeries(rows: DailySeries[], patterns: RegExp[], fallbackIndex: number): number {
  const series =
    rows.find((row) => patterns.some((pattern) => pattern.test(row.label ?? ''))) ??
    rows[fallbackIndex];
  return (series?.data ?? []).reduce((sum, point) => sum + numberValue(point[1]), 0);
}

function namedMetrics(rows: ScalarSeries[]): AltegioNamedMetric[] {
  return rows
    .map((row) => ({ name: row.label?.trim() || 'Unknown', value: numberValue(row.data) }))
    .filter((row) => row.value > 0)
    .sort((left, right) => right.value - left.value);
}

export function composeAltegioReport(
  overall: OverallEnvelope,
  appointmentSeries: DailySeries[],
  sourceSeries: ScalarSeries[],
  statusSeries: ScalarSeries[],
): AltegioReport {
  if (!overall.success || !overall.data) throw new Error('Altegio overall report is invalid.');
  const stats = overall.data;
  const record = stats.record_stats ?? {};
  const statuses = namedMetrics(statusSeries);
  const noShows = statuses.find((row) => /no[ -]?show/i.test(row.name))?.value ?? 0;

  return {
    summary: {
      revenue: numberValue(stats.income_total_stats?.current_sum),
      previousRevenue: numberValue(stats.income_total_stats?.previous_sum),
      revenueChangePercent: numberValue(stats.income_total_stats?.change_percent),
      serviceRevenue: numberValue(stats.income_services_stats?.current_sum),
      productRevenue: numberValue(stats.income_goods_stats?.current_sum),
      averageCheck: numberValue(stats.income_average_stats?.current_sum),
      occupancyPercent: numberValue(stats.fullness_stats?.current_percent),
      previousOccupancyPercent: numberValue(stats.fullness_stats?.previous_percent),
      totalAppointments: numberValue(record.current_total_count),
      previousTotalAppointments: numberValue(record.previous_total_count),
      appointmentChangePercent: numberValue(record.change_percent),
      onlineAppointments: totalSeries(appointmentSeries, [/online bookings?/i], 1),
      newClientAppointments: totalSeries(appointmentSeries, [/new clients?/i], 2),
      completedAppointments: numberValue(record.current_completed_count),
      pendingAppointments: numberValue(record.current_pending_count),
      canceledAppointments: numberValue(record.current_canceled_count),
      noShows,
    },
    sources: namedMetrics(sourceSeries),
    statuses,
  };
}

export async function fetchAltegio(
  config: AppConfig,
  range: DateRange,
): Promise<AltegioReport> {
  const credentials = loadCredentials(config.altegioCredentialsPath);
  const query = new URLSearchParams({ date_from: range.startDate, date_to: range.endDate });
  const prefix = `/company/${credentials.companyId}/analytics/overall`;

  // Keep these sequential to stay comfortably below Altegio's per-second rate limit.
  const overall = await request<OverallEnvelope>(`${prefix}?${query}`, credentials);
  const appointments = await request<DailySeries[]>(
    `${prefix}/charts/records_daily?${query}`,
    credentials,
  );
  const sources = await request<ScalarSeries[]>(
    `${prefix}/charts/record_source?${query}`,
    credentials,
  );
  const statuses = await request<ScalarSeries[]>(
    `${prefix}/charts/record_status?${query}`,
    credentials,
  );

  return composeAltegioReport(overall, appointments, sources, statuses);
}
