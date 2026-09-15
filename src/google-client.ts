import { GoogleAuth } from 'google-auth-library';

export class GoogleClient {
  private readonly auth: GoogleAuth;

  constructor(credentialsPath: string, scopes: string[]) {
    this.auth = new GoogleAuth({ keyFile: credentialsPath, scopes });
  }

  async request<T>(
    url: string,
    init: RequestInit = {},
    extraHeaders: Record<string, string> = {},
  ): Promise<T> {
    const client = await this.auth.getClient();
    const tokenResult = await client.getAccessToken();
    const token = typeof tokenResult === 'string' ? tokenResult : tokenResult.token;
    if (!token) throw new Error('Google OAuth did not return an access token.');

    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...extraHeaders,
        ...(init.headers ?? {}),
      },
      signal: init.signal ?? AbortSignal.timeout(30_000),
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Google API ${response.status}: ${text.slice(0, 500)}`);
    }
    return (text ? JSON.parse(text) : {}) as T;
  }
}

