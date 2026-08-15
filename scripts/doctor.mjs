#!/usr/bin/env node
/**
 * Checks every link in the admin sign-in chain and says which one is broken.
 *
 *   npm run doctor
 *
 * Sign-in touches five separate things — client config baked into the bundle,
 * the service account, the allowlist, Firebase Auth, and Firestore — and a
 * failure in any of them surfaces in the browser as roughly the same message.
 * This walks them in order and stops guessing.
 *
 * Prints no secrets: lengths and shapes only.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

let failures = 0;
const ok = (m) => console.log(`  [32m✓[0m ${m}`);
const bad = (m, fix) => {
  failures += 1;
  console.log(`  [31m✗[0m ${m}`);
  if (fix) console.log(`      → ${fix}`);
};
const note = (m) => console.log(`    ${m}`);

// ---------------------------------------------------------------------------
console.log('\n1. Environment file');

if (!existsSync(join(root, '.env.local'))) {
  bad('.env.local not found in the project root', 'Copy .env.example to .env.local and fill it in.');
} else {
  ok('.env.local exists');
}

try {
  const mod = await import('@next/env');
  const loadEnvConfig = mod.loadEnvConfig ?? mod.default?.loadEnvConfig;
  loadEnvConfig(root, false);
  ok('loaded the way Next loads it');
} catch (error) {
  bad(`could not load env files: ${error.message}`);
}

// ---------------------------------------------------------------------------
console.log('\n2. Client config (must be present at BUILD time)');

const CLIENT_VARS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];
for (const name of CLIENT_VARS) {
  if (process.env[name]) ok(`${name} set`);
  else bad(`${name} missing`, 'Sign-in fails with "Firebase is not configured on this deployment."');
}

// These are inlined during `next build`, so a stale bundle is a real failure
// mode that looks nothing like a config problem.
const buildDir = join(root, '.next');
if (existsSync(buildDir) && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  const chunks = join(buildDir, 'static', 'chunks');
  let found = false;
  const walk = (dir) => {
    if (found || !existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.js')) {
        if (readFileSync(full, 'utf8').includes(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)) found = true;
      }
      if (found) return;
    }
  };
  walk(chunks);
  if (found) ok('project id is baked into the built client bundle');
  else
    bad(
      'the built bundle does NOT contain your project id',
      'You built before setting the env. Run `npm run build` again — NEXT_PUBLIC_* is inlined at build time, restarting is not enough.',
    );
} else {
  note('no .next build found — run `npm run build` before testing sign-in');
}

// ---------------------------------------------------------------------------
console.log('\n3. Service account (server side)');

let serviceAccount = null;
const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!raw) {
  bad('FIREBASE_SERVICE_ACCOUNT_KEY missing', 'Sign-in returns 503.');
} else {
  let text = raw.trim();
  if (!text.startsWith('{')) {
    try {
      text = Buffer.from(text, 'base64').toString('utf8');
      ok('decoded from base64');
    } catch {
      bad('is neither JSON nor valid base64');
    }
  }
  try {
    serviceAccount = JSON.parse(text);
    const missing = ['project_id', 'client_email', 'private_key'].filter((k) => !serviceAccount[k]);
    if (missing.length) {
      bad(`parsed, but missing: ${missing.join(', ')}`, 'Usually a truncated paste — use the base64 form.');
      serviceAccount = null;
    } else {
      ok(`valid, project ${serviceAccount.project_id}`);
      if (serviceAccount.project_id !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        bad(
          `service account project (${serviceAccount.project_id}) does not match NEXT_PUBLIC_FIREBASE_PROJECT_ID (${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID})`,
        );
      }
    }
  } catch {
    bad(
      'could not be parsed as JSON',
      'The raw multi-line JSON cannot live in a .env file — base64-encode it: base64 -w0 key.json',
    );
  }
}

// ---------------------------------------------------------------------------
console.log('\n4. Allowlist');

const allow = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
if (allow.length === 0) {
  bad('ADMIN_EMAILS is empty', 'Nobody can sign in. Set it to the operator address.');
} else {
  ok(`allows: ${allow.join(', ')}`);
}

// ---------------------------------------------------------------------------
console.log('\n5. Firebase Auth (live)');

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
if (apiKey) {
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'doctor-probe@example.invalid', password: 'x', returnSecureToken: true }),
    });
    const body = await res.json();
    const message = body?.error?.message ?? '';
    if (message === 'CONFIGURATION_NOT_FOUND') {
      bad('Authentication is not enabled on this project', 'Firebase console → Authentication → Get started.');
    } else if (message === 'API_KEY_INVALID' || message === 'INVALID_API_KEY') {
      bad('the API key is not valid for this project');
    } else if (message === 'OPERATION_NOT_ALLOWED') {
      bad('Email/Password sign-in is disabled', 'Authentication → Sign-in method → enable Email/Password.');
    } else {
      ok('reachable, Email/Password enabled');
    }
  } catch (error) {
    bad(`could not reach Firebase: ${error.message}`, 'Network, firewall or proxy.');
  }
}

// ---------------------------------------------------------------------------
console.log('\n6. The operator account');

if (serviceAccount && allow.length) {
  try {
    const { cert, initializeApp } = await import('firebase-admin/app');
    const { getAuth } = await import('firebase-admin/auth');
    const app = initializeApp(
      {
        credential: cert({
          projectId: serviceAccount.project_id,
          clientEmail: serviceAccount.client_email,
          privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
        }),
        projectId: serviceAccount.project_id,
      },
      `doctor-${Date.now()}`,
    );
    const auth = getAuth(app);
    for (const email of allow) {
      try {
        const user = await auth.getUserByEmail(email);
        if (user.disabled) bad(`${email} exists but is DISABLED`);
        else ok(`${email} exists (uid ${user.uid})`);
      } catch {
        bad(`${email} is in ADMIN_EMAILS but has no Firebase account`, 'Authentication → Users → Add user.');
      }
    }

    const { getFirestore } = await import('firebase-admin/firestore');
    const snap = await getFirestore(app).collection('shipments').limit(1).get();
    if (snap.empty) note('Firestore `shipments` is empty — run `npm run seed` (the app falls back to fixtures)');
    else ok('Firestore reachable and seeded');
  } catch (error) {
    bad(`Admin SDK failed: ${error.message}`);
  }
} else {
  note('skipped — needs a valid service account and ADMIN_EMAILS');
}

// ---------------------------------------------------------------------------
console.log(
  failures === 0
    ? '\n[32mAll checks passed.[0m If sign-in still fails, rebuild (`npm run build`) and send the exact on-screen message.\n'
    : `\n[31m${failures} problem(s) above.[0m Fix those, then \`npm run build\` and try again.\n`,
);
process.exit(failures === 0 ? 0 : 1);
