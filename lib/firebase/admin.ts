import 'server-only';

import { cert, getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { serverEmulator, serviceAccountRaw } from './config';

/**
 * Firebase Admin SDK, server-side only.
 *
 * The `server-only` import is load-bearing: this module holds a service
 * account that bypasses every Firestore rule, and the build must fail loudly
 * rather than let it be pulled into a client bundle.
 *
 * Initialised lazily and memoised on the app name, because Next re-evaluates
 * modules across route handlers and a second `initializeApp` throws.
 */

const APP_NAME = 'freightbridge-admin';

function parseServiceAccount() {
  const raw = serviceAccountRaw();
  if (!raw) return null;

  // Accept either raw JSON or base64 — hosting dashboards mangle multi-line
  // values, so base64 is often the only thing that survives paste.
  let text = raw.trim();
  if (!text.startsWith('{')) {
    try {
      text = Buffer.from(text, 'base64').toString('utf8');
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is neither JSON nor valid base64.');
    }
  }

  let parsed: { project_id?: string; client_email?: string; private_key?: string };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY could not be parsed as JSON.');
  }

  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY is missing project_id, client_email or private_key.',
    );
  }

  return {
    projectId: parsed.project_id,
    clientEmail: parsed.client_email,
    // Escaped newlines are what survives most env-var editors.
    privateKey: parsed.private_key.replace(/\\n/g, '\n'),
  };
}

function adminApp(): App | null {
  const existing = getApps().find((app) => app.name === APP_NAME);
  if (existing) return existing;

  // Against the emulator a service account is neither needed nor checked —
  // only the project id matters — so allow starting without one.
  if (serverEmulator()) {
    const projectId =
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'demo-freightbridge';
    return initializeApp({ projectId }, APP_NAME);
  }

  const credentials = parseServiceAccount();
  if (!credentials) return null;

  return initializeApp(
    { credential: cert(credentials), projectId: credentials.projectId },
    APP_NAME,
  );
}

/** Null when Firebase is not configured, so callers can degrade deliberately. */
export function adminAuth(): Auth | null {
  const app = adminApp();
  return app ? getAuth(app) : null;
}

export function adminDb(): Firestore | null {
  const app = adminApp();
  if (!app) return null;
  try {
    return getFirestore(app);
  } catch {
    return getApp(APP_NAME) ? getFirestore(getApp(APP_NAME)) : null;
  }
}
