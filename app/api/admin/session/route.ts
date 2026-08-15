import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { adminAuth, adminConfigError } from '@/lib/firebase/admin';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_MS,
  isAllowedAdmin,
  isAuthConfigured,
  sessionCookieOptions,
} from '@/lib/firebase/config';

// The Admin SDK is Node-only.
export const runtime = 'nodejs';

/**
 * Exchange a Firebase ID token for a session cookie.
 *
 * The client signs in with the Firebase SDK and posts the resulting ID token
 * here. We verify it server-side and mint an httpOnly session cookie — the
 * browser never keeps a credential that JavaScript can read, so an XSS bug
 * cannot lift the operator's session.
 */
export async function POST(request: Request) {
  // Outermost net. Anything that escapes `exchange` — including a failure to
  // load the Admin SDK itself — would otherwise be rendered by Next as an HTML
  // error page: a 500 with no JSON, which the browser can only report as
  // "something went wrong". Every failure leaves here as a readable message.
  try {
    return await exchange(request);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error('[admin/session] unhandled:', detail);
    return NextResponse.json(
      { error: `Sign-in crashed on the server: ${detail}` },
      { status: 500 },
    );
  }
}

async function exchange(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { error: 'Firebase is not configured on this deployment.' },
      { status: 503 },
    );
  }

  const auth = adminAuth();
  if (!auth) {
    // Say what is actually wrong. This is a deployment fault, not a bad
    // credential, and the operator is the only one who can fix it — a generic
    // message here costs an afternoon of guessing. The reasons describe the
    // shape of the configuration, never its contents.
    return NextResponse.json(
      { error: `Firebase Admin SDK could not start. ${adminConfigError() ?? ''}`.trim() },
      { status: 503 },
    );
  }

  let idToken = '';
  try {
    const body = (await request.json()) as { idToken?: unknown };
    idToken = typeof body.idToken === 'string' ? body.idToken : '';
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  if (!idToken) {
    return NextResponse.json({ error: 'Missing ID token.' }, { status: 400 });
  }

  try {
    // `true` checks revocation — a token from a disabled or signed-out account
    // must not be exchangeable for a fresh session.
    const decoded = await auth.verifyIdToken(idToken, true);

    // Having a Firebase account is not the same as being an operator. Firebase
    // permits public self-signup by default and the API key is in the client
    // bundle, so without this check anyone could enrol themselves into admin.
    if (!isAllowedAdmin(decoded.email)) {
      // Same message as a bad password: never confirm that an account exists
      // but lacks access — that is a useful signal to someone probing.
      return NextResponse.json({ error: 'Those credentials were not recognised.' }, { status: 401 });
    }

    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_MS,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, sessionCookie, sessionCookieOptions());
    return response;
  } catch (error) {
    // A rejected token and a broken deployment are different problems and were
    // previously reported identically. Firebase tags credential failures with
    // an `auth/…` code; anything else is ours, and saying so is what makes it
    // findable — the operator sees the reason instead of "not recognised".
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';

    if (code.startsWith('auth/')) {
      return NextResponse.json({ error: 'Those credentials were not recognised.' }, { status: 401 });
    }

    const detail = error instanceof Error ? error.message : String(error);
    console.error('[admin/session] exchange failed:', code || '(no code)', detail);
    return NextResponse.json(
      { error: `Sign-in could not be completed: ${detail}` },
      { status: 500 },
    );
  }
}

/** Sign out: revoke the account's refresh tokens, then drop the cookie. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });

  try {
    const auth = adminAuth();
    const existing = (await cookies()).get(SESSION_COOKIE)?.value;

    if (auth && existing) {
      try {
        const claims = await auth.verifySessionCookie(existing, false);
        // Revoking is what makes sign-out real: `getSession` verifies with
        // `checkRevoked`, so any copy of this cookie stops working immediately
        // rather than lingering until it expires.
        await auth.revokeRefreshTokens(claims.sub);
      } catch {
        // Already invalid — clearing the cookie below is all that is left to do.
      }
    }
  } catch (error) {
    // Revocation is best-effort; dropping the cookie is not. Sign-out must
    // never fail just because the Admin SDK is unavailable.
    console.error('[admin/session] revoke failed:', error);
  }

  response.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}
