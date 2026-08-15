import { NextResponse } from 'next/server';
import { listTemplates } from '@/lib/email';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Every template, defaults merged with any operator edits. */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

    return NextResponse.json({ templates: await listTemplates() });
  } catch (error) {
    console.error('[admin/templates] list failed:', error);
    return NextResponse.json({ error: 'Could not load templates.' }, { status: 500 });
  }
}
