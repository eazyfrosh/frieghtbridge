import 'server-only';

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import { adminDb } from './firebase/admin';

/**
 * Live chat, stored in Firestore and reached only through the server.
 *
 * This follows the same shape as `lib/shipments.ts`: every read and write goes
 * through the Admin SDK, and `firestore.rules` denies all client access. The
 * browser never holds a Firestore handle, so there is no rule to get wrong and
 * no anonymous-auth provider to enable.
 *
 * The visitor's credential is a random secret in an httpOnly cookie, paired
 * with the conversation id. Only its SHA-256 is stored, so a leaked database
 * export does not hand over live conversations — the same reason password
 * hashes exist. Comparison is constant-time.
 */

const CHATS = 'chats';
const MESSAGES = 'messages';
const RATE_LIMITS = 'chatRateLimits';

export const CHAT_COOKIE = 'fb_chat';
export const MAX_MESSAGE_LENGTH = 2000;
const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 254;
const PREVIEW_LENGTH = 140;

/** Per conversation. Generous for a real person, useless for a script. */
const MESSAGE_WINDOW_MS = 60_000;
const MESSAGES_PER_WINDOW = 20;

/** Per IP. Starting a conversation is the expensive, spammable operation. */
const NEW_CHAT_WINDOW_MS = 60 * 60_000;
const NEW_CHATS_PER_WINDOW = 5;

/**
 * Messages carry a per-conversation sequence number, and polls ask for
 * everything after the highest one they hold.
 *
 * A timestamp cursor was the obvious choice and the wrong one. Wall-clock
 * ordering across serverless instances is not guaranteed, so a comparison on
 * `createdAt` can drop a message that was written a few milliseconds "in the
 * past" by another instance. Widening the window to compensate means the
 * newest message matches its own cursor and is re-sent on every poll, forever.
 * A counter assigned inside the write transaction has neither problem: it is
 * exact, monotonic, and cannot skew.
 */

export type ChatSender = 'visitor' | 'agent';
export type ChatStatus = 'open' | 'closed';

export interface ChatMessage {
  id: string;
  /** Position in the conversation, from 1. The polling cursor. */
  seq: number;
  body: string;
  sender: ChatSender;
  /** Present on agent messages so the visitor sees who replied. */
  agentName?: string;
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  name: string;
  email: string;
  status: ChatStatus;
  createdAt: string;
  lastMessage: string;
  lastMessageAt: string;
  lastSender: ChatSender;
  unreadForAdmin: number;
  /** The page the visitor was on when they opened the chat. */
  page: string;
}

// ---------------------------------------------------------------------------
// Validation

export function validMessage(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const body = raw.trim();
  if (!body || body.length > MAX_MESSAGE_LENGTH) return null;
  return body;
}

export function validName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const name = raw.trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > MAX_NAME_LENGTH) return null;
  return name;
}

export function validEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const email = raw.trim().toLowerCase();
  if (email.length > MAX_EMAIL_LENGTH) return null;
  // Deliberately loose. Address syntax is a poor proxy for deliverability, and
  // rejecting an unusual but valid address is worse than accepting a typo.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

// ---------------------------------------------------------------------------
// Credentials

function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

/** Constant-time, and never throws on length mismatch the way `equal` does. */
function secretMatches(secret: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashSecret(secret), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

/** `<conversationId>.<secret>` — what the httpOnly cookie carries. */
export function encodeChatCookie(id: string, secret: string): string {
  return `${id}.${secret}`;
}

export function decodeChatCookie(value: string | undefined): { id: string; secret: string } | null {
  if (!value) return null;
  const separator = value.indexOf('.');
  if (separator <= 0) return null;
  const id = value.slice(0, separator);
  const secret = value.slice(separator + 1);
  if (!id || !secret) return null;
  return { id, secret };
}

// ---------------------------------------------------------------------------
// Serialisation

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return new Date(0).toISOString();
}

function toConversation(id: string, data: FirebaseFirestore.DocumentData): ChatConversation {
  return {
    id,
    name: typeof data.name === 'string' ? data.name : 'Visitor',
    email: typeof data.email === 'string' ? data.email : '',
    status: data.status === 'closed' ? 'closed' : 'open',
    createdAt: toIso(data.createdAt),
    lastMessage: typeof data.lastMessage === 'string' ? data.lastMessage : '',
    lastMessageAt: toIso(data.lastMessageAt),
    lastSender: data.lastSender === 'agent' ? 'agent' : 'visitor',
    unreadForAdmin: typeof data.unreadForAdmin === 'number' ? data.unreadForAdmin : 0,
    page: typeof data.page === 'string' ? data.page : '/',
  };
}

function toMessage(id: string, data: FirebaseFirestore.DocumentData): ChatMessage {
  return {
    id,
    seq: typeof data.seq === 'number' ? data.seq : 0,
    body: typeof data.body === 'string' ? data.body : '',
    sender: data.sender === 'agent' ? 'agent' : 'visitor',
    agentName: typeof data.agentName === 'string' ? data.agentName : undefined,
    createdAt: toIso(data.createdAt),
  };
}

function preview(body: string): string {
  const flat = body.replace(/\s+/g, ' ').trim();
  return flat.length > PREVIEW_LENGTH ? `${flat.slice(0, PREVIEW_LENGTH - 1)}…` : flat;
}

// ---------------------------------------------------------------------------
// Rate limiting
//
// Kept in Firestore rather than in memory because serverless instances are
// per-request and short-lived: an in-process counter would reset constantly and
// limit nothing. One transaction per attempt is a fair price for a limit that
// actually holds.

async function withinRateLimit(db: Firestore, key: string, windowMs: number, max: number): Promise<boolean> {
  const ref = db.collection(RATE_LIMITS).doc(createHash('sha256').update(key).digest('hex'));

  try {
    return await db.runTransaction(async (tx) => {
      const snapshot = await tx.get(ref);
      const now = Date.now();
      const data = snapshot.data();
      const startedAt = data?.startedAt instanceof Timestamp ? data.startedAt.toMillis() : 0;
      const count = typeof data?.count === 'number' ? data.count : 0;

      if (now - startedAt > windowMs) {
        tx.set(ref, { startedAt: Timestamp.fromMillis(now), count: 1 });
        return true;
      }
      if (count >= max) return false;

      tx.set(ref, { startedAt: Timestamp.fromMillis(startedAt), count: count + 1 });
      return true;
    });
  } catch (error) {
    // A limiter that fails closed would take chat down with it. Log and allow —
    // the message-length and validation limits still apply.
    console.error('[chat] rate limit check failed:', error);
    return true;
  }
}

// ---------------------------------------------------------------------------
// Conversations

export interface StartResult {
  id: string;
  secret: string;
}

/**
 * Create a conversation and post the visitor's opening message.
 *
 * Returns `null` when rate limited so the caller can answer 429 without
 * learning anything about other visitors' activity.
 */
export async function startConversation(input: {
  name: string;
  email: string;
  message: string;
  page: string;
  ip: string;
}): Promise<StartResult | null> {
  const db = adminDb();
  if (!db) return null;

  if (!(await withinRateLimit(db, `new-chat:${input.ip}`, NEW_CHAT_WINDOW_MS, NEW_CHATS_PER_WINDOW))) {
    return null;
  }

  const secret = randomBytes(32).toString('hex');
  const ref = db.collection(CHATS).doc();
  const now = Timestamp.now();

  const batch = db.batch();
  batch.set(ref, {
    secretHash: hashSecret(secret),
    name: input.name,
    email: input.email,
    page: input.page,
    status: 'open' satisfies ChatStatus,
    createdAt: now,
    lastMessage: preview(input.message),
    lastMessageAt: now,
    lastSender: 'visitor' satisfies ChatSender,
    unreadForAdmin: 1,
    messageWindowStart: now,
    messageWindowCount: 1,
    messageSeq: 1,
  });
  batch.set(ref.collection(MESSAGES).doc(), {
    seq: 1,
    body: input.message,
    sender: 'visitor' satisfies ChatSender,
    createdAt: now,
  });
  await batch.commit();

  return { id: ref.id, secret };
}

/** The visitor's conversation, or null if the cookie does not authorise it. */
export async function conversationForVisitor(
  id: string,
  secret: string,
): Promise<ChatConversation | null> {
  const db = adminDb();
  if (!db) return null;

  const snapshot = await db.collection(CHATS).doc(id).get();
  const data = snapshot.data();
  if (!snapshot.exists || !data) return null;
  if (typeof data.secretHash !== 'string' || !secretMatches(secret, data.secretHash)) return null;

  return toConversation(snapshot.id, data);
}

export async function getConversation(id: string): Promise<ChatConversation | null> {
  const db = adminDb();
  if (!db) return null;
  const snapshot = await db.collection(CHATS).doc(id).get();
  const data = snapshot.data();
  if (!snapshot.exists || !data) return null;
  return toConversation(snapshot.id, data);
}

/**
 * Newest activity first, so the inbox opens on whatever needs attention.
 * Ordering on `lastMessageAt` alone needs no composite index.
 */
export async function listConversations(limit = 50): Promise<ChatConversation[]> {
  const db = adminDb();
  if (!db) return [];

  const snapshot = await db.collection(CHATS).orderBy('lastMessageAt', 'desc').limit(limit).get();
  return snapshot.docs.map((doc) => toConversation(doc.id, doc.data()));
}

/**
 * `?after=<seq>` — the highest sequence number the caller already holds.
 *
 * Anything unparseable is treated as absent, which returns the full history:
 * a client with a corrupt cursor gets a slightly expensive but correct answer
 * rather than silently missing messages.
 */
export function cursorParam(request: Request): number | null {
  const raw = new URL(request.url).searchParams.get('after');
  if (raw === null) return null;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

/**
 * Messages after `afterSeq`, oldest first. Pass null for the whole history.
 *
 * Filtering and ordering on the same field needs no composite index.
 */
export async function messagesAfter(id: string, afterSeq: number | null): Promise<ChatMessage[]> {
  const db = adminDb();
  if (!db) return [];

  let query = db.collection(CHATS).doc(id).collection(MESSAGES).orderBy('seq', 'asc');
  if (afterSeq !== null) query = query.where('seq', '>', afterSeq);

  const snapshot = await query.limit(200).get();
  return snapshot.docs.map((doc) => toMessage(doc.id, doc.data()));
}

/**
 * Append a visitor message, enforcing the per-conversation flood limit inside
 * the same transaction that writes it — so the check cannot be raced.
 *
 * Returns false when the limit is hit, or the conversation is gone.
 */
export async function addVisitorMessage(id: string, body: string): Promise<boolean> {
  const db = adminDb();
  if (!db) return false;

  const chatRef = db.collection(CHATS).doc(id);

  return db.runTransaction(async (tx) => {
    const snapshot = await tx.get(chatRef);
    const data = snapshot.data();
    if (!snapshot.exists || !data) return false;

    const now = Timestamp.now();
    const windowStart =
      data.messageWindowStart instanceof Timestamp ? data.messageWindowStart.toMillis() : 0;
    const windowCount = typeof data.messageWindowCount === 'number' ? data.messageWindowCount : 0;
    const fresh = now.toMillis() - windowStart > MESSAGE_WINDOW_MS;

    if (!fresh && windowCount >= MESSAGES_PER_WINDOW) return false;

    const seq = (typeof data.messageSeq === 'number' ? data.messageSeq : 0) + 1;

    tx.set(chatRef.collection(MESSAGES).doc(), {
      seq,
      body,
      sender: 'visitor' satisfies ChatSender,
      createdAt: now,
    });

    tx.update(chatRef, {
      messageSeq: seq,
      lastMessage: preview(body),
      lastMessageAt: now,
      lastSender: 'visitor' satisfies ChatSender,
      // A visitor replying to a closed conversation reopens it, rather than
      // shouting into a thread no operator will ever look at again.
      status: 'open' satisfies ChatStatus,
      unreadForAdmin: (typeof data.unreadForAdmin === 'number' ? data.unreadForAdmin : 0) + 1,
      messageWindowStart: fresh ? now : Timestamp.fromMillis(windowStart),
      messageWindowCount: fresh ? 1 : windowCount + 1,
    });

    return true;
  });
}

export async function addAgentMessage(id: string, body: string, agentName: string): Promise<boolean> {
  const db = adminDb();
  if (!db) return false;

  const chatRef = db.collection(CHATS).doc(id);

  // A transaction rather than a batch: the sequence number has to be read and
  // written atomically, or two operators replying at once would collide on it
  // and one message would be skipped by every poll that had passed that point.
  return db.runTransaction(async (tx) => {
    const snapshot = await tx.get(chatRef);
    const data = snapshot.data();
    if (!snapshot.exists || !data) return false;

    const now = Timestamp.now();
    const seq = (typeof data.messageSeq === 'number' ? data.messageSeq : 0) + 1;

    tx.set(chatRef.collection(MESSAGES).doc(), {
      seq,
      body,
      sender: 'agent' satisfies ChatSender,
      agentName,
      createdAt: now,
    });
    tx.update(chatRef, {
      messageSeq: seq,
      lastMessage: preview(body),
      lastMessageAt: now,
      lastSender: 'agent' satisfies ChatSender,
      // Replying is itself an acknowledgement; nothing is left unread.
      unreadForAdmin: 0,
    });

    return true;
  });
}

export async function markReadByAdmin(id: string): Promise<void> {
  const db = adminDb();
  if (!db) return;
  await db.collection(CHATS).doc(id).update({ unreadForAdmin: 0 }).catch(() => {});
}

export async function setConversationStatus(id: string, status: ChatStatus): Promise<boolean> {
  const db = adminDb();
  if (!db) return false;
  try {
    await db.collection(CHATS).doc(id).update({ status });
    return true;
  } catch {
    return false;
  }
}

/** Whether chat can work at all — the widget hides itself when it cannot. */
export function chatAvailable(): boolean {
  return adminDb() !== null;
}
