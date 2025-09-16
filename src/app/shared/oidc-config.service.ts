import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface OidcConfig {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  response_types_supported: string[];
  grant_types_supported: string[];
  code_challenge_methods_supported: string[];
}

@Injectable({ providedIn: 'root' })
export class OidcConfigService {
  private _config?: OidcConfig;

  async load(): Promise<OidcConfig> {
    if (this._config) return this._config;

    const url = `${environment.oauth.issuer}/oauth/.well-known/openid-configuration`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`OIDC discovery failed: ${resp.status}`);
    this._config = await resp.json();
    return this._config!;
  }
}
