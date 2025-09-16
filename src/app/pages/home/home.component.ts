import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';
import { pkcePair } from '../../shared/pkce';
import { OidcConfigService, OidcConfig } from '../../shared/oidc-config.service';
import { TokenService } from '../../shared/token.service';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  imports:[JsonPipe]
})
export class HomeComponent {
  env = environment;
  cfg?: OidcConfig;
  loading = false;
  error?: string;
  apiResponse?: any;

  constructor(private discover: OidcConfigService, public tokens: TokenService) {}

  async ngOnInit() {
    try {
      this.loading = true;
      this.cfg = await this.discover.load();
    } catch (e: any) {
      this.error = e?.message ?? String(e);
    } finally {
      this.loading = false;
    }
  }

  async signIn() {
    if (!this.cfg) { this.error = 'OIDC config not loaded'; return; }

    const { clientId, redirectUri, scope } = environment.oauth;
    const { authorization_endpoint } = this.cfg;

    const state = crypto.randomUUID();
    const { verifier, challenge, method } = await pkcePair();
    sessionStorage.setItem('pkce_verifier', verifier);
    sessionStorage.setItem('oauth_state', state);

    const url = new URL(authorization_endpoint);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('scope', scope);
    url.searchParams.set('state', state);
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('code_challenge_method', method);

    window.location.assign(url.toString());
  }

  signOut() {
    this.tokens.clear();
    this.apiResponse = undefined;
  }

  async callWeather() {
    this.error = undefined;
    try {
      // refresh if needed (simple check)
      if (!this.tokens.isAuthenticated) {
        await this.tokens.refresh();
      }
      const res = await fetch(`${environment.resourceApi}/api/weather`, {
        headers: { Authorization: this.tokens.bearer! }
      });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      this.apiResponse = await res.json();
    } catch (e: any) {
      this.error = e?.message ?? String(e);
    }
  }
}
