import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './cloudflare.js';

function setup() {
  const values = new Map();
  return {
    INBOX_PASSWORD: 'test-only inbox password',
    ASSETS: { fetch: async () => new Response('Journal asset') },
    BUCKET: {
      async put(key, value) { values.set(key, value); },
      async get(key) { return values.has(key) ? { text: async () => values.get(key) } : null; },
      async list({ prefix }) {
        return { objects: [...values.keys()].filter(key => key.startsWith(prefix)).map(key => ({ key })), truncated: false };
      },
    },
  };
}

test('Cloudflare inbox rejects spoofed Sites identity and incorrect passwords', async () => {
  const env = setup();
  for (const pathname of ['/inbox', '/api/letters']) {
    const spoofed = await worker.fetch(new Request('https://pltv.ink' + pathname, { headers: {
      'oai-authenticated-user-id': 'owner', 'oai-authenticated-user-email': 'inbox@pltv.invalid',
    } }), env);
    assert.equal(spoofed.status, 401);
    assert.match(spoofed.headers.get('WWW-Authenticate'), /^Basic /);
    const incorrect = await worker.fetch(new Request('https://pltv.ink' + pathname, { headers: {
      Authorization: 'Basic ' + btoa('pavel:wrong'),
    } }), env);
    assert.equal(incorrect.status, 401);
  }
});

test('Cloudflare accepts public letters and makes them readable with inbox credentials', async () => {
  const env = setup();
  const posted = await worker.fetch(new Request('https://pltv.ink/api/letters', {
    method: 'POST', headers: { Origin: 'https://pltv.ink', 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'visitor@example.test', message: 'A private letter.' }),
  }), env);
  assert.equal(posted.status, 201);
  const headers = { Authorization: 'Basic ' + btoa('pavel:' + env.INBOX_PASSWORD) };
  const letters = await worker.fetch(new Request('https://pltv.ink/api/letters', { headers }), env);
  assert.equal(letters.status, 200);
  assert.equal((await letters.json()).letters[0].message, 'A private letter.');
  const inbox = await worker.fetch(new Request('https://pltv.ink/inbox', { headers }), env);
  assert.equal(inbox.status, 200);
  assert.equal(inbox.headers.get('Cache-Control'), 'no-store');
  assert.ok(!(await inbox.text()).includes(env.INBOX_PASSWORD));
});

test('missing inbox secret fails closed while the journal remains available', async () => {
  const env = setup();
  delete env.INBOX_PASSWORD;
  assert.equal((await worker.fetch(new Request('https://pltv.ink/inbox'), env)).status, 503);
  const page = await worker.fetch(new Request('https://pltv.ink/'), env);
  assert.equal(page.status, 200);
  assert.equal(await page.text(), 'Journal asset');
});
