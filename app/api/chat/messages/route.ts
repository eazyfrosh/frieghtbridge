import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  CHAT_COOKIE,
  addVisitorMessage,
  conversationForVisitor,
  decodeChatCookie,
  cursorParam,
  messagesAfter,
  validMessage,
} from '@/lib/chat';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Resolve the caller's conversation from their cookie.
 *
 * Every message route starts here: the cookie is the only thing that grants
 * access to a conversation, and it is verified against the stored secret hash
 * on each request rather than trusted for holding a plausible id.
 */
async function authorise() {
  const identity = decodeChatCookie((await cookies()).get(CHAT_COOKIE)?.value);
  if (!identity) return null;
  return conversationForVisitor(identity.id, identity.secret);
}

/** Poll for messages after sequence number `after`. Omit it for the full history. */
export async function GET(request: Request) {
  try {
    const conversation = await authorise();
    if (!conversation) {
      return NextResponse.json({ error: 'No active conversation.' }, { status: 404 });
    }

    return NextResponse.json({
      status: conversation.status,
      messages: await messagesAfter(conversation.id, cursorParam(request)),
    });
  } catch (error) {
    console.error('[chat] poll failed:', error);
    return NextResponse.json({ error: 'Could not load messages.' }, { status: 500 });
  }
}

/** Send a message as the visitor. */
export async function POST(request: Request) {
  try {
    const conversation = await authorise();
    if (!conversation) {
      return NextResponse.json({ error: 'No active conversation.' }, { status: 404 });
    }

    let payload: Record<string, unknown>;
    try {
      payload = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
    }

    const body = validMessage(payload.body);
    if (!body) {
      return NextResponse.json({ error: 'Message is empty or too long.' }, { status: 400 });
    }

    const sent = await addVisitorMessage(conversation.id, body);
    if (!sent) {
      return NextResponse.json(
        { error: 'You are sending messages very quickly. Give it a moment.' },
        { status: 429 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[chat] send failed:', error);
    return NextResponse.json({ error: 'Could not send the message.' }, { status: 500 });
  }
}
