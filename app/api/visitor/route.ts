import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { VISITOR_COOKIE, VISITOR_ID, VISITOR_TTL, ignoredVisitorPage, isBot, visitorMetadata } from '@/lib/visitor';
import { notifyVisitor, reserveVisitor } from '@/lib/visitor-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function response(status: number, ok: boolean) {
  return NextResponse.json({ ok }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  try {
    const key = process.env.RESEND_API_KEY?.trim();
    const to = process.env.VISITOR_ALERT_EMAIL?.trim();
    const from = process.env.VISITOR_FROM_EMAIL?.trim();
    // Preview deployments should not send production owner notifications.
    if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') return response(200, true);
    if (!key || !to || !from) return response(503, false);
    const site = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.freightbridgelogistics.app');
    const origin = request.headers.get('origin');
    const allowed = new Set([site.origin]);
    const alias = new URL(site);
    alias.hostname = site.hostname.startsWith('www.') ? site.hostname.slice(4) : `www.${site.hostname}`;
    allowed.add(alias.origin);
    if (process.env.NODE_ENV !== 'production') allowed.add(new URL(request.url).origin);
    if (!origin || !allowed.has(origin) || request.headers.get('sec-fetch-site') === 'cross-site') return response(403, false);
    if (!request.headers.get('content-type')?.startsWith('application/json')) return response(415, false);
    if (isBot(request.headers.get('user-agent') || '')) return response(200, true);
    // Bound streamed bodies too; Content-Length alone is controlled by callers.
    const reader = request.body?.getReader();
    if (!reader) return response(400, false);
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 2048) { await reader.cancel(); return response(413, false); }
      chunks.push(chunk.value);
    }
    let input: unknown;
    try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return response(400, false); }
    if (!input || typeof input !== 'object') return response(400, false);
    const body = input as Record<string, unknown>;
    if (typeof body.visitorId !== 'string' || !VISITOR_ID.test(body.visitorId) || typeof body.page !== 'string' || body.page.length > 500) return response(400, false);
    // Strip query/hash: tracking references and other private URL values aren't analytics.
    const page = body.page.split(/[?#]/)[0];
    if (ignoredVisitorPage(page)) return response(400, false);
    const cookie = request.cookies.get(VISITOR_COOKIE)?.value;
    const visitorId = cookie && VISITOR_ID.test(cookie) ? cookie : body.visitorId;
    const db = adminDb();
    if (!db) return response(503, false);
    const vercel = process.env.VERCEL === '1';
    const ip = vercel ? request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() || 'unknown' : 'local';
    let reservation;
    try { reservation = await reserveVisitor(db, visitorId, ip, key); }
    catch { console.error('[visitor] rate-limit store unavailable; alert suppressed'); return response(503, false); }
    if (reservation === 'limited') return response(429, false);
    let sent = true;
    if (reservation === 'reserved') {
      const metadata = visitorMetadata(request.headers, { visitorId, page, referrer: body.referrer }, new URL(origin), vercel);
      sent = await notifyVisitor(db, metadata, { key, to, from, siteUrl: site.origin });
    }
    const result = response(sent ? 200 : 502, sent);
    // Do not extend an existing session on every request.
    if (reservation === 'reserved') result.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: VISITOR_TTL / 1000,
    });
    return result;
  } catch {
    console.error('[visitor] request failed');
    return response(503, false);
  }
}
