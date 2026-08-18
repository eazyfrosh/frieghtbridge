import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { addTrackingEvent, findShipment, validateEvent } from '@/lib/shipments';
import { normalizeTrackingNumber } from '@/lib/tracking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ trackingNumber: string }> };

/**
 * Record a tracking event.
 *
 * This is the write customers actually see: the new scan appears on the public
 * tracking page immediately, because that page reads the same document.
 */
export async function POST(request: Request, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

    const { trackingNumber } = await params;
    const number = normalizeTrackingNumber(decodeURIComponent(trackingNumber));

    const existing = await findShipment(number);
    if (!existing) return NextResponse.json({ error: 'Unknown shipment.' }, { status: 404 });

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
    }

    const validated = validateEvent(payload);
    if ('error' in validated) return NextResponse.json({ error: validated.error }, { status: 400 });

    const saved = await addTrackingEvent(number, validated.event);
    if (!saved) {
      return NextResponse.json(
        { error: 'Could not save — Firestore is not configured on this deployment.' },
        { status: 503 },
      );
    }

    return NextResponse.json({ ok: true, shipment: saved });
  } catch (error) {
    console.error('[admin/shipments] add event failed:', error);
    return NextResponse.json({ error: 'Could not record the event.' }, { status: 500 });
  }
}
