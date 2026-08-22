import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
  SHIPMENT_FILTERS,
  adminStatusTone,
  filterShipments,
  type ShipmentFilter,
} from '@/lib/admin';
import { listShipments, shipmentsWritable } from '@/lib/shipments';

export const metadata = { title: 'Shipments' };

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

function parseFilter(raw: string | undefined): ShipmentFilter {
  const match = SHIPMENT_FILTERS.find((f) => f.toLowerCase() === raw?.toLowerCase());
  return match ?? 'All';
}

export default async function AdminShipmentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const active = parseFilter(params.status);
  const all = await listShipments();
  const shipments = filterShipments(all, active);
  const writable = shipmentsWritable();

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-2xl font-semibold tracking-[-0.025em] text-ink-900 sm:text-3xl">
        Shipments
      </h1>
      <p className="mt-1.5 text-[0.95rem] text-ink-500">
        Every booking in the network, newest first.
      </p>

      {/* Without this, a deployment whose Firestore is misconfigured shows the
          demo fixtures and looks like it is working — so a booking that never
          saved reads as a booking that vanished. Say which it is. */}
      {!writable && (
        <p className="mt-4 rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          Firestore is not configured on this deployment, so nothing here is saved and new bookings
          cannot be stored. These are the seed fixtures. Set{' '}
          <code className="font-mono text-[0.85em]">FIREBASE_SERVICE_ACCOUNT_KEY</code> and redeploy.
        </p>
      )}

      {/* Filters are links, not state — the view stays shareable and works
          without JavaScript. */}
      <nav aria-label="Filter by status" className="mt-6 flex flex-wrap gap-2">
        {SHIPMENT_FILTERS.map((filter) => {
          const isActive = filter === active;
          return (
            <Link
              key={filter}
              href={filter === 'All' ? '/admin/shipments' : `/admin/shipments?status=${filter.toLowerCase()}`}
              aria-current={isActive ? 'true' : undefined}
              className={
                isActive
                  ? 'rounded-full bg-night-900 px-4 py-2 text-sm font-semibold text-white'
                  : 'rounded-full border border-ink-200 bg-surface px-4 py-2 text-sm font-medium text-ink-600 transition-colors hover:border-ink-300 hover:text-ink-900'
              }
            >
              {filter}
            </Link>
          );
        })}
      </nav>

      {shipments.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-ink-200 bg-surface p-8 text-center text-sm text-ink-500">
          {all.length === 0
            ? 'No shipments yet. Raise one from Book shipment and it appears here.'
            : 'No shipments with that status.'}
        </p>
      ) : (
        <>
          {/* Table on wide screens */}
          <div className="mt-6 hidden overflow-hidden rounded-2xl border border-ink-200 bg-surface lg:block">
            <table className="w-full text-left">
              <thead className="border-b border-ink-100 bg-ink-50/60">
                <tr>
                  {['Tracking number', 'Lane', 'Service', 'Status', ''].map((heading, index) => (
                    <th
                      key={heading || index}
                      scope="col"
                      className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-ink-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {shipments.map((shipment) => (
                  <tr key={shipment.trackingNumber} className="transition-colors hover:bg-ink-50/70">
                    <td className="px-5 py-4 font-mono text-sm font-semibold text-ink-900">
                      {shipment.trackingNumber}
                    </td>
                    <td className="px-5 py-4 text-sm text-ink-600">
                      {shipment.origin} → {shipment.destination}
                    </td>
                    <td className="px-5 py-4 text-sm text-ink-500">{shipment.service}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${adminStatusTone(shipment.status)}`}
                      >
                        {shipment.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/shipments/${shipment.trackingNumber}`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 dark:text-brand-300 hover:text-brand-800 dark:hover:text-brand-300"
                      >
                        Open
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">{shipment.trackingNumber}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards below lg, where a five-column table cannot breathe */}
          <ul className="mt-6 flex flex-col gap-3 lg:hidden">
            {shipments.map((shipment) => (
              <li key={shipment.trackingNumber}>
                <Link
                  href={`/admin/shipments/${shipment.trackingNumber}`}
                  className="block rounded-2xl border border-ink-200 bg-surface p-4 transition-colors hover:border-ink-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono text-sm font-semibold text-ink-900">
                      {shipment.trackingNumber}
                    </span>
                    <span
                      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${adminStatusTone(shipment.status)}`}
                    >
                      {shipment.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ink-600">
                    {shipment.origin} → {shipment.destination}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-400">{shipment.service}</p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
