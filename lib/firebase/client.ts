'use client';

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import { authEmulatorHost, clientConfig } from './config';

/**
 * Firebase client SDK — used for exactly one thing: signing the operator in so
 * we can hand the resulting ID token to the server.
 *
 * The ID token is never trusted on its own. The server verifies it and mints
 * an httpOnly session cookie; the client never holds the thing that grants
 * access to admin pages.
 */

let cached: Auth | null = null;

export function clientAuth(): Auth | null {
  if (cached) return cached;

  const config = clientConfig();
  if (!config) return null;

  const app: FirebaseApp = getApps().length ? getApp() : initializeApp(config);
  const auth = getAuth(app);

  const emulator = authEmulatorHost();
  if (emulator) {
    // `disableWarnings` keeps the emulator banner out of the console; the
    // environment variable is already an explicit opt-in.
    connectAuthEmulator(auth, emulator, { disableWarnings: true });
  }

  cached = auth;
  return auth;
}
