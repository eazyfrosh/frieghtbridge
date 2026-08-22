'use client';

import { MapPin } from 'lucide-react';
import { useState } from 'react';
import type { ResolvedEvent } from '@/lib/tracking';
import { formatDateTime } from '@/lib/utils';

/**
 * The route as a line of checkpoints, earliest to latest.
 *
 * Not a map. A real one needs geocoded coordinates for every scan location and
 * a tile provider on every page load, and what a customer actually wants to
 * know — how far along is it, where was it last seen — this answers without
 * either. Calling it a route overview rather than a map is the honest framing.
 *
 * Only checkpoints that have happened are plotted; a scheduled step has no
 * position on a line whose whole meaning is progress.
 */
export function RouteMap({ events }: { events: ResolvedEvent[] }) {
  const [active, setActive] = useState<number | null>(null);

  const reached = events.filter((event) => event.timestamp !== null);

  if (reached.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-ink-200 text-sm text-ink-400">
        No checkpoints yet — the first scan appears here.
      </div>
    );
  }

  const points = reached.map((event, index) => ({
    event,
    x: reached.length === 1 ? 50 : (index / (reached.length - 1)) * 100,
    isLast: index === reached.length - 1,
  }));

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--carrier-primary)_16%,transparent)] bg-gradient-to-b from-[color-mix(in_srgb,var(--carrier-primary)_7%,transparent)] to-transparent p-6">
      <div aria-hidden="true" className="bg-grid absolute inset-0 opacity-40" />

      <div className="relative h-28">
        <svg
          viewBox="0 0 100 20"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="absolute inset-x-0 top-1/2 h-px w-full -translate-y-1/2"
        >
          <line
            x1="0"
            y1="10"
            x2="100"
            y2="10"
            stroke="currentColor"
            strokeWidth="0.6"
            strokeDasharray="1.5 2"
            vectorEffect="non-scaling-stroke"
            className="text-ink-300"
          />
        </svg>

        {points.map((point, index) => (
          <button
            key={`${point.event.stage}-${index}`}
            type="button"
            onMouseEnter={() => setActive(index)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(index)}
            onBlur={() => setActive(null)}
            style={{ left: `${point.x}%` }}
            className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <span className="sr-only">
              {point.event.location} — {point.event.title}
              {point.event.timestamp ? `, ${formatDateTime(point.event.timestamp)}` : ''}
            </span>

            {point.isLast && (
              <span
                aria-hidden="true"
                className="animate-pulse-ring absolute h-5 w-5 rounded-full bg-[color-mix(in_srgb,var(--carrier-primary)_35%,transparent)]"
              />
            )}
            <span
              aria-hidden="true"
              className={
                point.isLast
                  ? 'flex h-5 w-5 items-center justify-center rounded-full bg-[var(--carrier-primary)] text-[var(--carrier-on-primary)] shadow-lg'
                  : 'flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-[var(--carrier-secondary)] bg-surface'
              }
            >
              {point.isLast && <MapPin className="h-2.5 w-2.5" />}
            </span>

            {active === index && (
              <div
                aria-hidden="true"
                className="absolute bottom-8 z-10 w-48 rounded-xl border border-ink-200 bg-surface p-2.5 text-left text-xs shadow-card"
              >
                <p className="font-semibold text-ink-900">{point.event.location}</p>
                <p className="mt-0.5 text-ink-500">{point.event.title}</p>
                {point.event.timestamp && (
                  <p className="mt-1 text-ink-400">{formatDateTime(point.event.timestamp)}</p>
                )}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
