import { NextResponse } from 'next/server';
import {
  emailConfigError,
  emailConfigured,
  getTemplate,
  renderTemplate,
  sendShipmentEmail,
  shipmentVariables,
} from '@/lib/email';
import { validEmail } from '@/lib/chat';
import { getSession } from '@/lib/session';
import { findShipment } from '@/lib/shipments';
import { normalizeTrackingNumber } from '@/lib/tracking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Send a shipment notification, or preview one.
 *
 * `preview: true` renders against the real shipment and sends nothing. It is
 * the same code path as a send, so what the operator approves is what leaves —
 * a preview rendered by a separate function would eventually drift from it.
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

    let payload: Record<string, unknown>;
    try {
      payload = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
    }

    const templateId = typeof payload.templateId === 'string' ? payload.templateId : '';
    const rawNumber = typeof payload.trackingNumber === 'string' ? payload.trackingNumber : '';
    const recipientName = typeof payload.recipientName === 'string' ? payload.recipientName : '';
    const preview = payload.preview === true;

    const shipment = await findShipment(normalizeTrackingNumber(rawNumber));
    if (!shipment) return NextResponse.json({ error: 'Unknown shipment.' }, { status: 404 });

    const template = await getTemplate(templateId);
    if (!template) return NextResponse.json({ error: 'Unknown template.' }, { status: 404 });

    const rendered = renderTemplate(template, shipmentVariables(shipment, recipientName));

    if (preview) return NextResponse.json({ preview: rendered });

    // Validated only on the send path: a preview should still render while the
    // operator is halfway through typing the address.
    const to = validEmail(payload.to);
    if (!to) return NextResponse.json({ error: 'Enter a valid recipient email address.' }, { status: 400 });

    if (!emailConfigured()) {
      return NextResponse.json(
        { error: `Email is not configured. ${emailConfigError() ?? ''}`.trim() },
        { status: 503 },
      );
    }

    const result = await sendShipmentEmail({
      templateId,
      to,
      recipientName,
      shipment,
      sentBy: session.email,
    });

    if (!result.ok) {
      // The provider's own words. "Domain not verified" is actionable; a
      // generic failure is a support ticket.
      return NextResponse.json({ error: result.error ?? 'The email provider refused it.' }, { status: 502 });
    }

    return NextResponse.json({ ok: true, id: result.id, subject: rendered.subject, to });
  } catch (error) {
    console.error('[admin/notify] failed:', error);
    return NextResponse.json({ error: 'Could not send the notification.' }, { status: 500 });
  }
}
