import { NextResponse } from 'next/server';
import {
  addAgentMessage,
  cursorParam,
  getConversation,
  markReadByAdmin,
  messagesAfter,
  setConversationStatus,
  validMessage,
} from '@/lib/chat';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ chatId: string }> };

/** Read one conversation: its messages, and its current state. */
export async function GET(request: Request, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

    const { chatId } = await params;
    const conversation = await getConversation(chatId);
    if (!conversation) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    const after = cursorParam(request);

    // Opening a conversation is what marks it read. Polling for new messages
    // passes a cursor, and must not clear the badge for messages that arrive
    // while the operator is looking at a different conversation.
    if (after === null) await markReadByAdmin(chatId);

    return NextResponse.json({
      conversation,
      messages: await messagesAfter(chatId, after),
    });
  } catch (error) {
    console.error('[admin/chat] read failed:', error);
    return NextResponse.json({ error: 'Could not load the conversation.' }, { status: 500 });
  }
}

/** Reply as the operator. */
export async function POST(request: Request, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

    const { chatId } = await params;

    let payload: Record<string, unknown>;
    try {
      payload = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
    }

    const body = validMessage(payload.body);
    if (!body) return NextResponse.json({ error: 'Message is empty or too long.' }, { status: 400 });

    // The visitor sees the part before the @, not the operator's full address.
    // They have no reason to learn internal email addresses from a chat reply.
    const agentName = session.email.split('@')[0] || 'FreightBridge';

    const sent = await addAgentMessage(chatId, body, agentName);
    if (!sent) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[admin/chat] reply failed:', error);
    return NextResponse.json({ error: 'Could not send the reply.' }, { status: 500 });
  }
}

/** Close or reopen a conversation. */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

    const { chatId } = await params;

    let payload: Record<string, unknown>;
    try {
      payload = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
    }

    if (payload.status !== 'open' && payload.status !== 'closed') {
      return NextResponse.json({ error: 'Status must be open or closed.' }, { status: 400 });
    }

    const updated = await setConversationStatus(chatId, payload.status);
    if (!updated) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[admin/chat] status change failed:', error);
    return NextResponse.json({ error: 'Could not update the conversation.' }, { status: 500 });
  }
}
