import type { AppConfig } from '../config.js';
import { GoogleClient } from '../google-client.js';
import type { DateRange, DailyPoint, RankedRow, SearchConsoleReport } from '../types.js';

interface SearchRow {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}
interface SearchResponse { rows?: SearchRow[] }

export async function fetchSearchConsole(
  config: AppConfig,
  range: DateRange,
): Promise<SearchConsoleReport> {
  if (!config.searchConsoleSiteUrl) throw new Error('SEARCH_CONSOLE_SITE_URL is not configured.');
  const client = new GoogleClient(config.credentialsPath, [
    'https://www.googleapis.com/auth/webmasters.readonly',
  ]);
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(config.searchConsoleSiteUrl)}/searchAnalytics/query`;
  const query = (dimensions: string[], rowLimit: number) =>
    client.request<SearchResponse>(url, {
      method: 'POST',
      body: JSON.stringify({
        startDate: range.startDate,
        endDate: range.endDate,
        dimensions,
        type: 'web',
        aggregationType: dimensions.includes('page') ? 'auto' : 'byProperty',
        dataState: 'final',
        rowLimit,
      }),
    });
  const [dailyResponse, queryResponse, pageResponse, summaryResponse] = await Promise.all([
    query(['date'], 500),
    query(['query'], 50),
    query(['page'], 50),
    query([], 1),
  ]);
  const summaryRow = summaryResponse.rows?.[0];
  const summary = {
    clicks: summaryRow?.clicks ?? 0,
    impressions: summaryRow?.impressions ?? 0,
    ctr: summaryRow?.ctr ?? 0,
    position: summaryRow?.position ?? 0,
  };
  const daily: DailyPoint[] = (dailyResponse.rows ?? []).map((row) => ({
    date: row.keys?.[0] ?? '',
    organicClicks: row.clicks ?? 0,
    organicImpressions: row.impressions ?? 0,
  }));
  const ranked = (rows: SearchRow[]): RankedRow[] => rows.map((row) => ({
    name: row.keys?.[0] ?? '(not set)',
    organicClicks: row.clicks ?? 0,
    organicImpressions: row.impressions ?? 0,
    ctr: row.ctr ?? 0,
    position: row.position ?? 0,
  }));
  return {
    summary,
    daily,
    queries: ranked(queryResponse.rows ?? []),
    pages: ranked(pageResponse.rows ?? []),
  };
}

