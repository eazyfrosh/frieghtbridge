import { NextResponse } from 'next/server';
import { findShipment } from '@/lib/shipments';
import { isPlausibleTrackingNumber, normalizeTrackingNumber, resolveShipment } from '@/lib/tracking';

// Firestore access goes through the Admin SDK, which is Node-only.
export const runtime = 'nodejs';
// Shipment status changes; a cached response would show a stale timeline.
export const dynamic = 'force-dynamic';

/**
 * Public shipment lookup.
 *
 * Deliberately public — a tracking number is the credential, exactly as it is
 * with any carrier. What keeps this safe is that it only ever answers an exact
 * document id: there is no listing, no prefix search and no way to enumerate.
 * Firestore rules deny all client access, so this route is the only path to
 * shipment data from outside the server.
 *
 * Worth adding before real traffic: rate limiting per IP, so the numbering
 * scheme cannot be brute-forced.
 */
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get('number') ?? '';

  if (!raw.trim() || !isPlausibleTrackingNumber(raw)) {
    return NextResponse.json({ error: 'Invalid tracking number.' }, { status: 400 });
  }

  const normalized = normalizeTrackingNumber(raw);

  try {
    const shipment = await findShipment(normalized);
    if (!shipment) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    }
    return NextResponse.json({ shipment: resolveShipment(shipment) });
  } catch (error) {
    // Log for the operator; tell the caller nothing about why.
    console.error('[tracking] lookup failed', error);
    return NextResponse.json({ error: 'Lookup failed.' }, { status: 500 });
  }
}
