import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { OidcConfigService } from './oidc-config.service';

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

@Injectable({ providedIn: 'root' })
export class TokenService {
  private accessToken?: string;
  private refreshToken?: string;
  private expiry?: number; // unix seconds

  constructor(private discover: OidcConfigService) {
    // restore from session
    const s = sessionStorage.getItem('oauth_tokens');
    if (s) {
      try {
        const o = JSON.parse(s);
        this.accessToken = o.accessToken;
        this.refreshToken = o.refreshToken;
        this.expiry = o.expiry;
      } catch {}
    }
  }

  get isAuthenticated(): boolean {
    return !!this.accessToken && !!this.expiry && Date.now() / 1000 < this.expiry - 30;
  }

  get bearer(): string | undefined {
    return this.accessToken ? `Bearer ${this.accessToken}` : undefined;
  }

  private save(resp: TokenResponse) {
    this.accessToken = resp.access_token;
    this.refreshToken = resp.refresh_token;
    this.expiry = Math.floor(Date.now() / 1000) + (resp.expires_in ?? 0);
    sessionStorage.setItem('oauth_tokens', JSON.stringify({
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      expiry: this.expiry
    }));
  }

  async exchangeCode(authorizationCode: string, codeVerifier: string): Promise<void> {
    const cfg = await this.discover.load();
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: authorizationCode,
      redirect_uri: environment.oauth.redirectUri,
      client_id: environment.oauth.clientId,
      code_verifier: codeVerifier
    });

    const res = await fetch(cfg.token_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });

    if (!res.ok) {
      const e = await safeJson(res);
      throw new Error(`Token exchange failed: ${res.status} ${JSON.stringify(e)}`);
    }

    const data = (await res.json()) as TokenResponse;
    this.save(data);
  }

  async refresh(): Promise<void> {
    if (!this.refreshToken) throw new Error('No refresh token available');
    const cfg = await this.discover.load();
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.refreshToken
    });

    const res = await fetch(cfg.token_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });

    if (!res.ok) {
      const e = await safeJson(res);
      throw new Error(`Refresh failed: ${res.status} ${JSON.stringify(e)}`);
    }

    const data = (await res.json()) as TokenResponse;
    this.save(data);
  }

  clear() {
    this.accessToken = undefined;
    this.refreshToken = undefined;
    this.expiry = undefined;
    sessionStorage.removeItem('oauth_tokens');
  }
}

async function safeJson(r: Response) {
  try { return await r.json(); } catch { return await r.text(); }
}
