export type SourceName = 'googleAnalytics' | 'googleAds' | 'searchConsole';

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface DailyPoint {
  date: string;
  sessions?: number;
  users?: number;
  keyEvents?: number;
  spend?: number;
  clicks?: number;
  impressions?: number;
  conversions?: number;
  conversionValue?: number;
  organicClicks?: number;
  organicImpressions?: number;
}

export interface RankedRow {
  name: string;
  secondary?: string;
  sessions?: number;
  keyEvents?: number;
  spend?: number;
  clicks?: number;
  impressions?: number;
  conversions?: number;
  conversionValue?: number;
  organicClicks?: number;
  organicImpressions?: number;
  ctr?: number;
  position?: number;
}

export interface SourceResult<T> {
  configured: boolean;
  fetchedAt?: string;
  data?: T;
  error?: string;
}

export interface AnalyticsReport {
  summary: {
    sessions: number;
    users: number;
    keyEvents: number;
    revenue: number;
  };
  daily: DailyPoint[];
  channels: RankedRow[];
  events: RankedRow[];
}

export interface AdsReport {
  summary: {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    conversionValue: number;
  };
  daily: DailyPoint[];
  campaigns: RankedRow[];
}

export interface SearchConsoleReport {
  summary: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
  daily: DailyPoint[];
  queries: RankedRow[];
  pages: RankedRow[];
}

export interface DashboardReport {
  range: DateRange;
  generatedAt: string;
  sources: {
    googleAnalytics: SourceResult<AnalyticsReport>;
    googleAds: SourceResult<AdsReport>;
    searchConsole: SourceResult<SearchConsoleReport>;
  };
}

