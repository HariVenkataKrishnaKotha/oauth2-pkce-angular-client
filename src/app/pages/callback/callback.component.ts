import { Component } from '@angular/core';
import { TokenService } from '../../shared/token.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-callback',
  standalone: true,
  templateUrl: './callback.component.html'
})
export class CallbackComponent {
  status = 'Processing authorization response…';
  error?: string;

  constructor(private tokens: TokenService, private router: Router) {}

  async ngOnInit() {
    try {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');

      if (!code) throw new Error('Missing authorization code');

      // CSRF: compare state with stored value
      const storedState = sessionStorage.getItem('oauth_state');
      if (!storedState || state !== storedState) {
        throw new Error('State mismatch');
      }

      // PKCE verifier must be present
      const verifier = sessionStorage.getItem('pkce_verifier');
      if (!verifier) throw new Error('Missing PKCE verifier');

      // Exchange the code
      await this.tokens.exchangeCode(code, verifier);

      // Cleanup one-time artifacts
      sessionStorage.removeItem('pkce_verifier');
      sessionStorage.removeItem('oauth_state');

      this.status = 'Signed in! Redirecting…';
      // e.g., go home
      setTimeout(() => this.router.navigateByUrl('/'), 500);
    } catch (e: any) {
      this.error = e?.message ?? String(e);
      this.status = 'Authorization failed.';
    }
  }
}
