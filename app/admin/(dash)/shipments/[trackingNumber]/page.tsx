import { ArrowLeft, Flag, MapPin, Navigation, Package, Truck } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddEventForm } from '@/components/admin/AddEventForm';
import { NotifyPanel } from '@/components/admin/NotifyPanel';
import { ShipmentEditor } from '@/components/admin/ShipmentEditor';
import { adminStatusTone } from '@/lib/admin';
import { CarrierLogo } from '@/components/CarrierLogo';
import { carrierLogos } from '@/lib/carrier-logos';
import { carrierById, carrierService } from '@/lib/carriers';
import { emailConfigError, emailConfigured, listTemplates, sendsFor } from '@/lib/email';
import { SHIPMENT_STATUSES, findShipment, shipmentsWritable } from '@/lib/shipments';
import { TRACKING_STAGES, resolveShipment } from '@/lib/tracking';
import { formatDateTime, timeAgo } from '@/lib/utils';

interface PageProps {
  params: Promise<{ trackingNumber: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { trackingNumber } = await params;
  return { title: decodeURIComponent(trackingNumber).toUpperCase() };
}

export default async function AdminShipmentDetailPage({ params }: PageProps) {
  const { trackingNumber } = await params;
  const shipment = await findShipment(decodeURIComponent(trackingNumber));
  if (!shipment) notFound();

  const [templates, history] = await Promise.all([
    listTemplates(),
    sendsFor(shipment.trackingNumber),
  ]);

  // The same resolution the public tracking page runs, so the operator's
  // scan history is literally the customer's view rather than a second
  // rendering of the raw record that can disagree with it.
  const resolved = resolveShipment(shipment);
  const writable = shipmentsWritable();

  // Null for a shipment that predates the platform picker, or one deliberately
  // left unassigned — the panel is simply absent rather than showing blanks.
  const platform = shipment.carrierId ? carrierById(shipment.carrierId) : null;
  const platformService =
    shipment.carrierId && shipment.carrierService
      ? carrierService(shipment.carrierId, shipment.carrierService)
      : null;

  // Operators only, and never for a number we allocated ourselves. The public
  // tracking page links nowhere — this platform is where its shipments are
  // tracked — but staff chasing a real consignment need the carrier's page.
  const carrierLookupUrl =
    platform && shipment.carrierTrackingNumber && shipment.carrierNumberSource !== 'generated'
      ? platform.trackingUrl(shipment.carrierTrackingNumber)
      : null;

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
          <div key={fact.label} className="bg-surface p-5">
            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-ink-500">
              <fact.icon className="h-3.5 w-3.5" aria-hidden="true" />
              {fact.label}
            </dt>
            <dd className="mt-2 text-[0.98rem] font-medium text-ink-900">{fact.value}</dd>
          </div>
        ))}
      </dl>

      {platform && (
        <section className="mt-8 rounded-2xl border border-ink-200 bg-surface p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <CarrierLogo src={carrierLogos()[platform.id]} initials={platform.initials} size="lg" />
            <h2 className="font-display text-lg font-semibold text-ink-900">{platform.name}</h2>
          </div>

          <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {platformService && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-500">Service</dt>
                <dd className="mt-1 text-[0.95rem] font-medium text-ink-900">{platformService.name}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-500">
                Their tracking number
              </dt>
              <dd className="mt-1 text-[0.95rem]">
                {carrierLookupUrl && resolved.carrierTrackingNumber ? (
                  <a
                    href={carrierLookupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-medium text-brand-700 dark:text-brand-300 underline decoration-brand-500/40 underline-offset-2"
                  >
                    {resolved.carrierTrackingNumber}
                  </a>
                ) : resolved.carrierTrackingNumber ? (
                  // An allocated reference is shown plainly and not linked out.
                  // It tracks on this platform like any other; the carrier has
                  // no record of it, which is why there is no link — but that
                  // needs no notice, since nothing here offers one anyway.
                  <span className="font-mono font-medium text-ink-900">
                    {resolved.carrierTrackingNumber}
                  </span>
                ) : (
                  <span className="text-ink-400">
                    Not issued yet — add it with Edit shipment once you have it.
                  </span>
                )}
              </dd>
            </div>
            {shipment.labelUrl && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-500">Label</dt>
                <dd className="mt-1 text-[0.95rem]">
                  <a
                    href={shipment.labelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-brand-700 dark:text-brand-300 underline decoration-brand-500/40 underline-offset-2"
                  >
                    Open shipping label
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}

      {shipment.customer && (
        <section className="mt-8 rounded-2xl border border-ink-200 bg-surface p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-ink-900">Customer</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-500">Contact</dt>
              <dd className="mt-1 text-[0.95rem] font-medium text-ink-900">{shipment.customer.name}</dd>
            </div>
            {shipment.customer.company && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-500">Company</dt>
                <dd className="mt-1 text-[0.95rem] font-medium text-ink-900">{shipment.customer.company}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-500">Email</dt>
              <dd className="mt-1 text-[0.95rem]">
                <a
                  href={`mailto:${shipment.customer.email}`}
                  className="font-medium text-brand-700 dark:text-brand-300 underline decoration-brand-500/40 underline-offset-2"
                >
                  {shipment.customer.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-500">Phone</dt>
              <dd className="mt-1 text-[0.95rem]">
                <a href={`tel:${shipment.customer.phone}`} className="font-medium text-ink-900">
                  {shipment.customer.phone}
                </a>
              </dd>
            </div>
            {shipment.pickupDate && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-500">Pickup date</dt>
                <dd className="mt-1 text-[0.95rem] font-medium text-ink-900">{shipment.pickupDate}</dd>
              </div>
            )}
          </dl>
        </section>
      )}

      <ShipmentEditor
        trackingNumber={shipment.trackingNumber}
        shipment={{
          status: shipment.status,
          service: shipment.service,
          origin: shipment.origin,
          destination: shipment.destination,
          currentLocation: shipment.currentLocation,
          etaInDays: shipment.etaInDays,
          pieces: shipment.pieces,
          weight: shipment.weight,
          dimensions: shipment.dimensions,
          carrier: shipment.carrier,
          carrierId: shipment.carrierId ?? '',
          carrierService: shipment.carrierService ?? '',
          carrierTrackingNumber: shipment.carrierTrackingNumber ?? '',
        }}
        statuses={SHIPMENT_STATUSES}
        writable={writable}
      />

      <section className="mt-8 rounded-2xl border border-ink-200 bg-surface p-5 sm:p-7">
        <h2 className="font-display text-lg font-semibold text-ink-900">Scan history</h2>
        <ol className="mt-5">
          {resolved.events.map((event, index) => {
            const happened = event.state !== 'upcoming';
            const isLast = index === resolved.events.length - 1;
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
                    happened ? 'border-brand-700 bg-brand-700' : 'border-ink-200 bg-surface'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className={`font-medium ${happened ? 'text-ink-900' : 'text-ink-400'}`}>{event.title}</p>
                    <p className="font-mono text-xs text-ink-400">
                      {event.timestamp
                        ? `${formatDateTime(event.timestamp)} · ${timeAgo(event.timestamp)}`
                        : 'Scheduled'}
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

        <AddEventForm
          trackingNumber={shipment.trackingNumber}
          stages={[...TRACKING_STAGES]}
          currentStatus={shipment.status}
          writable={writable}
        />
      </section>

      <NotifyPanel
        trackingNumber={shipment.trackingNumber}
        templates={templates.map(({ id, name, description }) => ({ id, name, description }))}
        history={history}
        configured={emailConfigured()}
        configError={emailConfigError()}
        customer={shipment.customer ?? null}
        revision={[
          shipment.status,
          shipment.service,
          shipment.carrier,
          shipment.origin,
          shipment.destination,
          shipment.currentLocation,
          shipment.etaInDays,
          shipment.pieces,
          shipment.weight,
          shipment.carrierTrackingNumber ?? '',
        ].join('|')}
      />

      {!writable && (
        <p className="mt-6 text-xs text-ink-400">
          Editing is unavailable because Firestore is not configured on this deployment — this shipment is
          being served from the seed fixtures.
        </p>
      )}
    </div>
  );
}
