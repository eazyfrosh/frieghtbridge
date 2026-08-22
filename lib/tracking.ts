import { detectCarriers, isFreightBridgeNumber, normalizeCarrierNumber } from './carriers';
import { SEED_SHIPMENTS } from './fixtures/shipments';

/**
 * Mock shipment tracking layer.
 *
 * The prototype has no backend: `lookupShipment` resolves against an in-memory
 * fixture set after a short artificial delay so the UI can exercise its real
 * loading / success / not-found states. Swapping this file for a `fetch` call
 * to a real tracking API is the only change the UI needs.
 */

/**
 * The milestones a shipment passes, in order.
 *
 * Customs sits between the long haul and the final mile, which is where it
 * happens: freight clears at the border or at the destination gateway, before
 * a local driver ever sees it. Domestic shipments simply never record the
 * stage — the timeline shows what happened, not a fixed five-step ladder.
 */
export const TRACKING_STAGES = [
  'Order Confirmed',
  'Picked Up',
  'In Transit',
  'Customs Clearance',
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
  /**
   * When the booking was raised.
   *
   * The admin list is ordered by this. Without it the order was whatever
   * Firestore returned, which is by document id — and since a tracking number
   * is eight random digits, that put a brand-new booking wherever its number
   * happened to sort. Optional, because shipments written before this existed
   * do not have one.
   */
  createdAt?: string | null;
  service: string;
  origin: string;
  destination: string;
  currentLocation: string;
  /** Days from "now" until the promised delivery date. */
  etaInDays: number;
  pieces: number;
  weight: string;
  dimensions: string;
  /** Display name of whoever is carrying it. */
  carrier: string;
  /**
   * Registry id of that carrier, when the shipment was booked onto one. The
   * display name above is what people read; this is what code matches on, and
   * it survives the name being edited by hand.
   */
  carrierId?: string | null;
  /** The carrier's own product, e.g. "UPS 2nd Day Air". */
  carrierService?: string | null;
  /** The carrier's tracking number, once they have issued one. */
  carrierTrackingNumber?: string | null;
  /**
   * Where that number came from.
   *
   * `generated` matters: it is a reference we allocated in the carrier's
   * format because none existed yet, so the carrier's own site knows nothing
   * about it. The UI does not offer a dead deep link for one, and the operator
   * is told to replace it.
   */
  carrierNumberSource?: 'provider' | 'operator' | 'generated' | null;
  /**
   * Shipping label from the carrier. Operators only — a label carries the
   * sender's and recipient's full addresses, so it must never reach the public
   * tracking endpoint. `TrackingResult` omits it by type.
   */
  labelUrl?: string | null;
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
 * `customer`, `pickupDate` and `labelUrl` are omitted deliberately, not
 * incidentally. A tracking number is the only credential for `/api/tracking`,
 * and anyone who guesses one must not thereby learn a customer's name, email
 * and phone number, nor pull up a label with both addresses on it. Excluding
 * them from the type means a future `...shipment` spread fails to compile
 * rather than quietly leaking.
 *
 * The carrier leg is public, because it is the customer's own consignment: if
 * their pallet is moving on UPS, they get the UPS number and a link to it.
 */
export interface TrackingResult
  extends Omit<
    Shipment,
    | 'events'
    | 'etaInDays'
    | 'customer'
    | 'pickupDate'
    | 'labelUrl'
    | 'carrierTrackingNumber'
    | 'carrierNumberSource'
  > {
  events: ResolvedEvent[];
  estimatedDelivery: string;
  lastUpdate: string;
  progress: number;
  carrierTrackingNumber: string | null;
  carrierNumberSource: 'provider' | 'operator' | 'generated' | null;
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
    carrierId: shipment.carrierId ?? null,
    carrierService: shipment.carrierService ?? null,
    carrierTrackingNumber: shipment.carrierTrackingNumber ?? null,
    carrierNumberSource: shipment.carrierNumberSource ?? null,
    events,
    estimatedDelivery: new Date(now + shipment.etaInDays * 86_400_000).toISOString(),
    lastUpdate: new Date(lastReachedTime ?? now).toISOString(),
    progress: Math.round(((currentIndex + 1) / Math.max(ordered.length, 1)) * 100),
  };
}

export interface CarrierOutcomeSummary {
  id: string;
  name: string;
  initials: string;
  verified: boolean;
}

export interface CarrierOutcomeEvent {
  status: string;
  location: string;
  timestamp: string;
  description: string;
}

/**
 * What a lookup can come back as.
 *
 * `carrier` is the case the site gained when tracking stopped being only about
 * our own consignments: the number is recognisably FedEx, UPS, USPS, DHL and
 * so on, and the answer is that carrier plus a way through to it.
 */
export type LookupOutcome =
  | { ok: true; shipment: TrackingResult }
  | {
      ok: 'carrier';
      query: string;
      carrier: CarrierOutcomeSummary;
      alternatives: CarrierOutcomeSummary[];
      events: CarrierOutcomeEvent[] | null;
      status: string | null;
      note: string | null;
    }
  | { ok: false; reason: 'empty' | 'malformed' | 'not-found'; query: string };

/**
 * Resolve a raw shipment record into the shape the timeline renders.
 * Exported so the server-side tracking route can use it after a Firestore read.
 */
export function resolveShipment(shipment: Shipment): TrackingResult {
  return resolve(shipment);
}

/**
 * Client-side lookup, for our numbers and other carriers' alike.
 *
 * Shipment data lives in Firestore and is only reachable through the Admin
 * SDK, so this cannot query directly — it calls the server, which owns the
 * read and the carrier detection.
 *
 * The only thing rejected without a round trip is a string that no carrier in
 * the registry could have issued. Validating against our own `FBX-` format
 * alone would now turn away every real FedEx and UPS number typed into the
 * box.
 */
export async function lookupShipment(rawInput: string): Promise<LookupOutcome> {
  const query = rawInput.trim();

  if (!query) {
    return { ok: false, reason: 'empty', query };
  }

  if (detectCarriers(query).length === 0) {
    return { ok: false, reason: 'malformed', query };
  }

  // Our own numbers are normalised to `FBX-…`; anything else is passed through
  // as the carrier issued it, minus the spacing people paste from labels.
  const normalized = isFreightBridgeNumber(query)
    ? normalizeTrackingNumber(query)
    : normalizeCarrierNumber(query);

  try {
    const response = await fetch(`/api/tracking?number=${encodeURIComponent(normalized)}`, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return { ok: false, reason: 'not-found', query: normalized };
    }

    const body = (await response.json()) as {
      kind?: string;
      shipment?: TrackingResult;
      carrier?: CarrierOutcomeSummary;
      alternatives?: CarrierOutcomeSummary[];
      events?: CarrierOutcomeEvent[] | null;
      status?: string | null;
      note?: string | null;
    };

    if (body.kind === 'carrier' && body.carrier) {
      return {
        ok: 'carrier',
        query: normalized,
        carrier: body.carrier,
        alternatives: body.alternatives ?? [],
        events: body.events ?? null,
        status: body.status ?? null,
        note: body.note ?? null,
      };
    }

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
    // Amber, not the in-transit blue: customs is freight sitting still, and a
    // customer looking at the page wants to see that it is held rather than
    // moving.
    case 'Customs Clearance':
      return {
        label: 'In customs',
        className: 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200 ring-amber-600/20',
        dot: 'bg-amber-500',
      };
    default:
      return {
        label: status,
        className: 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 ring-brand-600/20',
        dot: 'bg-brand-500',
      };
  }
}
