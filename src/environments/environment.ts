export const environment = {
  production: false,
  oauth: {
    issuer: 'http://localhost:5018',        // base issuer only
    clientId: 'demo-spa',                    // registered client_id
    redirectUri: 'http://localhost:4200/callback',
    scope: 'weather.read'
  },
  resourceApi: 'http://localhost:5173'
};
