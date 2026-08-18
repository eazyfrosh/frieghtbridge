import { NextResponse } from 'next/server';
import { createShipmentFromBooking, validateBooking } from '@/lib/shipments';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Book a shipment.
 *
 * Staff-only, like the rest of `/admin` — the public site offers a quote
 * enquiry, not a booking. The response carries the allocated tracking number,
 * which is the whole point: it is what the operator reads back to the
 * customer, and it works on the tracking page immediately.
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
    }

    // Re-validated here even though the form checks first. The form's checks
    // are for the person typing; these are the ones that actually hold, since
    // a route handler can be called without ever loading the page.
    const validated = validateBooking(payload);
    if ('error' in validated) return NextResponse.json({ error: validated.error }, { status: 400 });

    const created = await createShipmentFromBooking(validated.booking);
    if ('error' in created) {
      // A missing service account is a deployment fault, not a bad booking.
      const status = created.error.includes('not configured') ? 503 : 500;
      return NextResponse.json({ error: created.error }, { status });
    }

    return NextResponse.json({
      ok: true,
      trackingNumber: created.shipment.trackingNumber,
      shipment: created.shipment,
    });
  } catch (error) {
    console.error('[admin/shipments] booking failed:', error);
    return NextResponse.json({ error: 'Could not create the shipment.' }, { status: 500 });
  }
}
