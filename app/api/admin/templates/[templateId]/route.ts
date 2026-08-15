import { NextResponse } from 'next/server';
import {
  getTemplate,
  renderTemplate,
  resetTemplate,
  saveTemplate,
  shipmentVariables,
  validTemplateText,
} from '@/lib/email';
import { unknownPlaceholders } from '@/lib/email/templates';
import { getSession } from '@/lib/session';
import { SEED_SHIPMENTS } from '@/lib/fixtures/shipments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ templateId: string }> };

/**
 * A sample shipment for previews.
 *
 * A fixture rather than a real record: the preview must work before any
 * shipment exists, and an operator editing wording should not have to pick a
 * customer's consignment to see what their change looks like.
 */
const SAMPLE = SEED_SHIPMENTS[0];

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

    const { templateId } = await params;
    const template = await getTemplate(templateId);
    if (!template) return NextResponse.json({ error: 'Unknown template.' }, { status: 404 });

    return NextResponse.json({
      template,
      preview: renderTemplate(template, shipmentVariables(SAMPLE, 'Alex Rivera')),
    });
  } catch (error) {
    console.error('[admin/templates] read failed:', error);
    return NextResponse.json({ error: 'Could not load the template.' }, { status: 500 });
  }
}

/** Save an edit. Responds with a fresh preview so the editor can show it. */
export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

    const { templateId } = await params;

    let payload: Record<string, unknown>;
    try {
      payload = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
    }

    const text = validTemplateText(payload.subject, payload.body);
    if (!text) {
      return NextResponse.json(
        { error: 'Subject and body are required, and must be within the length limits.' },
        { status: 400 },
      );
    }

    const saved = await saveTemplate(templateId, text, session.email);
    if (!saved) {
      return NextResponse.json(
        { error: 'Unknown template, or Firestore is not configured on this deployment.' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      template: saved,
      preview: renderTemplate(saved, shipmentVariables(SAMPLE, 'Alex Rivera')),
      // Saved anyway — a typo'd marker is a warning, not a reason to refuse an
      // edit. It renders literally, which is what makes it findable.
      warnings: unknownPlaceholders(`${text.subject}\n${text.body}`),
    });
  } catch (error) {
    console.error('[admin/templates] save failed:', error);
    return NextResponse.json({ error: 'Could not save the template.' }, { status: 500 });
  }
}

/** Discard the override and go back to the shipped default. */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

    const { templateId } = await params;
    const restored = await resetTemplate(templateId);
    if (!restored) {
      return NextResponse.json(
        { error: 'Unknown template, or Firestore is not configured on this deployment.' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      template: restored,
      preview: renderTemplate(restored, shipmentVariables(SAMPLE, 'Alex Rivera')),
    });
  } catch (error) {
    console.error('[admin/templates] reset failed:', error);
    return NextResponse.json({ error: 'Could not reset the template.' }, { status: 500 });
  }
}
