'use client';

import { AlertCircle, CheckCircle2, Eye, Mail, Send } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { cn, formatDateTime } from '@/lib/utils';

/**
 * Send a shipment notification from the shipment's own page.
 *
 * Preview is not optional decoration. These emails go to customers and the
 * templates contain placeholders that only resolve against a real shipment, so
 * the operator sees the exact text — rendered by the same code that sends it —
 * before anything leaves.
 */

interface TemplateSummary {
  id: string;
  name: string;
  description: string;
}

interface SendLogEntry {
  id: string;
  templateName: string;
  to: string;
  subject: string;
  sentAt: string;
  sentBy: string;
  ok: boolean;
  error: string | null;
}

interface NotifyPanelProps {
  trackingNumber: string;
  templates: TemplateSummary[];
  history: SendLogEntry[];
  /** False when RESEND_API_KEY / EMAIL_FROM are missing on this deployment. */
  configured: boolean;
  configError: string | null;
  /** From the booking, when there was one. Both fields stay editable. */
  customer?: { name: string; email: string } | null;
}

export function NotifyPanel({
  trackingNumber,
  templates,
  history: initialHistory,
  configured,
  configError,
  customer,
}: NotifyPanelProps) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '');
  // Prefilled from the booking. Retyping an address that is already on the
  // record is how the wrong customer gets an email about someone else's
  // shipment.
  const [to, setTo] = useState(customer?.email ?? '');
  const [recipientName, setRecipientName] = useState(customer?.name ?? '');
  const [preview, setPreview] = useState<{ subject: string; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [history, setHistory] = useState(initialHistory);

  const loadPreview = useCallback(async () => {
    if (!templateId) return;
    setBusy(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, trackingNumber, recipientName, preview: true }),
      });
      const data = (await response.json()) as {
        preview?: { subject: string; text: string };
        error?: string;
      };
      if (!response.ok || !data.preview) {
        setError(data.error ?? 'Could not render a preview.');
        return;
      }
      setPreview(data.preview);
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  }, [templateId, trackingNumber, recipientName]);

  // Re-render whenever the choice of template or the recipient's name changes,
  // so the preview is never showing a different email from the one selected.
  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  async function send() {
    setSending(true);
    setError(null);
    setSent(null);

    try {
      const response = await fetch('/api/admin/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, trackingNumber, recipientName, to }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; subject?: string };

      if (!response.ok || !data.ok) {
        setError(data.error ?? 'The email was not sent.');
        return;
      }

      setSent(`Sent to ${to}.`);
      setHistory((current) => [
        {
          id: `local-${Date.now()}`,
          templateName: templates.find((t) => t.id === templateId)?.name ?? '',
          to,
          subject: data.subject ?? '',
          sentAt: new Date().toISOString(),
          sentBy: 'you',
          ok: true,
          error: null,
        },
        ...current,
      ]);
      setTo('');
    } catch {
      setError('Could not reach the server.');
    } finally {
      setSending(false);
    }
  }

  const selected = templates.find((t) => t.id === templateId);

  return (
    <section className="mt-8 rounded-2xl border border-ink-200 bg-surface p-5 sm:p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
        <Mail className="h-[1.15rem] w-[1.15rem] text-brand-700 dark:text-brand-300" aria-hidden="true" />
        Notify the customer
      </h2>
      <p className="mt-1 text-sm text-ink-500">
        Templates are editable under{' '}
        <a href="/admin/templates" className="font-medium text-brand-700 dark:text-brand-300 underline underline-offset-2">
          Email templates
        </a>
        .
      </p>

      {!configured && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 px-3.5 py-3 text-sm text-amber-800 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-500/30">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Sending is switched off — {configError ?? 'the email provider is not configured.'} You can still
            preview the wording below.
          </span>
        </p>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="notify-template" className="block text-sm font-medium text-ink-700">
              Template
            </label>
            <select
              id="notify-template"
              value={templateId}
              onChange={(event) => setTemplateId(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-ink-200 bg-surface px-3.5 text-[0.95rem] text-ink-900 focus:border-brand-500 focus:outline-none"
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            {selected && <p className="mt-1.5 text-xs text-ink-500">{selected.description}</p>}
          </div>

          <div>
            <label htmlFor="notify-name" className="block text-sm font-medium text-ink-700">
              Recipient name
            </label>
            <input
              id="notify-name"
              value={recipientName}
              onChange={(event) => setRecipientName(event.target.value)}
              placeholder="Alex Rivera"
              className="mt-1.5 h-11 w-full rounded-xl border border-ink-200 px-3.5 text-[0.95rem] text-ink-900 placeholder:text-ink-300 focus:border-brand-500 focus:outline-none"
            />
            <p className="mt-1.5 text-xs text-ink-500">Leave blank and the email opens with &ldquo;Hi there&rdquo;.</p>
          </div>

          <div>
            <label htmlFor="notify-to" className="block text-sm font-medium text-ink-700">
              Send to
            </label>
            <input
              id="notify-to"
              type="email"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              placeholder="customer@example.com"
              className="mt-1.5 h-11 w-full rounded-xl border border-ink-200 px-3.5 text-[0.95rem] text-ink-900 placeholder:text-ink-300 focus:border-brand-500 focus:outline-none"
            />
          </div>

          {error && (
            <p role="alert" className="flex items-start gap-2 text-sm text-red-600 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}
          {sent && (
            <p role="status" className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              {sent}
            </p>
          )}

          <button
            type="button"
            onClick={() => void send()}
            disabled={!configured || sending || !to.trim() || !templateId}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 text-[0.95rem] font-semibold text-night-950 transition-colors hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            {sending ? 'Sending…' : 'Send notification'}
          </button>
        </div>

        <div className="rounded-xl border border-ink-200 bg-ink-50 p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            Preview
          </p>
          {busy && !preview ? (
            <p className="mt-3 text-sm text-ink-400">Rendering…</p>
          ) : preview ? (
            <>
              <p className="mt-3 text-sm font-semibold text-ink-900">{preview.subject}</p>
              <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-[0.85rem] leading-relaxed text-ink-700">
                {preview.text}
              </pre>
            </>
          ) : (
            <p className="mt-3 text-sm text-ink-400">Choose a template to see the email.</p>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div className="mt-6 border-t border-ink-200 pt-4">
          <h3 className="text-sm font-semibold text-ink-700">Already sent</h3>
          <ul className="mt-2 flex flex-col gap-1.5">
            {history.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
                <span
                  className={cn(
                    'inline-flex items-center rounded px-1.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide',
                    entry.ok ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300',
                  )}
                >
                  {entry.ok ? 'Sent' : 'Failed'}
                </span>
                <span className="font-medium text-ink-800">{entry.templateName}</span>
                <span className="text-ink-500">to {entry.to}</span>
                <span className="ml-auto font-mono text-xs text-ink-400">{formatDateTime(entry.sentAt)}</span>
                {entry.error && <span className="w-full text-xs text-red-600 dark:text-red-300">{entry.error}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
