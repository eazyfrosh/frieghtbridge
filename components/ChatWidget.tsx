'use client';

import { CheckCircle2, LogOut, MessageCircle, Send, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { TextAreaField, TextField } from '@/components/ui/Field';
import { cn } from '@/lib/utils';

/**
 * Customer-facing live chat.
 *
 * Talks only to `/api/chat`, never to Firestore — the browser holds no
 * database handle and no Firebase credential, matching how the rest of the
 * site reads data. The visitor's identity lives in an httpOnly cookie the
 * server sets, so a conversation survives a reload and cannot be read by
 * script on the page.
 *
 * Updates arrive by polling rather than a live socket. It is the right trade
 * here: serverless functions cap connection lifetime, so a socket would spend
 * its time reconnecting, while a four-second poll costs one Firestore query
 * and is well inside what a support conversation needs. Polling stops entirely
 * when the tab is hidden or the panel is shut.
 */

interface ChatMessage {
  id: string;
  seq: number;
  body: string;
  sender: 'visitor' | 'agent';
  agentName?: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  name: string;
  status: 'open' | 'closed';
}

const POLL_OPEN_MS = 4000;

/**
 * How often to check for replies while the panel is shut.
 *
 * This is what decides how long someone who minimised the chat waits before
 * the badge tells them an answer arrived — so it is a responsiveness setting,
 * not a housekeeping one. An empty Firestore query still bills a read, so the
 * cost is one read per interval per idle tab; at fifteen seconds that is four
 * a minute, which is nothing against the free tier and keeps the notification
 * prompt enough to be useful.
 */
const POLL_BACKGROUND_MS = 15000;

function clockTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).format(
    new Date(iso),
  );
}

export function ChatWidget() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState(true);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unseen, setUnseen] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  /** Ending a chat destroys this browser's access to it, so it asks first. */
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [ended, setEnded] = useState(false);

  // Refs the poller reads, so it never closes over stale state.
  const cursorRef = useRef<number | null>(null);
  const openRef = useRef(false);
  const seenIdsRef = useRef<Set<string>>(new Set());

  const listRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const startFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  /** Merge polled messages, de-duplicating on id and advancing the cursor. */
  const merge = useCallback((incoming: ChatMessage[]) => {
    if (incoming.length === 0) return;

    // The cursor makes duplicates impossible, but a retried request or a
    // double-mount in development can still deliver one. Cheap to be certain.
    const fresh = incoming.filter((message) => !seenIdsRef.current.has(message.id));
    if (fresh.length === 0) return;

    for (const message of fresh) {
      seenIdsRef.current.add(message.id);
      if (message.seq > (cursorRef.current ?? 0)) cursorRef.current = message.seq;
    }

    setMessages((current) => [...current, ...fresh].sort((a, b) => a.seq - b.seq));

    if (!openRef.current) {
      const replies = fresh.filter((message) => message.sender === 'agent').length;
      if (replies > 0) setUnseen((count) => count + replies);
    }
  }, []);

  // Initial load: does this visitor already have a conversation?
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch('/api/chat');
        if (!response.ok) throw new Error('unavailable');
        const data = (await response.json()) as {
          available: boolean;
          conversation: Conversation | null;
          messages: ChatMessage[];
        };
        if (cancelled) return;

        setAvailable(data.available);
        setConversation(data.conversation);
        merge(data.messages ?? []);
      } catch {
        if (!cancelled) setAvailable(false);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [merge]);

  const poll = useCallback(async () => {
    if (document.hidden) return;
    try {
      const after = cursorRef.current;
      const response = await fetch(`/api/chat/messages${after ? `?after=${after}` : ''}`);
      if (!response.ok) return;
      const data = (await response.json()) as { status: 'open' | 'closed'; messages: ChatMessage[] };
      merge(data.messages ?? []);
      setConversation((current) => (current ? { ...current, status: data.status } : current));
    } catch {
      // A dropped poll is not worth reporting; the next one covers it.
    }
  }, [merge]);

  useEffect(() => {
    if (!conversation) return;
    const interval = window.setInterval(poll, open ? POLL_OPEN_MS : POLL_BACKGROUND_MS);
    return () => window.clearInterval(interval);
  }, [conversation, open, poll]);

  // Catch up immediately when the visitor comes back to the tab.
  useEffect(() => {
    if (!conversation) return;
    const onVisible = () => {
      if (!document.hidden) void poll();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [conversation, poll]);

  // Keep the newest message in view.
  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;
    setUnseen(0);
    // The shared Field components do not forward refs, so reach for the first
    // input rather than change a component the rest of the site depends on.
    const focusTarget = conversation
      ? composerRef.current
      : startFormRef.current?.querySelector('input');
    focusTarget?.focus();
  }, [open, conversation]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  async function start(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setEnded(false);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message: draft, page: pathname }),
      });
      const data = (await response.json()) as { error?: string; conversationId?: string };

      if (!response.ok || !data.conversationId) {
        setError(data.error ?? 'Could not start the chat. Please try again.');
        return;
      }

      setConversation({ id: data.conversationId, name, status: 'open' });
      setDraft('');
      // The opening message was written with the conversation; fetch it back
      // rather than guessing its id and timestamp.
      const initial = await fetch('/api/chat/messages');
      if (initial.ok) merge(((await initial.json()) as { messages: ChatMessage[] }).messages ?? []);
    } catch {
      setError('Could not reach the server. Check your connection.');
    } finally {
      setBusy(false);
    }
  }

  function send(event: FormEvent) {
    event.preventDefault();
    void submitMessage();
  }

  /**
   * End the chat: close it for the operator and drop this browser's access.
   *
   * Local state is reset regardless of what the server said. If the request
   * failed the visitor still asked for the conversation off their screen, and
   * leaving it on display because a write did not land is the wrong way to
   * fail — particularly on a shared computer, which is who this is for.
   */
  async function endChat() {
    setBusy(true);
    try {
      await fetch('/api/chat', { method: 'DELETE' });
    } catch {
      // Deliberately ignored — see above.
    } finally {
      setConversation(null);
      setMessages([]);
      setDraft('');
      setUnseen(0);
      setError(null);
      setConfirmEnd(false);
      setEnded(true);
      cursorRef.current = null;
      seenIdsRef.current = new Set();
      setBusy(false);
    }
  }

  async function submitMessage() {
    const body = draft.trim();
    if (!body || busy) return;

    setBusy(true);
    setError(null);
    setDraft('');

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? 'Message not sent.');
        // Hand the text back so it is not lost to a failed request.
        setDraft(body);
        return;
      }

      await poll();
    } catch {
      setError('Message not sent. Check your connection.');
      setDraft(body);
    } finally {
      setBusy(false);
      composerRef.current?.focus();
    }
  }

  // Nothing to offer if the server cannot store conversations — better no
  // widget than a button that fails when someone needs help.
  if (!ready || !available) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="chat-panel"
        aria-label={open ? 'Close chat' : unseen > 0 ? `Open chat, ${unseen} new` : 'Chat with us'}
        className={cn(
          'fixed bottom-5 right-5 z-[60] inline-flex h-14 w-14 items-center justify-center rounded-full',
          'bg-brand-500 text-ink-950 shadow-[0_8px_28px_rgba(18,18,18,0.22)]',
          'transition-transform duration-300 ease-premium hover:scale-105 motion-reduce:transition-none motion-reduce:hover:scale-100',
          'focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/40',
        )}
      >
        {open ? (
          <X className="h-6 w-6" aria-hidden="true" />
        ) : (
          <MessageCircle className="h-6 w-6" aria-hidden="true" />
        )}
        {!open && unseen > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-ink-950 px-1 text-[0.68rem] font-bold text-white"
          >
            {unseen > 9 ? '9+' : unseen}
          </span>
        )}
      </button>

      {open && (
        <div
          id="chat-panel"
          role="dialog"
          aria-label="Chat with FreightBridge Logistics"
          className={cn(
            'fixed bottom-24 right-5 z-[60] flex w-[min(23rem,calc(100vw-2.5rem))] flex-col',
            'h-[min(30rem,calc(100vh-9rem))] overflow-hidden rounded-2xl border border-ink-200 bg-white',
            'shadow-[0_24px_60px_rgba(18,18,18,0.24)]',
          )}
        >
          <div className="flex items-start gap-3 bg-ink-950 px-4 py-3.5">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500">
              <MessageCircle className="h-4 w-4 text-ink-950" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[0.98rem] font-semibold text-white">FreightBridge Logistics</p>
              <p className="text-xs text-ink-400">
                {conversation?.status === 'closed'
                  ? 'This conversation was closed — send a message to reopen it.'
                  : 'We usually reply within a few hours.'}
              </p>
            </div>
            {conversation && (
              <button
                type="button"
                onClick={() => setConfirmEnd(true)}
                className="mt-0.5 shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-ink-300 transition-colors hover:bg-ink-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                End chat
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Minimise chat"
              className="-mr-1 rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {confirmEnd && (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-[0.85rem] text-amber-900">
                End this chat? You won&rsquo;t be able to see these messages on this device afterwards.
              </p>
              <div className="mt-2.5 flex gap-2">
                <button
                  type="button"
                  onClick={() => void endChat()}
                  disabled={busy}
                  className="rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-ink-800 disabled:opacity-60"
                >
                  {busy ? 'Ending…' : 'Yes, end chat'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmEnd(false)}
                  className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100"
                >
                  Keep chatting
                </button>
              </div>
            </div>
          )}

          {conversation ? (
            <>
              <div
                ref={listRef}
                role="log"
                aria-live="polite"
                aria-relevant="additions"
                aria-label="Messages"
                className="flex-1 space-y-3 overflow-y-auto bg-ink-50 px-4 py-4"
              >
                {messages.map((message) => {
                  const mine = message.sender === 'visitor';
                  return (
                    <div key={message.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                      <div className="max-w-[85%]">
                        {!mine && message.agentName && (
                          <p className="mb-1 pl-1 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-ink-500">
                            {message.agentName}
                          </p>
                        )}
                        <div
                          className={cn(
                            'whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[0.9rem] leading-relaxed',
                            mine
                              ? 'rounded-br-md bg-brand-500 text-ink-950'
                              : 'rounded-bl-md border border-ink-200 bg-white text-ink-800',
                          )}
                        >
                          {message.body}
                        </div>
                        <p
                          className={cn(
                            'mt-1 text-[0.68rem] text-ink-400',
                            mine ? 'pr-1 text-right' : 'pl-1',
                          )}
                        >
                          {clockTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={send} className="border-t border-ink-200 bg-white p-3">
                {error && (
                  <p role="alert" className="mb-2 text-xs text-red-600">
                    {error}
                  </p>
                )}
                <div className="flex items-end gap-2">
                  <label htmlFor="chat-draft" className="sr-only">
                    Your message
                  </label>
                  <textarea
                    id="chat-draft"
                    ref={composerRef}
                    rows={1}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      // Enter sends, Shift+Enter makes a new line — what people
                      // expect from a chat box rather than a form field.
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void submitMessage();
                      }
                    }}
                    placeholder="Write a message…"
                    maxLength={2000}
                    className="max-h-28 min-h-[2.75rem] flex-1 resize-none rounded-xl border border-ink-200 px-3.5 py-3 text-[0.9rem] text-ink-900 placeholder:text-ink-300 focus:border-brand-500 focus:outline-none focus:shadow-[0_0_0_4px_rgba(255,106,0,0.14)]"
                  />
                  <button
                    type="submit"
                    disabled={busy || !draft.trim()}
                    aria-label="Send message"
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-ink-950 transition-colors duration-200 hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/40"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <form ref={startFormRef} onSubmit={start} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {ended && (
                <p
                  role="status"
                  className="flex items-start gap-2 rounded-xl bg-green-50 px-3 py-2.5 text-[0.85rem] text-green-800"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  Chat ended. Start a new one below whenever you need us.
                </p>
              )}

              <p className="text-[0.88rem] leading-relaxed text-ink-600">
                Tell us how to reach you and we&rsquo;ll pick this up — by chat if you stay, by email if
                you don&rsquo;t.
              </p>

              <TextField
                id="chat-name"
                label="Name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
              />
              <TextField
                id="chat-email"
                label="Email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
              <TextAreaField
                id="chat-message"
                label="How can we help?"
                required
                rows={3}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={2000}
              />

              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 text-[0.95rem] font-semibold text-ink-950 transition-colors duration-200 hover:bg-brand-400 disabled:cursor-progress disabled:opacity-70 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/40"
              >
                {busy ? 'Starting…' : 'Start chat'}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
