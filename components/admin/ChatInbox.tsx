'use client';

import { ArrowLeft, CheckCircle2, Inbox, RotateCcw, Send } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { cn, timeAgo } from '@/lib/utils';

/**
 * Operator inbox for live chat.
 *
 * Two panes on desktop, one at a time on mobile — a phone cannot usefully show
 * a list and a conversation at once, and replying on a phone is the case that
 * matters most for a support queue.
 *
 * The list and the open conversation poll on separate intervals: the list
 * rarely changes and a stale row costs nothing, while an open conversation is
 * someone waiting for an answer.
 */

interface Conversation {
  id: string;
  name: string;
  email: string;
  status: 'open' | 'closed';
  createdAt: string;
  lastMessage: string;
  lastMessageAt: string;
  lastSender: 'visitor' | 'agent';
  unreadForAdmin: number;
  page: string;
  endedBy: 'visitor' | 'agent' | null;
}

interface ChatMessage {
  id: string;
  seq: number;
  body: string;
  sender: 'visitor' | 'agent';
  agentName?: string;
  createdAt: string;
}

const LIST_POLL_MS = 8000;
const THREAD_POLL_MS = 4000;

function clockTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).format(
    new Date(iso),
  );
}

export function ChatInbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'open' | 'all'>('open');

  const cursorRef = useRef<number | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const threadRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const selected = conversations.find((item) => item.id === selectedId) ?? null;

  const loadList = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/chat');
      if (!response.ok) {
        if (response.status === 401) setError('Your session expired. Reload the page to sign in again.');
        return;
      }
      const data = (await response.json()) as { conversations: Conversation[] };
      setConversations(data.conversations ?? []);
    } catch {
      // Transient; the next tick retries.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
    const interval = window.setInterval(() => {
      if (!document.hidden) void loadList();
    }, LIST_POLL_MS);
    return () => window.clearInterval(interval);
  }, [loadList]);

  const merge = useCallback((incoming: ChatMessage[]) => {
    const fresh = incoming.filter((message) => !seenIdsRef.current.has(message.id));
    if (fresh.length === 0) return;

    for (const message of fresh) {
      seenIdsRef.current.add(message.id);
      if (message.seq > (cursorRef.current ?? 0)) cursorRef.current = message.seq;
    }

    setMessages((current) => [...current, ...fresh].sort((a, b) => a.seq - b.seq));
  }, []);

  /** Open a conversation from scratch: resets the cursor and clears its badge. */
  const openConversation = useCallback(
    async (id: string) => {
      setSelectedId(id);
      setMessages([]);
      setDraft('');
      setError(null);
      cursorRef.current = null;
      seenIdsRef.current = new Set();

      try {
        const response = await fetch(`/api/admin/chat/${id}`);
        if (!response.ok) {
          setError('Could not open that conversation.');
          return;
        }
        const data = (await response.json()) as { messages: ChatMessage[] };
        merge(data.messages ?? []);
        // The server cleared the unread count; reflect it without a round trip.
        setConversations((current) =>
          current.map((item) => (item.id === id ? { ...item, unreadForAdmin: 0 } : item)),
        );
      } catch {
        setError('Could not open that conversation.');
      }
    },
    [merge],
  );

  // Poll the open conversation for the visitor's replies.
  useEffect(() => {
    if (!selectedId) return;

    const tick = async () => {
      if (document.hidden) return;
      try {
        const after = cursorRef.current;
        const response = await fetch(
          `/api/admin/chat/${selectedId}${after ? `?after=${after}` : ''}`,
        );
        if (!response.ok) return;
        const data = (await response.json()) as { messages: ChatMessage[] };
        merge(data.messages ?? []);
      } catch {
        // Ignored — the next tick retries.
      }
    };

    const interval = window.setInterval(tick, THREAD_POLL_MS);
    return () => window.clearInterval(interval);
  }, [selectedId, merge]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [messages]);

  async function submitReply() {
    const body = draft.trim();
    if (!body || !selectedId || busy) return;

    setBusy(true);
    setError(null);
    setDraft('');

    try {
      const response = await fetch(`/api/admin/chat/${selectedId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? 'Reply not sent.');
        setDraft(body);
        return;
      }

      const after = cursorRef.current;
      const refreshed = await fetch(`/api/admin/chat/${selectedId}${after ? `?after=${after}` : ''}`);
      if (refreshed.ok) merge(((await refreshed.json()) as { messages: ChatMessage[] }).messages ?? []);
      void loadList();
    } catch {
      setError('Reply not sent. Check your connection.');
      setDraft(body);
    } finally {
      setBusy(false);
      composerRef.current?.focus();
    }
  }

  function reply(event: FormEvent) {
    event.preventDefault();
    void submitReply();
  }

  async function setStatus(status: 'open' | 'closed') {
    if (!selectedId) return;
    await fetch(`/api/admin/chat/${selectedId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(() => null);
    void loadList();
  }

  const visible = conversations.filter((item) => filter === 'all' || item.status === 'open');
  const unreadTotal = conversations.reduce((sum, item) => sum + item.unreadForAdmin, 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200 bg-surface">
      <div className="grid min-h-[32rem] lg:grid-cols-[20rem_1fr]">
        {/* Conversation list */}
        <div className={cn('border-ink-200 lg:border-r', selected && 'hidden lg:block')}>
          <div className="flex items-center gap-2 border-b border-ink-200 px-4 py-3">
            <div className="flex rounded-lg bg-ink-100 p-0.5">
              {(['open', 'all'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  aria-pressed={filter === value}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-semibold capitalize transition-colors',
                    filter === value ? 'bg-surface text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800',
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
            {unreadTotal > 0 && (
              <span className="ml-auto rounded-full bg-brand-500 px-2 py-0.5 text-[0.68rem] font-bold text-night-950">
                {unreadTotal} new
              </span>
            )}
          </div>

          <ul className="max-h-[32rem] divide-y divide-ink-100 overflow-y-auto">
            {loading && <li className="px-4 py-8 text-center text-sm text-ink-400">Loading…</li>}

            {!loading && visible.length === 0 && (
              <li className="px-4 py-12 text-center">
                <Inbox className="mx-auto h-8 w-8 text-ink-300" aria-hidden="true" />
                <p className="mt-3 text-sm text-ink-500">
                  {filter === 'open' ? 'No open conversations.' : 'No conversations yet.'}
                </p>
              </li>
            )}

            {visible.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => void openConversation(item.id)}
                  aria-current={item.id === selectedId ? 'true' : undefined}
                  className={cn(
                    'w-full px-4 py-3 text-left transition-colors',
                    item.id === selectedId ? 'bg-brand-50 dark:bg-brand-500/10' : 'hover:bg-ink-50',
                  )}
                >
                  <div className="flex items-baseline gap-2">
                    <span className="truncate text-[0.92rem] font-semibold text-ink-900">{item.name}</span>
                    {item.unreadForAdmin > 0 && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-label="Unread" />
                    )}
                    <span className="ml-auto shrink-0 text-[0.7rem] text-ink-400">
                      {timeAgo(item.lastMessageAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[0.82rem] text-ink-500">
                    {item.lastSender === 'agent' && <span className="text-ink-400">You: </span>}
                    {item.lastMessage}
                  </p>
                  {item.status === 'closed' && (
                    <span className="mt-1 inline-block rounded bg-ink-100 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-ink-500">
                      {item.endedBy === 'visitor' ? 'Ended by visitor' : 'Closed'}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Thread */}
        {selected ? (
          <div className="flex min-h-[32rem] flex-col">
            <div className="flex items-center gap-3 border-b border-ink-200 px-4 py-3">
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label="Back to conversations"
                className="-ml-1 rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900 lg:hidden"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.95rem] font-semibold text-ink-900">{selected.name}</p>
                <p className="truncate text-xs text-ink-500">
                  <a href={`mailto:${selected.email}`} className="underline decoration-ink-300 underline-offset-2 hover:text-ink-800">
                    {selected.email}
                  </a>
                  <span className="mx-1.5">·</span>
                  started on {selected.page}
                  {selected.status === 'closed' && (
                    <>
                      <span className="mx-1.5">·</span>
                      <span className="font-medium text-ink-600">
                        {selected.endedBy === 'visitor' ? 'ended by the visitor' : 'closed'}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void setStatus(selected.status === 'open' ? 'closed' : 'open')}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-semibold text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900"
              >
                {selected.status === 'open' ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Close
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    Reopen
                  </>
                )}
              </button>
            </div>

            <div
              ref={threadRef}
              role="log"
              aria-live="polite"
              aria-relevant="additions"
              aria-label={`Conversation with ${selected.name}`}
              className="flex-1 space-y-3 overflow-y-auto bg-ink-50 px-4 py-4"
              style={{ maxHeight: '26rem' }}
            >
              {messages.map((message) => {
                const mine = message.sender === 'agent';
                return (
                  <div key={message.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                    <div className="max-w-[75%]">
                      <div
                        className={cn(
                          'whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[0.9rem] leading-relaxed',
                          mine
                            ? 'rounded-br-md bg-brand-500 text-night-950'
                            : 'rounded-bl-md border border-ink-200 bg-surface text-ink-800',
                        )}
                      >
                        {message.body}
                      </div>
                      <p className={cn('mt-1 text-[0.68rem] text-ink-400', mine ? 'pr-1 text-right' : 'pl-1')}>
                        {clockTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={reply} className="border-t border-ink-200 p-3">
              {error && (
                <p role="alert" className="mb-2 text-xs text-red-600 dark:text-red-300">
                  {error}
                </p>
              )}
              <div className="flex items-end gap-2">
                <label htmlFor="admin-reply" className="sr-only">
                  Your reply
                </label>
                <textarea
                  id="admin-reply"
                  ref={composerRef}
                  rows={1}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void submitReply();
                    }
                  }}
                  placeholder={`Reply to ${selected.name}…`}
                  maxLength={2000}
                  className="max-h-32 min-h-[2.75rem] flex-1 resize-none rounded-xl border border-ink-200 px-3.5 py-3 text-[0.9rem] text-ink-900 placeholder:text-ink-300 focus:border-brand-500 focus:outline-none focus:shadow-[0_0_0_4px_rgba(255,106,0,0.14)]"
                />
                <button
                  type="submit"
                  disabled={busy || !draft.trim()}
                  className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-brand-500 px-4 text-[0.9rem] font-semibold text-night-950 transition-colors hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Send
                </button>
              </div>
              <p className="mt-1.5 px-1 text-[0.7rem] text-ink-400">
                Enter sends · Shift + Enter adds a line
              </p>
            </form>
          </div>
        ) : (
          <div className="hidden flex-col items-center justify-center gap-2 p-12 text-center lg:flex">
            <Inbox className="h-9 w-9 text-ink-300" aria-hidden="true" />
            <p className="text-sm text-ink-500">Choose a conversation to read and reply.</p>
          </div>
        )}
      </div>
    </div>
  );
}
