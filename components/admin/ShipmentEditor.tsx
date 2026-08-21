'use client';

import { AlertCircle, CheckCircle2, Pencil, Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { BOOKABLE_CARRIERS, OWN_CARRIER_ID, carrierById } from '@/lib/carriers';

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
  carrierId: string;
  carrierService: string;
  carrierTrackingNumber: string;
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
  const [warning, setWarning] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const carrier = carrierById(form.carrierId);

  function set<K extends keyof ShipmentFields>(key: K, value: ShipmentFields[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  /**
   * The freight half of a service string — "Pallet" out of "Pallet · UPS
   * Ground", "LTL Freight" out of "LTL Freight — Standard". What the shipment
   * *is* survives a change of who is carrying it.
   */
  function freightPrefix(service: string): string {
    const match = /^(.*?)\s+(?:·|—|–|-)\s+/.exec(service);
    return (match?.[1] ?? service).trim();
  }

  /**
   * Re-tender to a different platform.
   *
   * Their service and their tracking number belong to the old carrier, so both
   * go. So do the two display fields: a shipment moved to FedEx that still
   * reads "Carrier: UPS · 2nd Day Air" is worse than no label at all, and the
   * customer sees those two strings. Both stay hand-editable afterwards.
   */
  function setCarrierId(id: string) {
    setForm((current) => {
      if (id === current.carrierId) return current;
      const next = { ...current, carrierId: id, carrierService: '', carrierTrackingNumber: '' };

      const carrier = carrierById(id);
      if (carrier) {
        const service = carrier.services?.[0];
        next.carrierService = service?.code ?? '';
        next.carrier = carrier.name;
        if (service) next.service = `${freightPrefix(current.service)} · ${service.name}`;
      }
      return next;
    });
    setSaved(false);
  }

  function setCarrierServiceCode(code: string) {
    setForm((current) => {
      const service = (carrierById(current.carrierId)?.services ?? []).find((s) => s.code === code);
      return {
        ...current,
        carrierService: code,
        service: service ? `${freightPrefix(current.service)} · ${service.name}` : current.service,
      };
    });
    setSaved(false);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setWarning(null);
    setSaved(false);

    try {
      const response = await fetch(`/api/admin/shipments/${encodeURIComponent(trackingNumber)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        warning?: string | null;
      };

      if (!response.ok) {
        setError(data.error ?? 'Could not save the shipment.');
        return;
      }

      setWarning(data.warning ?? null);
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

      {/* Carrier platform — separate from the free-text "Carrier" field above,
          which names the vehicle or lane rather than the company. */}
      <div className="mt-6 border-t border-ink-100 pt-5">
        <h3 className="text-sm font-semibold text-ink-900">Carrier platform</h3>
        <p className="mt-1 text-sm text-ink-500">
          Who is moving it, and their own tracking number. Re-tendering a shipment to a different carrier is
          this: change the platform, then paste the number they issue.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="edit-carrierId" className="block text-sm font-medium text-ink-700">
              Platform
            </label>
            <select
              id="edit-carrierId"
              value={form.carrierId}
              onChange={(event) => setCarrierId(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-ink-200 bg-surface px-3.5 text-[0.95rem] text-ink-900 focus:border-brand-500 focus:outline-none"
            >
              <option value="">Not assigned</option>
              {BOOKABLE_CARRIERS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="edit-carrierService" className="block text-sm font-medium text-ink-700">
              Service
            </label>
            <select
              id="edit-carrierService"
              value={form.carrierService}
              disabled={!carrier}
              onChange={(event) => setCarrierServiceCode(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-ink-200 bg-surface px-3.5 text-[0.95rem] text-ink-900 focus:border-brand-500 focus:outline-none disabled:opacity-50"
            >
              <option value="">Not set</option>
              {(carrier?.services ?? []).map((service) => (
                <option key={service.code} value={service.code}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="edit-carrierTrackingNumber" className="block text-sm font-medium text-ink-700">
              Their tracking number
            </label>
            <input
              id="edit-carrierTrackingNumber"
              value={form.carrierTrackingNumber}
              disabled={!carrier || form.carrierId === OWN_CARRIER_ID}
              placeholder={form.carrierId === OWN_CARRIER_ID ? 'Our own network' : '1Z999AA10123456784'}
              onChange={(event) => set('carrierTrackingNumber', event.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-ink-200 px-3.5 font-mono text-[0.9rem] text-ink-900 focus:border-brand-500 focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 flex items-start gap-2 text-sm text-red-600 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      {saved && !warning && (
        <p role="status" className="mt-4 flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          Saved.
        </p>
      )}
      {warning && (
        <p role="status" className="mt-4 flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {warning}
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
