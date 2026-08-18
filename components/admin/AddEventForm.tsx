'use client';

import { AlertCircle, CheckCircle2, MapPin, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

/**
 * Record a tracking scan against a shipment.
 *
 * The date defaults to now, because the common case is logging something as it
 * happens — but it is editable, because the second most common case is a depot
 * update that reaches the office an hour late, and forcing it to be stamped
 * "now" would put a lie on the customer's timeline.
 */

interface AddEventFormProps {
  trackingNumber: string;
  stages: string[];
  currentStatus: string;
  writable: boolean;
}

/** `datetime-local` wants local wall-clock time with no zone, trimmed to minutes. */
function nowForInput(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
}

export function AddEventForm({ trackingNumber, stages, currentStatus, writable }: AddEventFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState(stages.includes(currentStatus) ? currentStatus : stages[0]);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [at, setAt] = useState(nowForInput());
  const [advance, setAdvance] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setAdded(null);

    try {
      const response = await fetch(
        `/api/admin/shipments/${encodeURIComponent(trackingNumber)}/events`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stage,
            title,
            location,
            description,
            // The input has no timezone, so it is read as local time — which is
            // what the operator meant — and sent as an absolute instant.
            at: new Date(at).toISOString(),
            advanceShipment: advance,
          }),
        },
      );
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? 'Could not record the event.');
        return;
      }

      setAdded(`${stage} recorded.`);
      setTitle('');
      setLocation('');
      setDescription('');
      setAt(nowForInput());
      router.refresh();
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={!writable}
          title={writable ? undefined : 'Firestore is not configured on this deployment.'}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink-900 px-4 text-[0.92rem] font-semibold text-white transition-colors hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add tracking event
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4 rounded-2xl border border-ink-200 bg-white p-5">
      <h3 className="flex items-center gap-2 font-display text-[1.05rem] font-semibold text-ink-900">
        <MapPin className="h-[1.05rem] w-[1.05rem] text-brand-700" aria-hidden="true" />
        Add tracking event
      </h3>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="event-stage" className="block text-sm font-medium text-ink-700">
            Stage
          </label>
          <select
            id="event-stage"
            value={stage}
            onChange={(event) => setStage(event.target.value)}
            className="mt-1.5 h-11 w-full rounded-xl border border-ink-200 bg-white px-3.5 text-[0.95rem] text-ink-900 focus:border-brand-500 focus:outline-none"
          >
            {stages.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="event-at" className="block text-sm font-medium text-ink-700">
            When
          </label>
          <input
            id="event-at"
            type="datetime-local"
            value={at}
            onChange={(event) => setAt(event.target.value)}
            className="mt-1.5 h-11 w-full rounded-xl border border-ink-200 px-3.5 text-[0.95rem] text-ink-900 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="event-title" className="block text-sm font-medium text-ink-700">
            Title
          </label>
          <input
            id="event-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Departed sort facility"
            required
            className="mt-1.5 h-11 w-full rounded-xl border border-ink-200 px-3.5 text-[0.95rem] text-ink-900 placeholder:text-ink-300 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="event-location" className="block text-sm font-medium text-ink-700">
            Location
          </label>
          <input
            id="event-location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Memphis, TN"
            required
            className="mt-1.5 h-11 w-full rounded-xl border border-ink-200 px-3.5 text-[0.95rem] text-ink-900 placeholder:text-ink-300 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="event-description" className="block text-sm font-medium text-ink-700">
            Description
          </label>
          <textarea
            id="event-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
            placeholder="Loaded onto line-haul trailer, next scan at destination hub."
            required
            className="mt-1.5 w-full resize-y rounded-xl border border-ink-200 px-3.5 py-3 text-[0.95rem] text-ink-900 placeholder:text-ink-300 focus:border-brand-500 focus:outline-none"
          />
          <p className="mt-1.5 text-xs text-ink-500">The customer reads this on the tracking page.</p>
        </div>
      </div>

      <label className="mt-4 flex items-start gap-2.5 text-sm text-ink-700">
        <input
          type="checkbox"
          checked={advance}
          onChange={(event) => setAdvance(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-500 focus:ring-brand-500"
        />
        <span>
          Move the shipment to <span className="font-semibold">{stage}</span> and set its current location to
          match.
          <span className="mt-0.5 block text-xs text-ink-500">
            Leave unticked when backfilling a scan that has already been overtaken.
          </span>
        </span>
      </label>

      {error && (
        <p role="alert" className="mt-4 flex items-start gap-2 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      {added && (
        <p role="status" className="mt-4 flex items-center gap-2 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          {added}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-500 px-5 text-[0.95rem] font-semibold text-ink-950 transition-colors hover:bg-brand-400 disabled:cursor-progress disabled:opacity-60"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {busy ? 'Recording…' : 'Record event'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex h-11 items-center rounded-xl border border-ink-200 px-4 text-[0.92rem] font-semibold text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900"
        >
          Done
        </button>
      </div>
    </form>
  );
}
