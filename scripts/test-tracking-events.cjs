const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise the real write and public lookup code with an in-memory Firestore
// boundary. No credentials, live customer records or external APIs are used.
const root = path.resolve(__dirname, '..');
const number = 'FBX-12345678';
const records = new Map([[number, {
  trackingNumber: number, status: 'Pending', origin: 'Lagos', destination: 'Abuja',
  currentLocation: 'Lagos', etaInDays: 2, events: [],
  customer: { name: 'Test Customer', email: 'private@example.com' },
}]]);
const snapshot = (id) => ({ exists: records.has(id), data: () => records.get(id) });
const db = {
  collection: () => ({ doc: (id) => ({ id, get: async () => snapshot(id) }) }),
  runTransaction: async (callback) => callback({
    get: async (ref) => snapshot(ref.id),
    set: (ref, value) => records.set(ref.id, value),
  }),
};
const cache = new Map();
function load(filename) {
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const localRequire = (name) => {
    if (name === 'server-only') return {};
    if (name === './firebase/admin') return { adminDb: () => db };
    if (name === './fulfilment') return {};
    if (name.startsWith('.')) return load(path.resolve(path.dirname(filename), `${name}.ts`));
    return require(name);
  };
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename })(localRequire, module, module.exports);
  return module.exports;
}

async function main() {
  const { validateEvent, addTrackingEvent } = load(path.join(root, 'lib/shipments.ts'));
  const { trackAnyNumber } = load(path.join(root, 'lib/multi-tracking.ts'));
  const at = new Date(Date.now() - 60_000).toISOString();
  const input = validateEvent({ stage: 'In Transit', title: 'Departed depot', location: 'Lokoja',
    description: 'Shipment is travelling to Abuja.', at, advanceShipment: true });
  assert.ok(input.event);
  await addTrackingEvent(number, input.event);
  const result = await trackAnyNumber(number);
  assert.equal(result.kind, 'internal');
  assert.equal(result.shipment.events[0].title, 'Departed depot');
  assert.equal(result.shipment.events[0].description, input.event.description);
  assert.equal(result.shipment.events[0].timestamp, at);
  assert.equal(result.shipment.currentLocation, 'Lokoja');
  assert.equal(result.shipment.status, 'In Transit');
  assert.equal('customer' in result.shipment, false);

  await addTrackingEvent(number, { ...input.event, title: 'Collected', stage: 'Picked Up',
    location: 'Lagos', at: new Date(Date.now() - 3_600_000).toISOString(), advanceShipment: false });
  const updated = await trackAnyNumber(number);
  assert.deepEqual(updated.shipment.events.map((event) => event.title), ['Collected', 'Departed depot']);
  assert.equal(updated.shipment.status, 'In Transit');
  assert.equal(updated.shipment.currentLocation, 'Lokoja');
  assert.ok(validateEvent({ ...input.event, title: '' }).error);
  assert.ok(validateEvent({ ...input.event, at: 'invalid' }).error);
  console.log('PASS: saved events reach public tracking, preserve chronology and omit private customer data.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
