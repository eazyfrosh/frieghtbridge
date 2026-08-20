'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Check,
  CircleDashed,
  Flag,
  Headphones,
  Loader2,
  MapPin,
  Navigation,
  PackageSearch,
  RefreshCw,
  Search,
  Truck,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useId, useState } from 'react';
import { EASE_PREMIUM } from '@/lib/motion';
import {
  lookupShipment,
  statusTone,
  type LookupOutcome,
  type TrackingResult,
} from '@/lib/tracking';
import { cn, formatDate, formatDateTime, timeAgo } from '@/lib/utils';
import { useReducedMotion } from '@/lib/use-reduced-motion';

type Status = 'idle' | 'loading' | 'done';

interface TrackingWidgetProps {
  /** `floating` overlaps the hero; `page` sits inline on the tracking page. */
  variant?: 'floating' | 'page';
  initialQuery?: string;
  className?: string;
}

// Describe the format rather than print a specimen number. A realistic-looking
// example on a live tracking page reads as a real consignment, and people paste
// it in and then ask why it does not match their shipment.
const ERROR_COPY: Record<'empty' | 'malformed' | 'not-found', { title: string; body: string }> = {
  empty: {
    title: 'Enter a tracking number',
    body: 'Your tracking number is on your booking confirmation and every document we send for the shipment.',
  },
  malformed: {
    title: "That doesn't look like a FreightBridge Logistics tracking number",
    body: 'Use the format FBX followed by 6 to 10 digits.',
  },
  'not-found': {
    title: 'No shipment found',
    body: 'Double-check the number against your booking confirmation. If it looks right, our team can trace it for you.',
  },
};

export function TrackingWidget({ variant = 'page', initialQuery = '', className }: TrackingWidgetProps) {
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<Status>('idle');
  const [outcome, setOutcome] = useState<LookupOutcome | null>(null);
  const reduced = useReducedMotion();
  const inputId = useId();

  const runLookup = useCallback(async (value: string) => {
    setStatus('loading');
    setOutcome(null);
    const result = await lookupShipment(value);
    setOutcome(result);
    setStatus('done');
  }, []);

  // A number arriving in the URL — from the hero form, or a shared link — has
  // to resolve on load. Seeding the input alone would leave the visitor
  // looking at a filled box, having to submit a search they already asked for.
  useEffect(() => {
    if (!initialQuery) return;
    void runLookup(initialQuery);
  }, [initialQuery, runLookup]);

  const floating = variant === 'floating';
  const result = outcome?.ok ? outcome.shipment : null;
  const error = outcome && !outcome.ok ? outcome.reason : null;

  return (
    <div
      className={cn(
        'relative rounded-4xl border bg-surface p-5 sm:p-7 lg:p-8',
        floating ? 'border-ink-100/80 shadow-lift' : 'border-ink-100 shadow-card',
        className,
      )}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 dark:bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-700 dark:text-brand-300">
            <PackageSearch className="h-3.5 w-3.5" aria-hidden="true" />
            Shipment tracking
          </span>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.02em] text-ink-900 sm:text-3xl">
            Track your shipment
          </h2>
          <p className="mt-2 max-w-md text-[0.95rem] text-ink-500">
            Enter your FreightBridge Logistics tracking number for live status, location, and delivery estimate.
          </p>
        </div>

        <div className="hidden shrink-0 items-center gap-2 rounded-full border border-ink-100 bg-ink-50/70 px-3.5 py-2 text-xs font-medium text-ink-500 lg:inline-flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-emerald-400" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Network status: all systems operational
        </div>
      </div>

      <form
        className="mt-6"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void runLookup(query);
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          Tracking number
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-[1.15rem] w-[1.15rem] -translate-y-1/2 text-ink-300"
              aria-hidden="true"
            />
            <input
              id={inputId}
              name="tracking"
              type="text"
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Enter tracking number"
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={`${inputId}-help`}
              className={cn(
                'h-14 w-full rounded-2xl border bg-surface pl-11 pr-4 text-[1rem] font-medium text-ink-900 transition-[border-color,box-shadow] duration-200 placeholder:font-normal placeholder:text-ink-300 focus:outline-none',
                error
                  ? 'border-red-400 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(248,113,113,0.16)]'
                  : 'border-ink-200 hover:border-ink-300 focus:border-brand-500 focus:shadow-[0_0_0_4px_rgba(255,106,0,0.14)]',
              )}
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="group inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl bg-brand-700 px-7 text-[0.98rem] font-semibold text-white shadow-[0_12px_32px_-14px_rgba(194,69,0,0.95)] transition-all duration-300 ease-premium hover:bg-brand-800 hover:shadow-[0_18px_40px_-16px_rgba(194,69,0,0.9)] disabled:cursor-progress disabled:opacity-80"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="h-[1.1rem] w-[1.1rem] animate-spin" aria-hidden="true" />
                Tracking…
              </>
            ) : (
              <>
                Track Shipment
                <ArrowRight
                  className="h-[1.1rem] w-[1.1rem] transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </>
            )}
          </button>
        </div>

        {/* Kept as the input's description so screen readers still announce the
            expected format — it just no longer offers a number to click. */}
        <p id={`${inputId}-help`} className="mt-3 text-sm text-ink-400">
          Your tracking number is on your booking confirmation.
        </p>
      </form>

      <div aria-live="polite" aria-atomic="false">
        <AnimatePresence mode="wait" initial={false}>
          {status === 'loading' && (
            <motion.div
              key="loading"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <TrackingSkeleton />
            </motion.div>
          )}

          {status === 'done' && error && (
            <motion.div
              key={`error-${error}`}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE_PREMIUM }}
              className="mt-6 rounded-3xl border border-rose-200 dark:border-rose-500/30 bg-rose-50/70 dark:bg-rose-500/10 p-5 sm:p-6"
            >
              <div className="flex gap-3.5">
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300">
                  <AlertTriangle className="h-[1.1rem] w-[1.1rem]" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-display text-[1.05rem] font-semibold text-ink-900">{ERROR_COPY[error].title}</p>
                  <p className="mt-1 text-[0.95rem] text-ink-600">{ERROR_COPY[error].body}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href="/contact"
                      className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-surface px-4 py-2 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-50"
                    >
                      <Headphones className="h-3.5 w-3.5" aria-hidden="true" />
                      Contact support
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {status === 'done' && result && (
            <motion.div
              key={result.trackingNumber}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE_PREMIUM }}
            >
              <TrackingResultPanel result={result} reduced={Boolean(reduced)} />
            </motion.div>
          )}

          {status === 'idle' && (
            <motion.div
              key="idle"
              initial={false}
              exit={{ opacity: 0 }}
              className="mt-6 flex items-start gap-3 rounded-2xl border border-dashed border-ink-200 bg-ink-50/50 p-4 text-sm text-ink-500"
            >
              <PackageSearch className="mt-0.5 h-[1.1rem] w-[1.1rem] shrink-0 text-ink-400" aria-hidden="true" />
              <p>
                Your shipment timeline will appear here. Tracking updates automatically at every scan, from pickup
                through to proof of delivery.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TrackingSkeleton() {
  return (
    <div className="mt-6 overflow-hidden rounded-3xl border border-ink-100 bg-surface p-5 sm:p-6" aria-hidden="true">
      <div className="flex items-center justify-between gap-4">
        <div className="h-6 w-40 animate-pulse rounded-full bg-ink-100" />
        <div className="h-6 w-24 animate-pulse rounded-full bg-ink-100" />
      </div>
      <div className="mt-5 h-2 w-full animate-pulse rounded-full bg-ink-100" />
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <div key={index} className="rounded-2xl border border-ink-100 p-3.5">
            <div className="h-3 w-16 animate-pulse rounded bg-ink-100" />
            <div className="mt-2.5 h-4 w-28 animate-pulse rounded bg-ink-100" />
          </div>
        ))}
      </div>
      <div className="mt-6 space-y-4">
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex gap-4">
            <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-ink-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 animate-pulse rounded bg-ink-100" />
              <div className="h-3 w-64 animate-pulse rounded bg-ink-100" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Looking up your shipment…</span>
    </div>
  );
}

function TrackingResultPanel({ result, reduced }: { result: TrackingResult; reduced: boolean }) {
  const tone = statusTone(result.status);

  const details = [
    { label: 'Origin', value: result.origin, icon: Flag },
    { label: 'Destination', value: result.destination, icon: MapPin },
    { label: 'Current location', value: result.currentLocation, icon: Navigation },
    { label: 'Estimated delivery', value: formatDate(result.estimatedDelivery), icon: CalendarClock },
    { label: 'Service', value: result.service, icon: Truck },
    { label: 'Last update', value: timeAgo(result.lastUpdate), icon: RefreshCw },
  ];

  return (
    <div className="mt-6 overflow-hidden rounded-3xl border border-ink-100 bg-surface shadow-soft">
      {/* Summary */}
      <div className="border-b border-ink-100 bg-gradient-to-br from-ink-50/80 to-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">Tracking number</p>
            <p className="mt-1 font-mono text-lg font-semibold tracking-tight text-ink-900">
              {result.trackingNumber}
            </p>
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 ring-inset',
              tone.className,
            )}
          >
            <span className={cn('h-2 w-2 rounded-full', tone.dot)} aria-hidden="true" />
            {tone.label}
          </span>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs font-medium text-ink-500">
            <span>{result.origin.split(',')[0]}</span>
            <span>{result.progress}% complete</span>
            <span>{result.destination.split(',')[0]}</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink-100">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400"
              initial={reduced ? { width: `${result.progress}%` } : { width: 0 }}
              animate={{ width: `${result.progress}%` }}
              transition={{ duration: 1, ease: EASE_PREMIUM, delay: 0.15 }}
            />
          </div>
        </div>
      </div>

      {/* Details */}
      <dl className="grid gap-px bg-ink-100 sm:grid-cols-2 lg:grid-cols-3">
        {details.map((detail) => (
          <div key={detail.label} className="bg-surface p-4 sm:p-5">
            <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink-400">
              <detail.icon className="h-3.5 w-3.5" aria-hidden="true" />
              {detail.label}
            </dt>
            <dd className="mt-1.5 text-[0.95rem] font-medium text-ink-800">{detail.value}</dd>
          </div>
        ))}
      </dl>

      {/* Timeline */}
      <div className="border-t border-ink-100 p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-lg font-semibold text-ink-900">Shipment timeline</h3>
          <p className="text-sm text-ink-400">
            {result.pieces} pieces · {result.weight}
          </p>
        </div>

        <ol className="mt-5">
          {result.events.map((event, index) => {
            const isLast = index === result.events.length - 1;
            return (
              <motion.li
                key={event.stage}
                className="relative flex gap-4 pb-6 last:pb-0"
                initial={reduced ? undefined : { opacity: 0, x: -10 }}
                animate={reduced ? undefined : { opacity: 1, x: 0 }}
                transition={{ duration: 0.42, ease: EASE_PREMIUM, delay: 0.12 + index * 0.08 }}
              >
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute left-[15px] top-9 h-[calc(100%-1.75rem)] w-0.5 rounded-full',
                      event.state === 'complete' ? 'bg-brand-500' : 'bg-ink-100',
                    )}
                  />
                )}

                <span
                  className={cn(
                    // No shared `bg-*` here: a base background would collide with
                    // the filled `complete` state and hide its white checkmark.
                    'relative z-10 mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
                    // Bright `brand-500` only carries white at 2.87:1, so the
                    // filled node steps down to `brand-700` (5.07:1).
                    event.state === 'complete' && 'border-brand-700 bg-brand-700 text-white',
                    event.state === 'current' && 'border-brand-500 bg-surface text-brand-700 dark:text-brand-300',
                    event.state === 'upcoming' && 'border-ink-200 bg-surface text-ink-300',
                  )}
                >
                  {event.state === 'complete' ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : event.state === 'current' ? (
                    <>
                      <span
                        className="absolute inset-0 animate-pulse-ring rounded-full bg-brand-400/50"
                        aria-hidden="true"
                      />
                      <Truck className="relative h-4 w-4" aria-hidden="true" />
                    </>
                  ) : (
                    <CircleDashed className="h-4 w-4" aria-hidden="true" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p
                      className={cn(
                        'font-display text-[1rem] font-semibold',
                        event.state === 'upcoming' ? 'text-ink-400' : 'text-ink-900',
                      )}
                    >
                      {event.stage}
                      {event.state === 'current' && (
                        <span className="ml-2 rounded-full bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 align-middle text-[0.7rem] font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
                          Now
                        </span>
                      )}
                    </p>
                    <p className="font-mono text-xs text-ink-400">
                      {event.timestamp ? formatDateTime(event.timestamp) : 'Scheduled'}
                    </p>
                  </div>
                  <p className={cn('mt-0.5 text-sm', event.state === 'upcoming' ? 'text-ink-400' : 'text-ink-600')}>
                    {event.title} · {event.location}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-400">{event.description}</p>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 bg-ink-50/60 px-5 py-4 sm:px-6">
        <p className="text-sm text-ink-500">
          Carrier: <span className="font-medium text-ink-700">{result.carrier}</span>
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 dark:text-brand-300 transition-colors hover:text-brand-800 dark:hover:text-brand-300"
        >
          Questions about this shipment?
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
