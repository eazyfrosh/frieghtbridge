/**
 * Firebase configuration, read from the environment in one place.
 *
 * Two halves, deliberately separate:
 *
 *  - The **client** config is public by design. Firebase API keys identify a
 *    project, they do not authorise anything — access is decided by Auth and
 *    by Firestore rules. These are `NEXT_PUBLIC_` and ship in the bundle.
 *  - The **service account** is a real secret. It is server-only, never
 *    imported into a client component, and bypasses Firestore rules entirely.
 */

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}

export function clientConfig(): FirebaseClientConfig | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (!apiKey || !authDomain || !projectId || !appId) return null;
  return { apiKey, authDomain, projectId, appId };
}

/**
 * Emulator host, when running against the Firebase emulator suite.
 * Presence of these switches both SDKs over — nothing else changes.
 */
export const authEmulatorHost = () => process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || null;
export const firestoreEmulatorHost = () => process.env.FIRESTORE_EMULATOR_HOST || null;

/**
 * Server-side emulator detection. `FIREBASE_AUTH_EMULATOR_HOST` is the
 * variable the Admin SDK itself looks for, so its presence means the SDK is
 * already talking to a local emulator rather than to Google.
 */
export const serverEmulator = () =>
  Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST);

/**
 * True when admin sign-in can work at all. Checked before every auth path.
 *
 * Against the emulator a service account is neither required nor validated —
 * only the project id is — so demanding one here would make local development
 * impossible while looking like a credentials failure.
 */
export function isAuthConfigured(): boolean {
  if (!clientConfig()) return false;
  return serverEmulator() || Boolean(serviceAccountRaw());
}

export function serviceAccountRaw(): string | null {
  return process.env.FIREBASE_SERVICE_ACCOUNT_KEY || null;
}

/** Session cookies last 8 hours, matching the previous implementation. */
export const SESSION_COOKIE = 'fb_admin_session';
export const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_MS / 1000,
  };
}
