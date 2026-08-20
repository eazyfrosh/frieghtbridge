import { AlertTriangle, ArrowRight, CheckCircle2, PackagePlus, Truck } from 'lucide-react';
import Link from 'next/link';
import { adminStatusTone, shipmentStats } from '@/lib/admin';
import { listShipments } from '@/lib/shipments';

export const metadata = { title: 'Dashboard' };

export default async function AdminDashboardPage() {
  const shipments = await listShipments();
  const stats = shipmentStats(shipments);

  const cards = [
    { label: 'Open shipments', value: stats.inTransit, icon: Truck, tone: 'text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/10' },
    { label: 'Delivered', value: stats.delivered, icon: CheckCircle2, tone: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10' },
    { label: 'Exceptions', value: stats.exceptions, icon: AlertTriangle, tone: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10' },
    { label: 'On-time rate', value: `${stats.onTimeRate}%`, icon: CheckCircle2, tone: 'text-ink-700 bg-ink-100' },
  ];

  const attention = shipments.filter((s) => s.status === 'Exception');

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-[-0.025em] text-ink-900 sm:text-3xl">
            Operations overview
          </h1>
          <p className="mt-1.5 text-[0.95rem] text-ink-500">
            Everything moving through the network right now.
          </p>
        </div>
        <Link
          href="/admin/book"
          className="group inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 text-[0.95rem] font-semibold text-night-950 transition-colors duration-300 hover:bg-brand-400"
        >
          <PackagePlus className="h-[1.05rem] w-[1.05rem]" aria-hidden="true" />
          Book shipment
        </Link>
      </div>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-ink-200 bg-surface p-5">
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${card.tone}`}>
              <card.icon className="h-[1.05rem] w-[1.05rem]" aria-hidden="true" />
            </span>
            <dd className="mt-3 font-display text-[1.75rem] font-semibold leading-none text-ink-900">
              {card.value}
            </dd>
            <dt className="mt-1.5 text-[0.85rem] font-medium text-ink-500">{card.label}</dt>
          </div>
        ))}
      </dl>

      {attention.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg font-semibold text-ink-900">Needs attention</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {attention.map((shipment) => (
              <li key={shipment.trackingNumber}>
                <Link
                  href={`/admin/shipments/${shipment.trackingNumber}`}
                  className="flex flex-col gap-2 rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50/60 dark:bg-rose-500/10 p-4 transition-colors hover:border-rose-300 dark:hover:border-rose-500/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span>
                    <span className="font-mono text-sm font-semibold text-ink-900">
                      {shipment.trackingNumber}
                    </span>
                    <span className="mt-0.5 block text-sm text-ink-600">
                      {shipment.origin} → {shipment.destination}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-700 dark:text-rose-300">
                    Review
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-lg font-semibold text-ink-900">Recent shipments</h2>
          <Link
            href="/admin/shipments"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 dark:text-brand-300 hover:text-brand-800 dark:hover:text-brand-300"
          >
            View all
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <ul className="mt-3 divide-y divide-ink-100 overflow-hidden rounded-2xl border border-ink-200 bg-surface">
          {shipments.slice(0, 5).map((shipment) => (
            <li key={shipment.trackingNumber}>
              <Link
                href={`/admin/shipments/${shipment.trackingNumber}`}
                className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-ink-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="min-w-0">
                  <span className="font-mono text-sm font-semibold text-ink-900">
                    {shipment.trackingNumber}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-ink-500">
                    {shipment.origin} → {shipment.destination}
                  </span>
                </span>
                <span
                  className={`inline-flex w-fit shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${adminStatusTone(shipment.status)}`}
                >
                  {shipment.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 text-xs text-ink-400">
        This prototype runs against a demo dataset. Figures are illustrative.
      </p>
    </div>
  );
}
