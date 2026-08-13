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
try {
  const { loadEnvConfig } = await import('@next/env');
  loadEnvConfig(join(here, '..'), false);
} catch {
  // @next/env missing is not fatal — real env vars may already be set.
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

if (!Array.isArray(shipments) || shipments.length === 0) {
  console.error('Could not read any shipments out of lib/fixtures/shipments.ts');
  process.exit(1);
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
