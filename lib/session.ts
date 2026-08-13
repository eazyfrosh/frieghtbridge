import 'server-only';

import { cookies } from 'next/headers';
import { adminAuth } from './firebase/admin';
import { SESSION_COOKIE } from './firebase/config';

export interface AdminSession {
  uid: string;
  email: string;
}

/**
 * The authoritative session check.
 *
 * `middleware.ts` only looks for the cookie's presence — the Admin SDK cannot
 * run on the Edge runtime — so this is what actually decides whether a request
 * is authenticated. Every admin page and route handler goes through it.
 *
 * `checkRevoked` is on: signing out revokes the operator's refresh tokens, and
 * without this flag an already-minted session cookie would keep working until
 * it expired on its own.
 */
export async function getSession(): Promise<AdminSession | null> {
  // Read the cookie first, always. `cookies()` is what marks the route
  // dynamic; short-circuiting on configuration before touching it let Next
  // prerender the admin pages as static whenever the service account happened
  // to be absent at build time.
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const auth = adminAuth();
  if (!auth) return null;

  try {
    const claims = await auth.verifySessionCookie(token, true);
    if (!claims.email) return null;
    return { uid: claims.uid, email: claims.email };
  } catch {
    // Expired, revoked or forged — all the same to the caller.
    return null;
  }
}
