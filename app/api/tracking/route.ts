import { NextResponse } from 'next/server';
import { trackAnyNumber } from '@/lib/multi-tracking';

// Firestore access goes through the Admin SDK, which is Node-only.
export const runtime = 'nodejs';
// Shipment status changes; a cached response would show a stale timeline.
export const dynamic = 'force-dynamic';

/**
 * Public tracking lookup, for our numbers and other carriers' alike.
 *
 * Deliberately public for our own shipments — a tracking number is the
 * credential, exactly as it is with any carrier. What keeps that safe is that
 * it only ever answers an exact document id: there is no listing, no prefix
 * search and no way to enumerate, and the response omits the customer's
 * details by type (see `TrackingResult`).
 *
 * A number belonging to FedEx, UPS, USPS, DHL and the rest is recognised by
 * format and answered with the carrier and a deep link — plus real events when
 * a tracking provider is configured.
 *
 * Worth adding before real traffic: rate limiting per IP, so the numbering
 * scheme cannot be brute-forced.
 */
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get('number') ?? '';

  if (!raw.trim()) {
    return NextResponse.json({ error: 'Enter a tracking number.' }, { status: 400 });
  }

  // Long enough to cover every format in the registry, short enough that a
  // pasted essay never reaches the detector.
  if (raw.length > 64) {
    return NextResponse.json({ error: 'That is too long to be a tracking number.' }, { status: 400 });
  }

  try {
    const result = await trackAnyNumber(raw);

    if (result.kind === 'unknown') {
      return NextResponse.json({ error: 'Not found.', kind: 'unknown' }, { status: 404 });
    }

    if (result.kind === 'internal') {
      // `shipment` stays at the top level: the tracking widget, the email
      // templates and the admin page all read this shape already.
      return NextResponse.json({ kind: 'internal', shipment: result.shipment });
    }

    return NextResponse.json(result);
  } catch (error) {
    // Log for the operator; tell the caller nothing about why.
    console.error('[tracking] lookup failed', error);
    return NextResponse.json({ error: 'Lookup failed.' }, { status: 500 });
  }
}
