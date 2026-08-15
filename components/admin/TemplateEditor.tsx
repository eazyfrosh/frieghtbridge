'use client';

import { AlertCircle, CheckCircle2, RotateCcw, Save } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { cn, formatDateTime } from '@/lib/utils';

/**
 * Edit the wording of the shipment notification emails.
 *
 * Editing never overwrites the shipped copy — an edit is stored as an override,
 * so "Reset" is always available and always works. That is what makes the
 * templates safe to experiment with.
 */

interface Placeholder {
  token: string;
  label: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  edited: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
}

interface TemplateEditorProps {
  templates: Template[];
  placeholders: Placeholder[];
}

export function TemplateEditor({ templates: initial, placeholders }: TemplateEditorProps) {
  const [templates, setTemplates] = useState(initial);
  const [activeId, setActiveId] = useState(initial[0]?.id ?? '');
  const [subject, setSubject] = useState(initial[0]?.subject ?? '');
  const [body, setBody] = useState(initial[0]?.body ?? '');
  const [preview, setPreview] = useState<{ subject: string; text: string } | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const active = templates.find((template) => template.id === activeId) ?? null;
  const dirty = Boolean(active) && (subject !== active!.subject || body !== active!.body);

  const select = useCallback(
    (id: string) => {
      const next = templates.find((template) => template.id === id);
      if (!next) return;
      setActiveId(id);
      setSubject(next.subject);
      setBody(next.body);
      setStatus(null);
      setError(null);
    },
    [templates],
  );

  const loadPreview = useCallback(async () => {
    if (!activeId) return;
    try {
      const response = await fetch(`/api/admin/templates/${activeId}`);
      if (!response.ok) return;
      const data = (await response.json()) as { preview?: { subject: string; text: string } };
      setPreview(data.preview ?? null);
    } catch {
      // The preview is a convenience; failing to load it must not block editing.
    }
  }, [activeId]);

  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  async function save() {
    setBusy(true);
    setError(null);
    setStatus(null);

    try {
      const response = await fetch(`/api/admin/templates/${activeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body }),
      });
      const data = (await response.json()) as {
        template?: Template;
        preview?: { subject: string; text: string };
        warnings?: string[];
        error?: string;
      };

      if (!response.ok || !data.template) {
        setError(data.error ?? 'Could not save.');
        return;
      }

      setTemplates((current) => current.map((t) => (t.id === data.template!.id ? data.template! : t)));
      setPreview(data.preview ?? null);
      setStatus(
        data.warnings?.length
          ? `Saved. Unknown placeholder${data.warnings.length > 1 ? 's' : ''}: ${data.warnings
              .map((w) => `{{${w}}}`)
              .join(', ')} — these will appear as-is in the email.`
          : 'Saved.',
      );
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    setBusy(true);
    setError(null);
    setStatus(null);

    try {
      const response = await fetch(`/api/admin/templates/${activeId}`, { method: 'DELETE' });
      const data = (await response.json()) as {
        template?: Template;
        preview?: { subject: string; text: string };
        error?: string;
      };

      if (!response.ok || !data.template) {
        setError(data.error ?? 'Could not reset.');
        return;
      }

      setTemplates((current) => current.map((t) => (t.id === data.template!.id ? data.template! : t)));
      setSubject(data.template.subject);
      setBody(data.template.body);
      setPreview(data.preview ?? null);
      setStatus('Restored the original wording.');
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  }

  function insert(token: string) {
    setBody((current) => `${current}{{${token}}}`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
      <nav aria-label="Templates">
        <ul className="flex flex-col gap-1">
          {templates.map((template) => (
            <li key={template.id}>
              <button
                type="button"
                onClick={() => select(template.id)}
                aria-current={template.id === activeId ? 'true' : undefined}
                className={cn(
                  'w-full rounded-xl px-3.5 py-2.5 text-left transition-colors',
                  template.id === activeId ? 'bg-brand-500 text-ink-950' : 'text-ink-700 hover:bg-ink-100',
                )}
              >
                <span className="block text-[0.92rem] font-semibold">{template.name}</span>
                {template.edited && (
                  <span
                    className={cn(
                      'mt-0.5 block text-[0.7rem]',
                      template.id === activeId ? 'text-ink-800' : 'text-ink-400',
                    )}
                  >
                    Edited
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {active && (
        <div className="min-w-0">
          <div className="rounded-2xl border border-ink-200 bg-white p-5">
            <h2 className="font-display text-lg font-semibold text-ink-900">{active.name}</h2>
            <p className="mt-1 text-sm text-ink-500">{active.description}</p>
            {active.edited && active.updatedAt && (
              <p className="mt-1 text-xs text-ink-400">
                Edited {formatDateTime(active.updatedAt)}
                {active.updatedBy ? ` by ${active.updatedBy}` : ''}
              </p>
            )}

            <div className="mt-5">
              <label htmlFor="template-subject" className="block text-sm font-medium text-ink-700">
                Subject
              </label>
              <input
                id="template-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-ink-200 px-3.5 text-[0.95rem] text-ink-900 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div className="mt-4">
              <label htmlFor="template-body" className="block text-sm font-medium text-ink-700">
                Message
              </label>
              <textarea
                id="template-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={16}
                className="mt-1.5 w-full resize-y rounded-xl border border-ink-200 px-3.5 py-3 font-mono text-[0.85rem] leading-relaxed text-ink-900 focus:border-brand-500 focus:outline-none"
              />
              <p className="mt-1.5 text-xs text-ink-500">
                Plain text. Blank lines separate paragraphs, and links become buttons in the sent email.
              </p>
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium text-ink-700">Insert a detail</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {placeholders.map((placeholder) => (
                  <button
                    key={placeholder.token}
                    type="button"
                    onClick={() => insert(placeholder.token)}
                    title={`Insert ${placeholder.label}`}
                    className="rounded-lg border border-ink-200 bg-ink-50 px-2 py-1 font-mono text-[0.72rem] text-ink-600 transition-colors hover:border-brand-500 hover:text-brand-700"
                  >
                    {`{{${placeholder.token}}}`}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p role="alert" className="mt-4 flex items-start gap-2 text-sm text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
            )}
            {status && (
              <p role="status" className="mt-4 flex items-start gap-2 text-sm text-green-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {status}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void save()}
                disabled={busy || !dirty}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-500 px-5 text-[0.95rem] font-semibold text-ink-950 transition-colors hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                {busy ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
              </button>
              {active.edited && (
                <button
                  type="button"
                  onClick={() => void reset()}
                  disabled={busy}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-ink-200 px-4 text-[0.92rem] font-semibold text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900 disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Reset to original
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-ink-200 bg-ink-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">
              Preview · sample shipment
            </p>
            {preview ? (
              <>
                <p className="mt-3 text-[0.95rem] font-semibold text-ink-900">{preview.subject}</p>
                <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-[0.88rem] leading-relaxed text-ink-700">
                  {preview.text}
                </pre>
                {dirty && (
                  <p className="mt-3 text-xs text-ink-400">
                    Showing the saved version — save to update this preview.
                  </p>
                )}
              </>
            ) : (
              <p className="mt-3 text-sm text-ink-400">Loading…</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
