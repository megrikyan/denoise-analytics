import { existsSync } from 'node:fs';

export interface AppConfig {
  port: number;
  logLevel: string;
  username: string;
  password: string;
  credentialsPath: string;
  ga4PropertyId: string | null;
  searchConsoleEnabled: boolean;
  searchConsoleSiteUrl: string | null;
  googleAdsCustomerId: string | null;
  googleAdsLoginCustomerId: string | null;
  googleAdsApiVersion: string;
  cacheTtlSec: number;
  maxDays: number;
}

function optional(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function positiveInteger(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function booleanValue(name: string, fallback: boolean): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

export function loadConfig(): AppConfig {
  const username = optional('DASHBOARD_USERNAME');
  const password = optional('DASHBOARD_PASSWORD');
  if (!username || !password || password === 'replace-with-a-long-random-password') {
    throw new Error('DASHBOARD_USERNAME and a non-default DASHBOARD_PASSWORD are required.');
  }

  return {
    port: positiveInteger('PORT', 8080),
    logLevel: optional('LOG_LEVEL') ?? 'info',
    username,
    password,
    credentialsPath:
      optional('GOOGLE_APPLICATION_CREDENTIALS') ??
      '/run/secrets/google-service-account.json',
    ga4PropertyId: optional('GA4_PROPERTY_ID'),
    searchConsoleEnabled: booleanValue('SEARCH_CONSOLE_ENABLED', false),
    searchConsoleSiteUrl: optional('SEARCH_CONSOLE_SITE_URL'),
    googleAdsCustomerId: optional('GOOGLE_ADS_CUSTOMER_ID')?.replaceAll('-', '') ?? null,
    googleAdsLoginCustomerId:
      optional('GOOGLE_ADS_LOGIN_CUSTOMER_ID')?.replaceAll('-', '') ?? null,
    googleAdsApiVersion: optional('GOOGLE_ADS_API_VERSION') ?? 'v25',
    cacheTtlSec: positiveInteger('REPORT_CACHE_TTL_SEC', 900),
    maxDays: positiveInteger('REPORT_MAX_DAYS', 366),
  };
}

export function hasGoogleCredentials(config: AppConfig): boolean {
  return existsSync(config.credentialsPath);
}
