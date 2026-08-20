'use client';

import { AlertCircle, CheckCircle2, Pencil, Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

/**
 * Edit a shipment's details in place.
 *
 * Collapsed by default. The shipment page is primarily something an operator
 * reads, and a permanently open form of a dozen inputs buries the record it is
 * meant to be about.
 */

interface ShipmentFields {
  status: string;
  service: string;
  origin: string;
  destination: string;
  currentLocation: string;
  etaInDays: number;
  pieces: number;
  weight: string;
  dimensions: string;
  carrier: string;
}

interface ShipmentEditorProps {
  trackingNumber: string;
  shipment: ShipmentFields;
  statuses: string[];
  /** False when Firestore is unavailable, so saving cannot work. */
  writable: boolean;
}

export function ShipmentEditor({ trackingNumber, shipment, statuses, writable }: ShipmentEditorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ShipmentFields>(shipment);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof ShipmentFields>(key: K, value: ShipmentFields[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch(`/api/admin/shipments/${encodeURIComponent(trackingNumber)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? 'Could not save the shipment.');
        return;
      }

      setSaved(true);
      // The page is a server component; this is what makes the header, the
      // facts grid and the timeline show the new values.
      router.refresh();
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="mt-6">
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={!writable}
          title={writable ? undefined : 'Firestore is not configured on this deployment.'}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-ink-200 bg-surface px-4 text-[0.92rem] font-semibold text-ink-700 transition-colors hover:bg-ink-50 hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Edit shipment
        </button>
      </div>
    );
  }

  const textFields: Array<[keyof ShipmentFields, string]> = [
    ['service', 'Service'],
    ['carrier', 'Carrier'],
    ['origin', 'Origin'],
    ['destination', 'Destination'],
    ['currentLocation', 'Current location'],
    ['weight', 'Weight'],
    ['dimensions', 'Dimensions'],
  ];

  return (
    <form onSubmit={save} className="mt-6 rounded-2xl border border-ink-200 bg-surface p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink-900">Edit shipment</h2>
          <p className="mt-1 text-sm text-ink-500">
            Changes appear on the customer&rsquo;s tracking page straight away.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setForm(shipment);
            setOpen(false);
            setError(null);
          }}
          aria-label="Cancel editing"
          className="-mr-1 rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-900"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="edit-status" className="block text-sm font-medium text-ink-700">
            Status
          </label>
          <select
            id="edit-status"
            value={form.status}
            onChange={(event) => set('status', event.target.value)}
            className="mt-1.5 h-11 w-full rounded-xl border border-ink-200 bg-surface px-3.5 text-[0.95rem] text-ink-900 focus:border-brand-500 focus:outline-none"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {textFields.map(([key, label]) => (
          <div key={key}>
            <label htmlFor={`edit-${key}`} className="block text-sm font-medium text-ink-700">
              {label}
            </label>
            <input
              id={`edit-${key}`}
              value={String(form[key])}
              onChange={(event) => set(key, event.target.value as never)}
              className="mt-1.5 h-11 w-full rounded-xl border border-ink-200 px-3.5 text-[0.95rem] text-ink-900 focus:border-brand-500 focus:outline-none"
            />
          </div>
        ))}

        <div>
          <label htmlFor="edit-pieces" className="block text-sm font-medium text-ink-700">
            Pieces
          </label>
          <input
            id="edit-pieces"
            type="number"
            min={1}
            value={form.pieces}
            onChange={(event) => set('pieces', Number(event.target.value))}
            className="mt-1.5 h-11 w-full rounded-xl border border-ink-200 px-3.5 text-[0.95rem] text-ink-900 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="edit-eta" className="block text-sm font-medium text-ink-700">
            ETA, in days from now
          </label>
          <input
            id="edit-eta"
            type="number"
            value={form.etaInDays}
            onChange={(event) => set('etaInDays', Number(event.target.value))}
            className="mt-1.5 h-11 w-full rounded-xl border border-ink-200 px-3.5 text-[0.95rem] text-ink-900 focus:border-brand-500 focus:outline-none"
          />
          <p className="mt-1.5 text-xs text-ink-500">Use a negative number if the promised date has passed.</p>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 flex items-start gap-2 text-sm text-red-600 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="mt-4 flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          Saved.
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-500 px-5 text-[0.95rem] font-semibold text-night-950 transition-colors hover:bg-brand-400 disabled:cursor-progress disabled:opacity-60"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          {busy ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={() => setForm(shipment)}
          disabled={busy}
          className="inline-flex h-11 items-center rounded-xl border border-ink-200 px-4 text-[0.92rem] font-semibold text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900 disabled:opacity-50"
        >
          Revert
        </button>
      </div>
    </form>
  );
}
