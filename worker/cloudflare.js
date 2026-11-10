import { api } from './api.js';

const internalOwner = 'inbox@pltv.invalid';

async function authenticates(request, password) {
  if (!password) return false;
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Basic ')) return false;
  let credentials;
  try {
    credentials = new TextDecoder().decode(Uint8Array.from(atob(authorization.slice(6)), c => c.charCodeAt(0)));
  } catch {
    return false;
  }
  const encoder = new TextEncoder();
  const [supplied, expected] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(credentials)),
    crypto.subtle.digest('SHA-256', encoder.encode('pavel:' + password)),
  ]);
  const a = new Uint8Array(supplied);
  const b = new Uint8Array(expected);
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}

function deny(status) {
  const headers = {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow',
  };
  if (status === 401) headers['WWW-Authenticate'] = 'Basic realm="Journal inbox", charset="UTF-8"';
  return new Response(status === 401 ? 'Inbox sign-in required.' : 'Inbox is not configured yet.', { status, headers });
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const privateRoute = url.pathname === '/inbox' ||
        (url.pathname === '/api/letters' && ['GET', 'HEAD'].includes(request.method));
      if (privateRoute && !env.INBOX_PASSWORD) return deny(503);
      const authorized = privateRoute && await authenticates(request, env.INBOX_PASSWORD);
      if (privateRoute && !authorized) return deny(401);

      // Sites identity headers are untrusted on a directly hosted Cloudflare Worker.
      const headers = new Headers(request.headers);
      for (const name of [...headers.keys()]) {
        if (name.startsWith('oai-authenticated-') || name === 'oai-sites-authorization') headers.delete(name);
      }
      headers.delete('Authorization');
      if (authorized) {
        headers.set('oai-authenticated-user-id', 'cloudflare-inbox-owner');
        headers.set('oai-authenticated-user-email', internalOwner);
      }
      const response = await api(new Request(request, { headers }), { ...env, OWNER_EMAIL: internalOwner });
      if (response) return response;
      return env.ASSETS.fetch(request);
    } catch {
      return new Response(JSON.stringify({ error: 'The letter box is temporarily unavailable. Please try again.' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }
  },
};
