import type { AppConfig } from './config.js';
import { hasGoogleCredentials } from './config.js';
import { fetchGoogleAds } from './providers/google-ads.js';
import { fetchGoogleAnalytics } from './providers/google-analytics.js';
import { fetchSearchConsole } from './providers/search-console.js';
import type { DashboardReport, DateRange, SourceResult } from './types.js';

interface CacheEntry { expiresAt: number; report: DashboardReport }

export class DashboardService {
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly config: AppConfig) {}

  status() {
    const credentials = hasGoogleCredentials(this.config);
    return {
      googleCredentials: credentials,
      googleAnalytics: credentials && Boolean(this.config.ga4PropertyId),
      googleAds:
        credentials &&
        Boolean(this.config.googleAdsCustomerId),
      searchConsole: credentials && Boolean(this.config.searchConsoleSiteUrl),
    };
  }

  async report(range: DateRange, refresh = false): Promise<DashboardReport> {
    const key = `${range.startDate}:${range.endDate}`;
    const cached = this.cache.get(key);
    if (!refresh && cached && cached.expiresAt > Date.now()) return cached.report;

    const status = this.status();
    const [googleAnalytics, googleAds, searchConsole] = await Promise.all([
      this.runSource(status.googleAnalytics, () => fetchGoogleAnalytics(this.config, range)),
      this.runSource(status.googleAds, () => fetchGoogleAds(this.config, range)),
      this.runSource(status.searchConsole, () => fetchSearchConsole(this.config, range)),
    ]);
    const report: DashboardReport = {
      range,
      generatedAt: new Date().toISOString(),
      sources: { googleAnalytics, googleAds, searchConsole },
    };
    this.cache.set(key, {
      expiresAt: Date.now() + this.config.cacheTtlSec * 1000,
      report,
    });
    return report;
  }

  private async runSource<T>(configured: boolean, load: () => Promise<T>): Promise<SourceResult<T>> {
    if (!configured) return { configured: false };
    try {
      return { configured: true, fetchedAt: new Date().toISOString(), data: await load() };
    } catch (error) {
      return {
        configured: true,
        fetchedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown provider error.',
      };
    }
  }
}
