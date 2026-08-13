import { ArrowLeft, Flag, MapPin, Navigation, Package, Truck } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminStatusTone, findShipment } from '@/lib/admin';

interface PageProps {
  params: Promise<{ trackingNumber: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { trackingNumber } = await params;
  return { title: decodeURIComponent(trackingNumber).toUpperCase() };
}

export default async function AdminShipmentDetailPage({ params }: PageProps) {
  const { trackingNumber } = await params;
  const shipment = findShipment(decodeURIComponent(trackingNumber));
  if (!shipment) notFound();

  const facts = [
    { icon: Flag, label: 'Origin', value: shipment.origin },
    { icon: MapPin, label: 'Destination', value: shipment.destination },
    { icon: Navigation, label: 'Current location', value: shipment.currentLocation },
    { icon: Truck, label: 'Carrier', value: shipment.carrier },
    { icon: Package, label: 'Pieces', value: String(shipment.pieces) },
    { icon: Package, label: 'Weight', value: shipment.weight },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/admin/shipments"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All shipments
      </Link>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-mono text-2xl font-semibold tracking-[-0.02em] text-ink-900">
          {shipment.trackingNumber}
        </h1>
        <span
          className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ${adminStatusTone(shipment.status)}`}
        >
          {shipment.status}
        </span>
      </div>
      <p className="mt-1.5 text-[0.95rem] text-ink-500">{shipment.service}</p>

      <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-ink-200 bg-ink-200 sm:grid-cols-2 lg:grid-cols-3">
        {facts.map((fact) => (
          <div key={fact.label} className="bg-white p-5">
            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-ink-500">
              <fact.icon className="h-3.5 w-3.5" aria-hidden="true" />
              {fact.label}
            </dt>
            <dd className="mt-2 text-[0.98rem] font-medium text-ink-900">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-8 rounded-2xl border border-ink-200 bg-white p-5 sm:p-7">
        <h2 className="font-display text-lg font-semibold text-ink-900">Scan history</h2>
        <ol className="mt-5">
          {shipment.events.map((event, index) => {
            const happened = event.hoursAgo >= 0;
            const isLast = index === shipment.events.length - 1;
            return (
              <li key={`${event.stage}-${index}`} className="relative flex gap-4 pb-6 last:pb-0">
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className={`absolute left-[11px] top-6 h-full w-px ${happened ? 'bg-brand-200' : 'bg-ink-200'}`}
                  />
                )}
                <span
                  aria-hidden="true"
                  className={`relative z-10 mt-1 h-[22px] w-[22px] shrink-0 rounded-full border-2 ${
                    happened ? 'border-brand-700 bg-brand-700' : 'border-ink-200 bg-white'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className={`font-medium ${happened ? 'text-ink-900' : 'text-ink-400'}`}>{event.title}</p>
                    <p className="font-mono text-xs text-ink-400">
                      {happened ? `${event.hoursAgo}h ago` : 'Scheduled'}
                    </p>
                  </div>
                  <p className={`mt-0.5 text-sm ${happened ? 'text-ink-600' : 'text-ink-400'}`}>
                    {event.stage} · {event.location}
                  </p>
                  <p className={`mt-1 text-sm ${happened ? 'text-ink-500' : 'text-ink-400'}`}>
                    {event.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <p className="mt-6 text-xs text-ink-400">
        Read-only in this prototype — scans come from the demo dataset, and there is no backend to write to.
      </p>
    </div>
  );
}
