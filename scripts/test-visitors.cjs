const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');
const ts = require('typescript');
const { NextRequest } = require('next/server');
const root = path.resolve(__dirname, '..');
const records = new Map();
let sends = [], failEmail = false, throwEmail = false, failAnalytics = false, failGate = false;
let serial = Promise.resolve();
const snapshot = (ref) => ({ exists: records.has(ref.key), data: () => records.get(ref.key) });
const db = {
  collection: (collection) => ({ doc: (id) => ({ key: `${collection}/${id}`,
    set: async (value) => {
      if (failAnalytics && collection === 'website_visitors') throw Error('analytics unavailable');
      records.set(`${collection}/${id}`, value);
    },
  }) }),
  runTransaction: (callback) => {
    const pending = serial.then(async () => {
      if (failGate) throw Error('gate unavailable');
      return callback({ get: async (ref) => snapshot(ref), getAll: async (...refs) => refs.map(snapshot),
        set: (ref, value) => records.set(ref.key, value) });
    });
    serial = pending.catch(() => {});
    return pending;
  },
};
const cache = new Map();
function load(filename) {
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const localRequire = (name) => {
    if (name === 'server-only') return {};
    if (name.endsWith('/firebase/admin')) return { adminDb: () => db };
    if (name === 'resend') return { Resend: class { emails = { send: async (email, options) => {
      sends.push({ email, options });
      if (throwEmail) throw Error('network failure');
      return failEmail ? { error: { name: 'test_error' }, data: null } : { data: { id: 'test-id' }, error: null };
    } }; } };
    if (name.startsWith('@/')) return load(path.join(root, `${name.slice(2)}.ts`));
    if (name.startsWith('.')) return load(path.resolve(path.dirname(filename), `${name}.ts`));
    return require(name);
  };
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename })(localRequire, module, module.exports);
  return module.exports;
}
function request(id, overrides = {}) {
  return new NextRequest('https://www.freightbridgelogistics.app/api/visitor', {
    method: 'POST', headers: { origin: 'https://www.freightbridgelogistics.app', 'content-type': 'application/json',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/130.0 Safari/537.36',
      'x-vercel-forwarded-for': '192.0.2.10', ...overrides.headers },
    body: JSON.stringify({ visitorId: id, page: '/tracking?number=PRIVATE', referrer: 'https://search.example/path?secret=private', ...overrides.body }),
  });
}
function reset() { records.clear(); sends = []; failEmail = throwEmail = failAnalytics = failGate = false; }

async function main() {
  Object.assign(process.env, { RESEND_API_KEY: 'test-not-a-real-key', VISITOR_ALERT_EMAIL: 'owner@example.com',
    VISITOR_FROM_EMAIL: 'alerts@example.com', NEXT_PUBLIC_SITE_URL: 'https://www.freightbridgelogistics.app', VERCEL: '1', VERCEL_ENV: 'production' });
  const { POST } = load(path.join(root, 'app/api/visitor/route.ts'));
  const helpers = load(path.join(root, 'lib/visitor.ts'));
  const { reserveVisitor } = load(path.join(root, 'lib/visitor-server.ts'));
  const id = randomUUID();
  const results = await Promise.all([POST(request(id)), POST(request(id))]);
  assert.ok(results.every((response) => response.status === 200));
  assert.equal(sends.length, 1, 'concurrent duplicates send once');
  assert.equal(sends[0].options.idempotencyKey, `visitor-${id}`);
  assert.ok(sends[0].email.html.includes('Unknown'));
  assert.ok(!sends[0].email.html.includes('PRIVATE'));
  assert.ok(!sends[0].email.html.includes('secret=private'));
  const saved = records.get(`website_visitors/${id}`);
  assert.equal(saved.page, '/tracking');
  assert.equal(saved.referrer, 'search.example');
  assert.equal(saved.operatingSystem, 'Windows');
  assert.ok(!JSON.stringify([...records]).includes('192.0.2.10'));
  await POST(request(id, { body: { page: '/services' } }));
  await POST(request(randomUUID(), { headers: { cookie: `fb_visitor=${id}` } }));
  assert.equal(sends.length, 1, 'refresh, navigation and cookie fallback remain deduplicated');
  assert.equal(await reserveVisitor(db, id, '192.0.2.10', 'test', Date.now() + helpers.VISITOR_TTL + 100), 'reserved');

  reset(); failEmail = true;
  const failedId = randomUUID();
  assert.equal((await POST(request(failedId))).status, 502);
  assert.equal((await POST(request(failedId))).status, 200);
  assert.equal(sends.length, 1, 'provider failures do not cause resend storms');
  reset(); throwEmail = true;
  assert.equal((await POST(request(randomUUID()))).status, 502);
  reset(); failAnalytics = true;
  assert.equal((await POST(request(randomUUID()))).status, 200);
  assert.equal(sends.length, 1, 'analytics failure does not stop email');
  reset(); failGate = true;
  assert.equal((await POST(request(randomUUID()))).status, 503);
  assert.equal(sends.length, 0, 'cannot send without durable flood protection');
  reset();
  for (let n = 0; n < 3; n++) assert.equal((await POST(request(randomUUID()))).status, 200);
  assert.equal((await POST(request(randomUUID()))).status, 429);
  assert.equal(sends.length, 3);
  reset();
  const now = Date.now();
  for (let n = 0; n < 5; n++) assert.equal(await reserveVisitor(db, randomUUID(), `ip-${n}`, 'test', now), 'reserved');
  assert.equal(await reserveVisitor(db, randomUUID(), 'another-ip', 'test', now), 'limited');
  reset();
  for (let n = 0; n < 40; n++) assert.equal(await reserveVisitor(db, randomUUID(), `ip-${n}`, 'test', now + n * 61_000), 'reserved');
  assert.equal(await reserveVisitor(db, randomUUID(), 'another-ip', 'test', now + 41 * 61_000), 'limited');
  reset();
  assert.equal((await POST(request(randomUUID(), { headers: { origin: 'https://evil.example' } }))).status, 403);
  assert.equal((await POST(request(randomUUID(), { headers: { 'user-agent': 'Googlebot' } }))).status, 200);
  assert.equal((await POST(request(randomUUID(), { body: { page: '/api/tracking' } }))).status, 400);
  assert.equal((await POST(request('bad-id'))).status, 400);
  assert.equal((await POST(request(randomUUID(), { body: { referrer: 'x'.repeat(3000) } }))).status, 413);
  assert.equal(sends.length, 0);
  const metadata = helpers.visitorMetadata(new Headers({ 'x-vercel-ip-city': 'Lagos', 'x-vercel-ip-country': 'NG' }),
    { visitorId: id, page: '/<script>' }, new URL('https://example.com'), true);
  assert.equal(metadata.country, 'Nigeria');
  assert.equal(metadata.city, 'Lagos');
  assert.ok(helpers.visitorEmail(metadata, 'https://example.com').html.includes('&lt;script&gt;'));

  // Mount the real invisible client with browser storage and network stubs.
  const storage = new Map();
  let clientCalls = 0;
  function mountClient() {
    let callback;
    const source = ts.transpileModule(fs.readFileSync(path.join(root, 'components/VisitorTracker.tsx'), 'utf8'),
      { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    const sandbox = { exports: {}, require: (name) => name === 'react' ? { useEffect: (effect) => effect() } : helpers,
      window: { location: { pathname: '/' }, setTimeout: (fn) => { callback = fn; return 1; }, clearTimeout() {} },
      document: { referrer: '', visibilityState: 'visible', addEventListener() {}, removeEventListener() {} },
      navigator: { webdriver: false }, crypto: { randomUUID },
      localStorage: { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value) },
      fetch: () => { clientCalls++; return Promise.reject(Error('offline')); },
    };
    vm.runInNewContext(source, sandbox);
    sandbox.exports.VisitorTracker(); callback();
  }
  mountClient(); mountClient(); mountClient();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(clientCalls, 1, 'refresh/navigation/network failure do not re-trigger client requests');
  storage.set('fb-visitor-session', JSON.stringify({ expiresAt: Date.now() - 1 }));
  mountClient();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(clientCalls, 2, 'expired session starts another attempt');
  console.log('PASS: visitor endpoint, deduplication, concurrency, expiry, rate limits, privacy, provider/database failures and client navigation.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
