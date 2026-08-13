import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from '@/lib/auth';
import { verifyPassword } from '@/lib/password';

// scrypt is Node-only, so this handler must not run on the Edge runtime.
export const runtime = 'nodejs';

/** Compares two strings without leaking length or content through timing. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: Request) {
  let email = '';
  let password = '';

  try {
    const body = (await request.json()) as { email?: unknown; password?: unknown };
    email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    password = typeof body.password === 'string' ? body.password : '';
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'Enter both an email and a password.' }, { status: 400 });
  }

  const expectedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const expectedHash = process.env.ADMIN_PASSWORD_HASH;

  if (!expectedEmail || !expectedHash || !process.env.AUTH_SECRET) {
    // A missing configuration is an operator problem, not a visitor's. Say so
    // plainly here rather than reporting it as bad credentials.
    return NextResponse.json(
      { error: 'Admin sign-in is not configured on this deployment.' },
      { status: 503 },
    );
  }

  // Both checks always run: returning early on an unknown email would make
  // valid addresses measurably faster to probe.
  const emailMatches = safeEqual(email, expectedEmail);
  const passwordMatches = await verifyPassword(password, expectedHash);

  if (!emailMatches || !passwordMatches) {
    // One message for both failures — never reveal which half was wrong.
    return NextResponse.json({ error: 'Those credentials were not recognised.' }, { status: 401 });
  }

  let token: string;
  try {
    token = await createSessionToken(expectedEmail);
  } catch {
    return NextResponse.json(
      { error: 'Admin sign-in is not configured on this deployment.' },
      { status: 503 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}
