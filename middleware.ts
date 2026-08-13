import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/firebase/config';

/**
 * Cheap gate in front of the admin section.
 *
 * This only checks that a session cookie is *present*. It cannot verify one:
 * middleware runs on the Edge runtime, and the Firebase Admin SDK needs Node.
 * Verification is done in `lib/session.ts`, which every admin page and route
 * handler goes through — that is the check that actually decides access.
 *
 * So treat this as a redirect for the common case, not as security. A forged
 * cookie gets past here and is rejected a few milliseconds later by the
 * layout, which redirects to the same place.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === '/admin/login') {
    // Do not bounce a *present* cookie away from the login page — it may be
    // expired, and the login page is where the operator fixes that.
    return NextResponse.next();
  }

  if (!hasCookie) {
    const loginUrl = new URL('/admin/login', request.url);
    if (pathname !== '/admin') {
      loginUrl.searchParams.set('next', pathname + search);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
