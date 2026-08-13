import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

/**
 * Gate for the admin section.
 *
 * Running the check here rather than in each page means an unauthenticated
 * request never reaches the admin tree at all — no page component runs, no
 * data is assembled, nothing is streamed and then hidden.
 *
 * Only the JWT signature is verified here. Middleware runs on the Edge
 * runtime, where Node's scrypt is unavailable, so password checking lives in
 * the login route handler instead.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  // Already signed in and heading for the login page — send them onward.
  if (pathname === '/admin/login') {
    if (session) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL('/admin/login', request.url);
    // Remember where they were going, so sign-in lands them there.
    if (pathname !== '/admin') {
      loginUrl.searchParams.set('next', pathname + search);
    }
    const response = NextResponse.redirect(loginUrl);
    // An expired or tampered cookie is worse than none — clear it so the next
    // request does not repeat the failed verification.
    if (token) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
