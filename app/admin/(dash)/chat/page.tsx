import { ChatInbox } from '@/components/admin/ChatInbox';
import { chatAvailable } from '@/lib/chat';

export const metadata = { title: 'Live chat' };

export default function AdminChatPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-2xl font-semibold tracking-[-0.025em] text-ink-900 sm:text-3xl">
        Live chat
      </h1>
      <p className="mt-1.5 text-[0.95rem] text-ink-500">
        Messages from the website. Replies appear in the visitor&rsquo;s chat window within a few seconds.
      </p>

      <div className="mt-6">
        {chatAvailable() ? (
          <ChatInbox />
        ) : (
          <p className="rounded-2xl border border-ink-200 bg-white px-5 py-8 text-center text-sm text-ink-500">
            Chat needs Firestore. Set <code className="font-mono text-ink-700">FIREBASE_SERVICE_ACCOUNT_KEY</code>{' '}
            on this deployment and the inbox will appear here.
          </p>
        )}
      </div>
    </div>
  );
}
