import { SEED_SHIPMENTS } from './fixtures/shipments';

/**
 * Mock shipment tracking layer.
 *
 * The prototype has no backend: `lookupShipment` resolves against an in-memory
 * fixture set after a short artificial delay so the UI can exercise its real
 * loading / success / not-found states. Swapping this file for a `fetch` call
 * to a real tracking API is the only change the UI needs.
 */

export const TRACKING_STAGES = [
  'Order Confirmed',
  'Picked Up',
  'In Transit',
  'Out for Delivery',
  'Delivered',
] as const;

export type TrackingStage = (typeof TRACKING_STAGES)[number];

export type ShipmentStatus = TrackingStage | 'Exception';

export interface TrackingEvent {
  stage: TrackingStage;
  title: string;
  location: string;
  /**
   * Hours before "now" that this event happened, for the seed fixtures — they
   * have to stay plausible whenever the demo is opened, so they are relative.
   */
  hoursAgo: number;
  /**
   * Absolute time, for events an operator actually recorded. A real scan
   * happened at a moment, not "six hours before whenever you load the page",
   * so this wins over `hoursAgo` when present.
   */
  at?: string | null;
  description: string;
}

/**
 * Who the shipment is for.
 *
 * Optional, because the seed fixtures predate booking and a shipment read back
 * from an older document will not have it. Never sent to the public tracking
 * endpoint — `TrackingResult` omits it, so a tracking number cannot be used to
 * look up a customer's name, email and phone number.
 */
export interface ShipmentCustomer {
  name: string;
  email: string;
  phone: string;
  company: string;
}

export interface Shipment {
  trackingNumber: string;
  status: ShipmentStatus;
  customer?: ShipmentCustomer | null;
  /** ISO date (no time) the freight is due to be collected. */
  pickupDate?: string | null;
  service: string;
  origin: string;
  destination: string;
  currentLocation: string;
  /** Days from "now" until the promised delivery date. */
  etaInDays: number;
  pieces: number;
  weight: string;
  dimensions: string;
  carrier: string;
  events: TrackingEvent[];
}

/** A resolved event with real timestamps and a lifecycle state for the timeline. */
export interface ResolvedEvent extends Omit<TrackingEvent, 'hoursAgo'> {
  timestamp: string | null;
  state: 'complete' | 'current' | 'upcoming';
}

/**
 * What the public tracking endpoint returns.
 *
 * `customer` and `pickupDate` are omitted deliberately, not incidentally. A
 * tracking number is the only credential for `/api/tracking`, and anyone who
 * guesses one must not thereby learn a customer's name, email and phone
 * number. Excluding them from the type means a future `...shipment` spread
 * fails to compile rather than quietly leaking.
 */
export interface TrackingResult
  extends Omit<Shipment, 'events' | 'etaInDays' | 'customer' | 'pickupDate'> {
  events: ResolvedEvent[];
  estimatedDelivery: string;
  lastUpdate: string;
  progress: number;
}

/** Kept as a named export for the seed script and the no-Firebase fallback. */
export const SHIPMENTS: Shipment[] = SEED_SHIPMENTS;

export const DEMO_TRACKING_NUMBERS = SHIPMENTS.map((s) => s.trackingNumber);

/**
 * Accepts the formats people actually paste: `fbx28473921`, `FBX 28473921`,
 * `fbx-28473921`, or the bare `28473921`.
 */
export function normalizeTrackingNumber(input: string): string {
  const cleaned = input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!cleaned) return '';
  const digits = cleaned.startsWith('FBX') ? cleaned.slice(3) : cleaned;
  return `FBX-${digits}`;
}

export function isPlausibleTrackingNumber(input: string): boolean {
  return /^FBX-\d{6,10}$/.test(normalizeTrackingNumber(input));
}

/**
 * When an event happened, or null if it has not happened yet.
 *
 * An explicit `at` wins over `hoursAgo`, and a future `at` counts as not yet
 * reached — the same thing a negative `hoursAgo` has always meant, so the
 * timeline renders a scheduled step identically whichever source it came from.
 */
function occurredAt(event: TrackingEvent, now: number): number | null {
  if (event.at) {
    const parsed = Date.parse(event.at);
    if (Number.isNaN(parsed)) return null;
    return parsed <= now ? parsed : null;
  }
  return event.hoursAgo >= 0 ? now - event.hoursAgo * 3600_000 : null;
}

function resolve(shipment: Shipment): TrackingResult {
  const now = Date.now();

  // Chronological, because an operator can record a scan that happened before
  // one already on the record — a late-arriving depot update, a correction.
  // Fixtures are already in order, so this changes nothing for them.
  const ordered = shipment.events
    .map((event, index) => ({ event, index, time: occurredAt(event, now) }))
    .sort((a, b) => {
      if (a.time !== null && b.time !== null) return a.time - b.time;
      // Anything that has happened comes before anything still scheduled;
      // among equals, the original order is preserved.
      if (a.time !== null) return -1;
      if (b.time !== null) return 1;
      return a.index - b.index;
    });

  const reachedIndexes = ordered
    .map(({ time }, index) => (time !== null ? index : -1))
    .filter((index) => index >= 0);
  const currentIndex = reachedIndexes.length ? Math.max(...reachedIndexes) : 0;

  const events: ResolvedEvent[] = ordered.map(({ event, time }, index) => {
    const { hoursAgo: _hoursAgo, at: _at, ...rest } = event;
    return {
      ...rest,
      timestamp: time === null ? null : new Date(time).toISOString(),
      state: index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming',
    };
  });

  const lastReachedTime = ordered[currentIndex]?.time ?? null;

  return {
    trackingNumber: shipment.trackingNumber,
    status: shipment.status,
    service: shipment.service,
    origin: shipment.origin,
    destination: shipment.destination,
    currentLocation: shipment.currentLocation,
    pieces: shipment.pieces,
    weight: shipment.weight,
    dimensions: shipment.dimensions,
    carrier: shipment.carrier,
    events,
    estimatedDelivery: new Date(now + shipment.etaInDays * 86_400_000).toISOString(),
    lastUpdate: new Date(lastReachedTime ?? now).toISOString(),
    progress: Math.round(((currentIndex + 1) / Math.max(ordered.length, 1)) * 100),
  };
}

export type LookupOutcome =
  | { ok: true; shipment: TrackingResult }
  | { ok: false; reason: 'empty' | 'malformed' | 'not-found'; query: string };

/**
 * Resolve a raw shipment record into the shape the timeline renders.
 * Exported so the server-side tracking route can use it after a Firestore read.
 */
export function resolveShipment(shipment: Shipment): TrackingResult {
  return resolve(shipment);
}

/**
 * Client-side lookup.
 *
 * Shipment data lives in Firestore and is only reachable through the Admin
 * SDK, so this cannot query directly — it calls the server, which owns the
 * read. Validation still happens here first so an obviously malformed number
 * never costs a round trip.
 */
export async function lookupShipment(rawInput: string): Promise<LookupOutcome> {
  const query = rawInput.trim();

  if (!query) {
    return { ok: false, reason: 'empty', query };
  }

  if (!isPlausibleTrackingNumber(query)) {
    return { ok: false, reason: 'malformed', query };
  }

  const normalized = normalizeTrackingNumber(query);

  try {
    const response = await fetch(`/api/tracking?number=${encodeURIComponent(normalized)}`, {
      headers: { Accept: 'application/json' },
    });

    if (response.status === 404) {
      return { ok: false, reason: 'not-found', query: normalized };
    }
    if (!response.ok) {
      return { ok: false, reason: 'not-found', query: normalized };
    }

    const body = (await response.json()) as { shipment?: TrackingResult };
    if (!body.shipment) {
      return { ok: false, reason: 'not-found', query: normalized };
    }

    return { ok: true, shipment: body.shipment };
  } catch {
    // Offline or the request failed outright. "Not found" is the honest thing
    // to show — we genuinely could not find it — and the UI offers a retry.
    return { ok: false, reason: 'not-found', query: normalized };
  }
}

export function statusTone(status: ShipmentStatus): {
  label: string;
  className: string;
  dot: string;
} {
  switch (status) {
    case 'Delivered':
      return {
        label: 'Delivered',
        className: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-600/20',
        dot: 'bg-emerald-500',
      };
    case 'Exception':
      return {
        label: 'Delay reported',
        className: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-rose-600/20',
        dot: 'bg-rose-500',
      };
    case 'Out for Delivery':
      return {
        label: 'Out for delivery',
        className: 'bg-brand-800 text-white ring-brand-900/30',
        dot: 'bg-white',
      };
    default:
      return {
        label: status,
        className: 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 ring-brand-600/20',
        dot: 'bg-brand-500',
      };
  }
}
