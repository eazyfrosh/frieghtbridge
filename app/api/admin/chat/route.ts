import { NextResponse } from 'next/server';
import { listConversations } from '@/lib/chat';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The operator's inbox.
 *
 * Authorised on every request rather than relying on the admin layout's check —
 * a route handler is reachable directly, and a page guard does nothing for it.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
    }

    return NextResponse.json({ conversations: await listConversations() });
  } catch (error) {
    console.error('[admin/chat] list failed:', error);
    return NextResponse.json({ error: 'Could not load conversations.' }, { status: 500 });
  }
}
