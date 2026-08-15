import { AlertCircle } from 'lucide-react';
import { TemplateEditor } from '@/components/admin/TemplateEditor';
import { emailConfigError, emailConfigured, listTemplates } from '@/lib/email';
import { PLACEHOLDERS } from '@/lib/email/templates';

export const metadata = { title: 'Email templates' };

export default async function AdminTemplatesPage() {
  const templates = await listTemplates();

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-2xl font-semibold tracking-[-0.025em] text-ink-900 sm:text-3xl">
        Email templates
      </h1>
      <p className="mt-1.5 text-[0.95rem] text-ink-500">
        The wording customers receive about their shipments. Edit any of them — the original is always
        one click away.
      </p>

      {!emailConfigured() && (
        <p className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Editing and previewing work, but nothing can be sent yet — {emailConfigError()} See the README
            for the two variables to set.
          </span>
        </p>
      )}

      <div className="mt-6">
        <TemplateEditor templates={templates} placeholders={PLACEHOLDERS} />
      </div>
    </div>
  );
}
