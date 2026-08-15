import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  CHAT_COOKIE,
  chatAvailable,
  conversationForVisitor,
  decodeChatCookie,
  encodeChatCookie,
  messagesAfter,
  startConversation,
  validEmail,
  validMessage,
  validName,
} from '@/lib/chat';

// Firestore access goes through the Admin SDK, which is Node-only.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

function chatCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  };
}

/**
 * The visitor's own IP, as the proxy reports it.
 *
 * `x-forwarded-for` is client-controllable in principle, but on Vercel the
 * platform appends the real peer address and reads the leftmost entry as the
 * client. Worst case a determined spammer rotates the header and defeats the
 * per-IP limit on starting conversations; the per-conversation flood limit is
 * enforced in the write transaction and does not depend on this.
 */
async function clientIp(): Promise<string> {
  const forwarded = (await headers()).get('x-forwarded-for') ?? '';
  return forwarded.split(',')[0]?.trim() || 'unknown';
}

/** Current conversation for whoever holds the cookie, with its history. */
export async function GET() {
  try {
    if (!chatAvailable()) {
      return NextResponse.json({ available: false, conversation: null, messages: [] });
    }

    const identity = decodeChatCookie((await cookies()).get(CHAT_COOKIE)?.value);
    if (!identity) {
      return NextResponse.json({ available: true, conversation: null, messages: [] });
    }

    const conversation = await conversationForVisitor(identity.id, identity.secret);
    if (!conversation) {
      // Stale or forged cookie. Report no conversation rather than an error —
      // the widget simply offers to start a new one.
      return NextResponse.json({ available: true, conversation: null, messages: [] });
    }

    return NextResponse.json({
      available: true,
      conversation,
      messages: await messagesAfter(conversation.id, null),
    });
  } catch (error) {
    console.error('[chat] GET failed:', error);
    return NextResponse.json({ error: 'Chat is unavailable right now.' }, { status: 500 });
  }
}

/** Start a conversation. The opening message is posted with it. */
export async function POST(request: Request) {
  try {
    if (!chatAvailable()) {
      return NextResponse.json({ error: 'Chat is not available on this deployment.' }, { status: 503 });
    }

    let payload: Record<string, unknown>;
    try {
      payload = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
    }

    const name = validName(payload.name);
    const email = validEmail(payload.email);
    const message = validMessage(payload.message);

    if (!name) return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
    if (!email) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    if (!message) return NextResponse.json({ error: 'Please enter a message.' }, { status: 400 });

    const page = typeof payload.page === 'string' ? payload.page.slice(0, 200) : '/';

    const started = await startConversation({ name, email, message, page, ip: await clientIp() });
    if (!started) {
      return NextResponse.json(
        { error: 'Too many chats started from this connection. Please try again later.' },
        { status: 429 },
      );
    }

    const response = NextResponse.json({ ok: true, conversationId: started.id });
    response.cookies.set(CHAT_COOKIE, encodeChatCookie(started.id, started.secret), chatCookieOptions());
    return response;
  } catch (error) {
    console.error('[chat] POST failed:', error);
    return NextResponse.json({ error: 'Could not start the chat.' }, { status: 500 });
  }
}

/** Leave the conversation on this device: clears the cookie, keeps the record. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(CHAT_COOKIE, '', { ...chatCookieOptions(), maxAge: 0 });
  return response;
}
