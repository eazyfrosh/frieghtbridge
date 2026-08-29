'use client';

import { motion } from 'framer-motion';
import {
  Boxes,
  Check,
  CheckCircle2,
  CircleDot,
  Copy,
  FileCheck2,
  Home,
  Hourglass,
  MapPin,
  Printer,
  Ruler,
  Truck,
  Warehouse,
  Weight,
} from 'lucide-react';
import { useState } from 'react';
import { CarrierLogo } from '@/components/CarrierLogo';
import { OWN_CARRIER_ID, carrierById, type CarrierLogos } from '@/lib/carriers';
import { EASE_PREMIUM } from '@/lib/motion';
import { TRACKING_STAGES, statusTone, type ResolvedEvent, type TrackingResult } from '@/lib/tracking';
import { cn, formatDate, formatDateTime, timeAgo } from '@/lib/utils';
import { CarrierThemeScope } from './CarrierThemeScope';
import { QrCode } from './QrCode';
import { RouteMap } from './RouteMap';

/**
 * The tracking result, in the carrier's own livery.
 *
 * Laid out to match the operator's multi-carrier platform: a gradient header
 * card in the carrier's colours, a progress bar and last-known location, a
 * route overview, then history beside a details column.
 *
 * One deliberate departure. That platform's details card names the sender and
 * the receiver; ours cannot. A tracking number is the only credential for this
 * page, and `TrackingResult` omits the customer record by type precisely so
 * that guessing a number cannot yield somebody's name and address. The card
 * shows the consignment instead — lane, pieces, weight, dimensions — which is
 * what the person holding the number already knows.
 */

const STAGE_ICONS: Record<string, typeof CircleDot> = {
  Pending: Hourglass,
  'Order Confirmed': CircleDot,
  'Picked Up': Truck,
  'In Transit': Warehouse,
  'Customs Clearance': FileCheck2,
  'Out for Delivery': Home,
  Delivered: CheckCircle2,
};

/**
 * How far along, by the furthest milestone actually reached.
 *
 * `Exception` is not a milestone and not an ending — a delayed shipment is
 * still somewhere in the middle of its journey — so the bar comes from the
 * last stage that was actually scanned. Filling it to 100% because something
 * went wrong would tell a customer their delayed freight had arrived.
 */
function progressPercent(result: TrackingResult): number {
  const reached =
    result.status === 'Exception'
      ? [...result.events].reverse().find((event) => event.timestamp !== null)?.stage
      : result.status;

  const index = TRACKING_STAGES.indexOf(reached as (typeof TRACKING_STAGES)[number]);
  if (index === -1) return result.progress;
  return Math.round(((index + 1) / TRACKING_STAGES.length) * 100);
}

export function TrackingResultPanel({
  result,
  reduced,
  logos,
}: {
  result: TrackingResult;
  reduced: boolean;
  logos: CarrierLogos;
}) {
  const [copied, setCopied] = useState(false);

  const carrier = carrierById(result.carrierId ?? OWN_CARRIER_ID);
  const onOwnNetwork = !result.carrierId || result.carrierId === OWN_CARRIER_ID;
  const tone = statusTone(result.status);

  // Newest first, which is the order someone checking on a shipment reads in:
  // "where is it now" before "where has it been".
  const history = [...result.events]
    .filter((event) => event.timestamp !== null)
    .reverse();
  const latest: ResolvedEvent | undefined = history[0];

  const shareUrl =
    typeof window === 'undefined'
      ? ''
      : `${window.location.origin}/tracking?number=${encodeURIComponent(result.trackingNumber)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission refused, or an insecure origin. The URL is in the
      // address bar either way, so there is nothing to report.
    }
  }

  return (
    <CarrierThemeScope carrierId={result.carrierId} className="mt-6">
      {/* Header actions */}
      <div className="no-print mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-400">
            Tracking number
          </p>
          <p className="font-mono text-xl font-semibold tracking-[-0.01em] text-ink-900">
            {result.trackingNumber}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--carrier-primary)_35%,transparent)] px-3.5 text-sm font-semibold text-ink-700 transition-colors hover:bg-[color-mix(in_srgb,var(--carrier-primary)_8%,transparent)]"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy link'}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--carrier-primary)] px-3.5 text-sm font-semibold text-[var(--carrier-on-primary)] transition-opacity hover:opacity-90"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* Livery header */}
      <motion.div
        key={result.trackingNumber}
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_PREMIUM }}
        className="overflow-hidden rounded-3xl border border-[color-mix(in_srgb,var(--carrier-primary)_20%,transparent)] bg-surface shadow-card"
      >
        <div className="bg-[linear-gradient(135deg,var(--carrier-primary),var(--carrier-secondary))] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CarrierLogo
                src={logos[carrier?.id ?? '']}
                initials={carrier?.initials ?? 'FB'}
                size="lg"
                className="shadow-lg"
              />
              <div>
                <p className="text-sm font-medium text-[var(--carrier-on-primary)] opacity-80">
                  {carrier?.name ?? result.carrier} · {result.service}
                </p>
                <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--carrier-on-primary)_20%,transparent)] px-2.5 py-1 text-xs font-semibold text-[var(--carrier-on-primary)]">
                  <span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
                  {tone.label}
                </span>
              </div>
            </div>

            <div className="text-[var(--carrier-on-primary)] sm:text-right">
              <p className="text-sm opacity-80">Estimated delivery</p>
              <p className="font-display text-lg font-semibold">
                {formatDate(result.estimatedDelivery)}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div
            role="progressbar"
            aria-valuenow={progressPercent(result)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Shipment progress"
            className="h-2 overflow-hidden rounded-full bg-ink-100"
          >
            <motion.div
              className="h-full rounded-full bg-[linear-gradient(90deg,var(--carrier-primary),var(--carrier-secondary))]"
              initial={reduced ? { width: `${progressPercent(result)}%` } : { width: 0 }}
              animate={{ width: `${progressPercent(result)}%` }}
              transition={{ duration: 0.9, ease: EASE_PREMIUM }}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
            <p className="flex items-center gap-1.5 text-ink-500">
              <MapPin className="h-3.5 w-3.5 text-[var(--carrier-primary)]" aria-hidden="true" />
              Last known location
              <span className="font-semibold text-ink-900">{result.currentLocation}</span>
            </p>
            <p className="text-ink-400">Updated {timeAgo(result.lastUpdate)}</p>
          </div>

          {!onOwnNetwork && result.carrierTrackingNumber && (
            <p className="mt-3 border-t border-ink-100 pt-3 text-sm text-ink-500">
              {carrier?.name} reference{' '}
              <span className="font-mono text-[0.92em] font-semibold text-ink-900">
                {result.carrierTrackingNumber}
              </span>{' '}
              — tracked here, on this page.
            </p>
          )}
        </div>
      </motion.div>

      {/* Route overview */}
      <div className="mt-6 rounded-3xl border border-[color-mix(in_srgb,var(--carrier-primary)_16%,transparent)] bg-surface p-5 shadow-soft sm:p-6">
        <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.12em] text-ink-700">
          Route overview
        </h3>
        <RouteMap events={result.events} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* History */}
        <div className="lg:col-span-2">
          <div className="rounded-3xl border border-[color-mix(in_srgb,var(--carrier-primary)_16%,transparent)] bg-surface p-5 shadow-soft sm:p-6">
            <h3 className="font-display text-lg font-semibold text-ink-900">Tracking history</h3>

            {history.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-400">
                No scans recorded yet. The first one appears here.
              </p>
            ) : (
              <ol className="relative mt-5 space-y-6 border-l-2 border-dashed border-ink-200 pl-6">
                {history.map((event, index) => {
                  const Icon = STAGE_ICONS[event.stage] ?? CircleDot;
                  const isLatest = index === 0;

                  return (
                    <li key={`${event.stage}-${index}`} className="relative">
                      <span
                        aria-hidden="true"
                        className={cn(
                          'absolute -left-[31px] flex h-7 w-7 items-center justify-center rounded-full border-2',
                          isLatest
                            ? 'border-[var(--carrier-primary)] bg-[var(--carrier-primary)] text-[var(--carrier-on-primary)] shadow-lg'
                            : 'border-ink-200 bg-surface text-ink-400',
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>

                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                        <p className="font-semibold text-ink-900">{event.title}</p>
                        <p className="font-mono text-xs text-ink-400">
                          {event.timestamp ? formatDateTime(event.timestamp) : 'Scheduled'}
                        </p>
                      </div>
                      <p className="text-sm text-ink-500">
                        {event.stage} · {event.location}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-400">{event.description}</p>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        {/* Details + QR */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-[color-mix(in_srgb,var(--carrier-primary)_16%,transparent)] bg-surface p-5 shadow-soft sm:p-6">
            <h3 className="font-display text-lg font-semibold text-ink-900">Shipment information</h3>

            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-400">From</dt>
                <dd className="mt-0.5 font-medium text-ink-900">{result.origin}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-400">To</dt>
                <dd className="mt-0.5 font-medium text-ink-900">{result.destination}</dd>
              </div>
              {latest && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-400">
                    Latest scan
                  </dt>
                  <dd className="mt-0.5 text-ink-600">
                    {latest.title} · {latest.location}
                  </dd>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 border-t border-ink-100 pt-4 text-ink-600">
                <p className="flex items-center gap-1.5">
                  <Boxes className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
                  {result.pieces} {result.pieces === 1 ? 'piece' : 'pieces'}
                </p>
                <p className="flex items-center gap-1.5">
                  <Weight className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
                  {result.weight}
                </p>
                <p className="col-span-2 flex items-center gap-1.5">
                  <Ruler className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden="true" />
                  {result.dimensions}
                </p>
              </div>
            </dl>
          </div>

          <div className="no-print rounded-3xl border border-[color-mix(in_srgb,var(--carrier-primary)_16%,transparent)] bg-surface p-5 shadow-soft sm:p-6">
            <h3 className="font-display text-lg font-semibold text-ink-900">Share or scan</h3>
            <div className="mt-4 flex flex-col items-center gap-3">
              <QrCode value={shareUrl || result.trackingNumber} />
              <p className="text-center text-xs leading-relaxed text-ink-400">
                Scan to open this shipment on a phone. The link works for anyone holding the number.
              </p>
            </div>
          </div>
        </div>
      </div>
    </CarrierThemeScope>
  );
}
