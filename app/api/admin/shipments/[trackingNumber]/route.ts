import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { findShipment, updateShipment, validateShipmentPatch } from '@/lib/shipments';
import { normalizeTrackingNumber } from '@/lib/tracking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ trackingNumber: string }> };

/**
 * Edit a shipment's details.
 *
 * Every field is replaced from the submitted form rather than merged key by
 * key: the operator is looking at a filled-in form of the current record, so
 * what they submit *is* the intended state. A partial merge would make an
 * intentionally cleared field look like a field they forgot to send.
 */
export async function PATCH(request: Request, { params }: Params) {
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

    const validated = validateShipmentPatch(payload);
    if ('error' in validated) return NextResponse.json({ error: validated.error }, { status: 400 });

    const saved = await updateShipment(number, validated.patch);
    if (!saved) {
      return NextResponse.json(
        { error: 'Could not save — Firestore is not configured on this deployment.' },
        { status: 503 },
      );
    }

    // A warning is not a failure: the edit saved. It says the carrier tracking
    // number does not look like one that carrier issues, which the operator
    // should see before it goes out to a customer.
    return NextResponse.json({ ok: true, warning: validated.warning, shipment: saved });
  } catch (error) {
    console.error('[admin/shipments] update failed:', error);
    return NextResponse.json({ error: 'Could not save the shipment.' }, { status: 500 });
  }
}
