import type { AppConfig } from '../config.js';
import { GoogleClient } from '../google-client.js';
import type { AdsReport, DateRange, DailyPoint, RankedRow } from '../types.js';

interface AdsResult {
  campaign?: { id?: string; name?: string; status?: string };
  segments?: { date?: string };
  metrics?: {
    costMicros?: string;
    impressions?: string;
    clicks?: string;
    conversions?: number;
    conversionsValue?: number;
  };
}
interface AdsChunk { results?: AdsResult[] }

const micros = (value?: string): number => Number(value ?? 0) / 1_000_000;

export async function fetchGoogleAds(config: AppConfig, range: DateRange): Promise<AdsReport> {
  if (!config.googleAdsCustomerId) {
    throw new Error('GOOGLE_ADS_CUSTOMER_ID is not configured.');
  }
  const client = new GoogleClient(config.credentialsPath, [
    'https://www.googleapis.com/auth/adwords',
  ]);
  const url = `https://googleads.googleapis.com/${config.googleAdsApiVersion}/customers/${config.googleAdsCustomerId}/googleAds:searchStream`;
  const query = `
    SELECT
      segments.date,
      campaign.id,
      campaign.name,
      campaign.status,
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      metrics.conversions_value
    FROM campaign
    WHERE segments.date BETWEEN '${range.startDate}' AND '${range.endDate}'
      AND campaign.status != 'REMOVED'
    ORDER BY segments.date
  `;
  const headers: Record<string, string> = {};
  if (config.googleAdsLoginCustomerId) {
    headers['login-customer-id'] = config.googleAdsLoginCustomerId;
  }
  const chunks = await client.request<AdsChunk[]>(url, {
    method: 'POST',
    body: JSON.stringify({ query }),
  }, headers);
  const results = chunks.flatMap((chunk) => chunk.results ?? []);
  const summary = results.reduce(
    (total, row) => ({
      spend: total.spend + micros(row.metrics?.costMicros),
      impressions: total.impressions + Number(row.metrics?.impressions ?? 0),
      clicks: total.clicks + Number(row.metrics?.clicks ?? 0),
      conversions: total.conversions + Number(row.metrics?.conversions ?? 0),
      conversionValue: total.conversionValue + Number(row.metrics?.conversionsValue ?? 0),
    }),
    { spend: 0, impressions: 0, clicks: 0, conversions: 0, conversionValue: 0 },
  );
  const byDate = new Map<string, DailyPoint>();
  const byCampaign = new Map<string, RankedRow>();
  for (const row of results) {
    const date = row.segments?.date ?? '';
    const day = byDate.get(date) ?? { date, spend: 0, clicks: 0, impressions: 0, conversions: 0, conversionValue: 0 };
    day.spend = (day.spend ?? 0) + micros(row.metrics?.costMicros);
    day.clicks = (day.clicks ?? 0) + Number(row.metrics?.clicks ?? 0);
    day.impressions = (day.impressions ?? 0) + Number(row.metrics?.impressions ?? 0);
    day.conversions = (day.conversions ?? 0) + Number(row.metrics?.conversions ?? 0);
    day.conversionValue = (day.conversionValue ?? 0) + Number(row.metrics?.conversionsValue ?? 0);
    byDate.set(date, day);

    const key = row.campaign?.id ?? row.campaign?.name ?? 'unknown';
    const campaign = byCampaign.get(key) ?? {
      name: row.campaign?.name ?? key,
      secondary: row.campaign?.status ?? '',
      spend: 0,
      clicks: 0,
      impressions: 0,
      conversions: 0,
      conversionValue: 0,
    };
    campaign.spend = (campaign.spend ?? 0) + micros(row.metrics?.costMicros);
    campaign.clicks = (campaign.clicks ?? 0) + Number(row.metrics?.clicks ?? 0);
    campaign.impressions = (campaign.impressions ?? 0) + Number(row.metrics?.impressions ?? 0);
    campaign.conversions = (campaign.conversions ?? 0) + Number(row.metrics?.conversions ?? 0);
    campaign.conversionValue = (campaign.conversionValue ?? 0) + Number(row.metrics?.conversionsValue ?? 0);
    byCampaign.set(key, campaign);
  }
  const campaigns = [...byCampaign.values()].sort((a, b) => (b.spend ?? 0) - (a.spend ?? 0));
  return { summary, daily: [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)), campaigns };
}
