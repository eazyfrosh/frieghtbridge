// Deep imports on purpose. The `jose` barrel pulls in JWE decryption, whose
// Compression/DecompressionStream use is unsupported on the Edge runtime that
// middleware runs on — and none of it is needed to sign and verify a JWS.
import { SignJWT } from 'jose/jwt/sign';
import { jwtVerify } from 'jose/jwt/verify';

/**
 * Admin authentication.
 *
 * Real, not mocked: the password is verified server-side against a scrypt hash
 * and the session is a signed JWT in an httpOnly cookie. Nothing about the
 * signed-in state is decided by the client.
 *
 * What it is NOT: there is no user database. A single operator account is read
 * from the environment, so there is no signup, no password reset and no
 * per-user audit trail. That is the right shape for one operations login on a
 * site with no backend; it is not the right shape for a real user base.
 *
 * Required environment variables — see .env.example:
 *   AUTH_SECRET          32+ random bytes, base64 or hex
 *   ADMIN_EMAIL          the operator's login
 *   ADMIN_PASSWORD_HASH  scrypt hash, produced by `npm run hash-password`
 */

export const SESSION_COOKIE = 'fb_admin_session';
const SESSION_HOURS = 8;

/** Throws rather than falling back, so a misconfigured deploy fails loudly. */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Admin sign-in cannot work without it — see .env.example.`,
    );
  }
  return value;
}

function secretKey(): Uint8Array {
  const secret = requireEnv('AUTH_SECRET');
  if (secret.length < 32) {
    throw new Error('AUTH_SECRET must be at least 32 characters. Generate one with `openssl rand -base64 32`.');
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  email: string;
}

/** Signs an 8-hour session token. */
export async function createSessionToken(email: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('freightbridge-admin')
    .setAudience('freightbridge-admin')
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(secretKey());
}

/**
 * Verifies signature, issuer, audience and expiry. Returns null on any
 * failure — callers treat null as "not signed in" and never see the reason,
 * which keeps tampering from being distinguishable from expiry.
 *
 * Uses only Web Crypto, so this is safe to call from middleware on the Edge
 * runtime as well as from Node route handlers.
 */
export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: 'freightbridge-admin',
      audience: 'freightbridge-admin',
    });
    return typeof payload.email === 'string' ? { email: payload.email } : null;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    // Set on HTTPS only. Left off in development so local sign-in works.
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_HOURS * 60 * 60,
  };
}
