#!/usr/bin/env node
/**
 * Seeds the `shipments` collection.
 *
 *   npm run seed          # against the project in FIREBASE_SERVICE_ACCOUNT_KEY
 *   npm run seed:emulator # against a running emulator
 *
 * The tracking number is the document id, so seeding is idempotent — running
 * it twice overwrites rather than duplicating, and the public lookup can be a
 * point read instead of a query.
 */
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

// Load .env.local the way Next does, so one config serves both.
//
// `@next/env` is CommonJS. Imported from ESM the named export can arrive
// undefined depending on interop, so reach through `default` as well —
// getting this wrong fails silently and looks exactly like a missing key.
try {
  const mod = await import('@next/env');
  const loadEnvConfig = mod.loadEnvConfig ?? mod.default?.loadEnvConfig;
  if (typeof loadEnvConfig !== 'function') {
    throw new Error('loadEnvConfig not found on @next/env');
  }
  loadEnvConfig(join(here, '..'), false);
} catch (error) {
  console.warn(`[seed] could not load .env files (${error.message}); relying on the real environment.`);
}

const usingEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

function credentials() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;
  let text = raw.trim();
  if (!text.startsWith('{')) text = Buffer.from(text, 'base64').toString('utf8');
  const parsed = JSON.parse(text);
  return {
    projectId: parsed.project_id,
    clientEmail: parsed.client_email,
    privateKey: parsed.private_key.replace(/\\n/g, '\n'),
  };
}

const creds = usingEmulator ? null : credentials();

if (!usingEmulator && !creds) {
  console.error(
    'No FIREBASE_SERVICE_ACCOUNT_KEY set, and FIRESTORE_EMULATOR_HOST is empty.\n' +
      'Set one of them — see .env.example.',
  );
  process.exit(1);
}

const projectId =
  creds?.projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-freightbridge';

initializeApp(creds ? { credential: cert(creds), projectId } : { projectId });
const db = getFirestore();

/**
 * The fixtures are TypeScript, so rather than compiling them just for a seed
 * script, read the file and pull the array out of the compiled-away syntax.
 * Keeping one source of truth beats keeping a duplicate JSON copy in sync.
 */
const fixturesPath = join(here, '..', 'lib', 'fixtures', 'shipments.ts');
const source = readFileSync(fixturesPath, 'utf8');
const start = source.indexOf('[', source.indexOf('SEED_SHIPMENTS'));
const literal = source.slice(start, source.lastIndexOf(']') + 1);

// The literal is plain data — object/array/string/number only, no expressions.
const shipments = new Function(`return ${literal};`)();

if (!Array.isArray(shipments)) {
  console.error('Could not read the shipments array out of lib/fixtures/shipments.ts');
  process.exit(1);
}

// An empty fixture set is the normal state now — the demo consignments were
// removed so the site runs on real bookings. Seeding nothing is a no-op, not a
// failure, so this exits 0 and says so rather than looking like a broken read.
if (shipments.length === 0) {
  console.log(
    'No seed shipments defined in lib/fixtures/shipments.ts — nothing to write.\n' +
      'That is expected: the demo data was removed. Add entries there to seed a demo.',
  );
  process.exit(0);
}

console.log(
  `Seeding ${shipments.length} shipments into "${projectId}"` +
    (usingEmulator ? ` (emulator at ${process.env.FIRESTORE_EMULATOR_HOST})` : ''),
);

const batch = db.batch();
for (const shipment of shipments) {
  batch.set(db.collection('shipments').doc(shipment.trackingNumber), shipment);
}
await batch.commit();

console.log('Done:');
for (const shipment of shipments) {
  console.log(`  ${shipment.trackingNumber}  ${shipment.origin} -> ${shipment.destination}`);
}
process.exit(0);
