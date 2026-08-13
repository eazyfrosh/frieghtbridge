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
  /** Hours before "now" that this event happened. Resolved at lookup time. */
  hoursAgo: number;
  description: string;
}

export interface Shipment {
  trackingNumber: string;
  status: ShipmentStatus;
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

export interface TrackingResult extends Omit<Shipment, 'events' | 'etaInDays'> {
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

function hoursFromNow(hours: number): string {
  return new Date(Date.now() - hours * 3600_000).toISOString();
}

function resolve(shipment: Shipment): TrackingResult {
  const reachedIndexes = shipment.events
    .map((event, index) => (event.hoursAgo >= 0 ? index : -1))
    .filter((index) => index >= 0);
  const currentIndex = reachedIndexes.length ? Math.max(...reachedIndexes) : 0;

  const events: ResolvedEvent[] = shipment.events.map((event, index) => {
    const { hoursAgo, ...rest } = event;
    return {
      ...rest,
      timestamp: hoursAgo >= 0 ? hoursFromNow(hoursAgo) : null,
      state: index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming',
    };
  });

  const lastReached = shipment.events[currentIndex];

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
    estimatedDelivery: new Date(Date.now() + shipment.etaInDays * 86_400_000).toISOString(),
    lastUpdate: hoursFromNow(Math.max(lastReached.hoursAgo, 0)),
    progress: Math.round(((currentIndex + 1) / shipment.events.length) * 100),
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
        className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
        dot: 'bg-emerald-500',
      };
    case 'Exception':
      return {
        label: 'Delay reported',
        className: 'bg-rose-50 text-rose-700 ring-rose-600/20',
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
        className: 'bg-brand-50 text-brand-700 ring-brand-600/20',
        dot: 'bg-brand-500',
      };
  }
}
