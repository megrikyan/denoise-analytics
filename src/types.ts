export type SourceName = 'googleAnalytics' | 'googleAds' | 'searchConsole' | 'altegio';

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
  disabled?: boolean;
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

export interface AltegioNamedMetric {
  name: string;
  value: number;
}

export interface AltegioPaymentSummary {
  cash: number;
  cashless: number;
  other: number;
  total: number;
  cashTransactions: number;
  cashlessTransactions: number;
  otherTransactions: number;
}

export interface AltegioReport {
  summary: {
    revenue: number;
    previousRevenue: number;
    revenueChangePercent: number;
    serviceRevenue: number;
    productRevenue: number;
    averageCheck: number;
    occupancyPercent: number;
    previousOccupancyPercent: number;
    totalAppointments: number;
    previousTotalAppointments: number;
    appointmentChangePercent: number;
    onlineAppointments: number;
    newClientAppointments: number;
    completedAppointments: number;
    pendingAppointments: number;
    canceledAppointments: number;
    noShows: number;
  };
  payments: AltegioPaymentSummary;
  sources: AltegioNamedMetric[];
  statuses: AltegioNamedMetric[];
}

export interface DashboardReport {
  range: DateRange;
  generatedAt: string;
  sources: {
    googleAnalytics: SourceResult<AnalyticsReport>;
    googleAds: SourceResult<AdsReport>;
    searchConsole: SourceResult<SearchConsoleReport>;
    altegio: SourceResult<AltegioReport>;
  };
}
