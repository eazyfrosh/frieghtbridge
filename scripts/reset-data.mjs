#!/usr/bin/env node
/**
 * Delete the operational data, to start from nothing.
 *
 *   npm run reset -- --dry-run          # count what would go, delete nothing
 *   npm run reset -- --yes              # actually delete
 *   npm run reset -- --yes --only=shipments,chats
 *   npm run reset:emulator -- --yes     # against a running emulator
 *
 * This is destructive and irreversible. Firestore has no undo and this script
 * takes no backup, so it refuses to do anything without `--yes`, prints the
 * project id it is about to act on, and pauses before starting when that
 * project is not an emulator. Getting the wrong project here would delete a
 * live customer's shipments.
 *
 * Email templates are left alone by default: an operator's edited wording is
 * their writing, not test data, and losing it to a "clear the demo" command
 * would be a nasty surprise. Pass `--only=emailTemplates` to reset those too.
 */
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const here = dirname(fileURLToPath(import.meta.url));

try {
  const mod = await import('@next/env');
  const loadEnvConfig = mod.loadEnvConfig ?? mod.default?.loadEnvConfig;
  if (typeof loadEnvConfig !== 'function') throw new Error('loadEnvConfig not found on @next/env');
  loadEnvConfig(join(here, '..'), false);
} catch (error) {
  console.warn(`[reset] could not load .env files (${error.message}); using the real environment.`);
}

const args = process.argv.slice(2);
const confirmed = args.includes('--yes');
const dryRun = args.includes('--dry-run');
const onlyArg = args.find((a) => a.startsWith('--only='));

/**
 * Collections this clears, and what each holds.
 *
 * `chats` has a `messages` subcollection: deleting a parent document in
 * Firestore does NOT delete its subcollections, it just leaves them
 * unreachable, so those are walked explicitly.
 */
const COLLECTIONS = [
  { name: 'shipments', describes: 'bookings and their scan history' },
  { name: 'chats', describes: 'live chat conversations', subcollections: ['messages'] },
  { name: 'emailLog', describes: 'the record of notifications sent' },
  { name: 'chatRateLimits', describes: 'chat rate-limit counters' },
];

const OPTIONAL = [{ name: 'emailTemplates', describes: 'operator edits to email wording' }];

const requested = onlyArg
  ? onlyArg
      .slice('--only='.length)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  : COLLECTIONS.map((c) => c.name);

const targets = [...COLLECTIONS, ...OPTIONAL].filter((c) => requested.includes(c.name));
const unknown = requested.filter((name) => ![...COLLECTIONS, ...OPTIONAL].some((c) => c.name === name));

if (unknown.length) {
  console.error(`Unknown collection(s): ${unknown.join(', ')}`);
  console.error(`Known: ${[...COLLECTIONS, ...OPTIONAL].map((c) => c.name).join(', ')}`);
  process.exit(1);
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

console.log('');
console.log(`  Project : ${projectId}${usingEmulator ? ` (emulator at ${process.env.FIRESTORE_EMULATOR_HOST})` : ''}`);
console.log(`  Mode    : ${dryRun ? 'dry run — nothing will be deleted' : confirmed ? 'DELETE' : 'refusing (no --yes)'}`);
console.log('');

/** Deletes every document in a collection, in batches. Returns how many. */
async function purge(ref, label) {
  let deleted = 0;

  for (;;) {
    const snapshot = await ref.limit(300).get();
    if (snapshot.empty) break;

    if (dryRun) {
      // Counting the whole collection would need a second pass; the point of a
      // dry run is the order of magnitude and the target, not an exact figure.
      const total = (await ref.count().get()).data().count;
      console.log(`  ${label}: ${total} document(s) would be deleted`);
      return total;
    }

    const batch = db.batch();
    for (const doc of snapshot.docs) batch.delete(doc.ref);
    await batch.commit();
    deleted += snapshot.size;
    process.stdout.write(`\r  ${label}: ${deleted} deleted`);
  }

  if (!dryRun) console.log(`\r  ${label}: ${deleted} deleted   `);
  return deleted;
}

if (!confirmed && !dryRun) {
  console.log('This deletes data permanently. Re-run with --yes to proceed,');
  console.log('or --dry-run to see what would go.');
  console.log('');
  console.log(`Would clear: ${targets.map((t) => t.name).join(', ')}`);
  process.exit(1);
}

// A live project gets a pause with the name on screen. Nobody reads a warning
// they cannot act on; five seconds is enough to hit Ctrl-C on the wrong one.
if (confirmed && !dryRun && !usingEmulator) {
  console.log(`About to permanently delete data from the LIVE project "${projectId}".`);
  console.log('Ctrl-C within 5 seconds to abort.');
  await sleep(5000);
  console.log('');
}

let total = 0;
for (const target of targets) {
  // Subcollections first: once the parent is gone its children are orphaned
  // and can no longer be listed through it.
  for (const sub of target.subcollections ?? []) {
    const parents = await db.collection(target.name).listDocuments();
    for (const parent of parents) {
      total += await purge(parent.collection(sub), `${target.name}/${parent.id}/${sub}`);
    }
  }
  total += await purge(db.collection(target.name), target.name);
}

console.log('');
console.log(
  dryRun
    ? `Dry run complete — ${total} document(s) would be deleted.`
    : `Done. ${total} document(s) deleted from "${projectId}".`,
);
process.exit(0);
