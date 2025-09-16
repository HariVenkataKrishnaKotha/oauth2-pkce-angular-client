export function randomString(len = 64): string {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return b64url(arr);
}

export async function sha256(input: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  return await crypto.subtle.digest('SHA-256', data);
}

export function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
  let str = btoa(String.fromCharCode(...bytes));
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export async function pkcePair() {
  const verifier = randomString(64);
  const digest = await sha256(verifier);
  const challenge = b64url(digest);
  return { verifier, challenge, method: 'S256' as const };
}
