import { sleep } from './utils';

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

const SHIPMENTS: Shipment[] = [
  {
    trackingNumber: 'FBX-28473921',
    status: 'In Transit',
    service: 'LTL Freight — Standard',
    origin: 'Chicago, IL, United States',
    destination: 'Dallas, TX, United States',
    currentLocation: 'Springfield, MO, United States',
    etaInDays: 1,
    pieces: 6,
    weight: '1,240 lb / 562 kg',
    dimensions: '48 × 40 × 52 in (per pallet)',
    carrier: 'FreightBridge Linehaul 214',
    events: [
      {
        stage: 'Order Confirmed',
        title: 'Shipment booked',
        location: 'Chicago, IL',
        hoursAgo: 54,
        description: 'Booking confirmed and pickup scheduled with the origin terminal.',
      },
      {
        stage: 'Picked Up',
        title: 'Picked up from shipper',
        location: 'Chicago, IL',
        hoursAgo: 41,
        description: '6 pallets collected and scanned at the Chicago consolidation hub.',
      },
      {
        stage: 'In Transit',
        title: 'Departed sort facility',
        location: 'Springfield, MO',
        hoursAgo: 5,
        description: 'Linehaul 214 is en route to the Dallas distribution center.',
      },
      {
        stage: 'Out for Delivery',
        title: 'Out for delivery',
        location: 'Dallas, TX',
        hoursAgo: -14,
        description: 'Final-mile driver assignment scheduled for the morning window.',
      },
      {
        stage: 'Delivered',
        title: 'Delivered',
        location: 'Dallas, TX',
        hoursAgo: -22,
        description: 'Proof of delivery captured at the receiving dock.',
      },
    ],
  },
  {
    trackingNumber: 'FBX-90112845',
    status: 'Out for Delivery',
    service: 'Last-Mile — Same Day',
    origin: 'Manchester, United Kingdom',
    destination: 'London, United Kingdom',
    currentLocation: 'Camden, London, United Kingdom',
    etaInDays: 0,
    pieces: 2,
    weight: '38 lb / 17 kg',
    dimensions: '24 × 18 × 14 in',
    carrier: 'FreightBridge Metro Van 07',
    events: [
      {
        stage: 'Order Confirmed',
        title: 'Shipment booked',
        location: 'Manchester, UK',
        hoursAgo: 20,
        description: 'Same-day service confirmed with a 2-hour pickup window.',
      },
      {
        stage: 'Picked Up',
        title: 'Collected from shipper',
        location: 'Manchester, UK',
        hoursAgo: 16,
        description: '2 parcels collected and manifested for the London run.',
      },
      {
        stage: 'In Transit',
        title: 'Arrived at London depot',
        location: 'Enfield, London, UK',
        hoursAgo: 4,
        description: 'Cross-docked and loaded onto the metro delivery route.',
      },
      {
        stage: 'Out for Delivery',
        title: 'Out for delivery',
        location: 'Camden, London, UK',
        hoursAgo: 1,
        description: 'Driver is 4 stops away. A delivery window has been sent to the recipient.',
      },
      {
        stage: 'Delivered',
        title: 'Delivered',
        location: 'London, UK',
        hoursAgo: -3,
        description: 'Signature will be captured on delivery.',
      },
    ],
  },
  {
    trackingNumber: 'FBX-55620174',
    status: 'Delivered',
    service: 'FTL Freight — Expedited',
    origin: 'Rotterdam, Netherlands',
    destination: 'Madrid, Spain',
    currentLocation: 'Madrid, Spain',
    etaInDays: -1,
    pieces: 18,
    weight: '9,480 lb / 4,300 kg',
    dimensions: '13.6 m curtainsider (full load)',
    carrier: 'FreightBridge Cross-Border 41',
    events: [
      {
        stage: 'Order Confirmed',
        title: 'Shipment booked',
        location: 'Rotterdam, Netherlands',
        hoursAgo: 120,
        description: 'Full truckload booked with customs documentation pre-filed.',
      },
      {
        stage: 'Picked Up',
        title: 'Loaded at origin',
        location: 'Waalhaven, Rotterdam, Netherlands',
        hoursAgo: 108,
        description: '18 pallets loaded and sealed at the Waalhaven facility.',
      },
      {
        stage: 'In Transit',
        title: 'Linehaul in progress',
        location: 'Bordeaux, France',
        hoursAgo: 62,
        description: 'Driver change completed in 40m. Continuing to Madrid.',
      },
      {
        stage: 'Out for Delivery',
        title: 'Out for delivery',
        location: 'Getafe, Spain',
        hoursAgo: 30,
        description: 'Departed the Getafe yard for the consignee warehouse.',
      },
      {
        stage: 'Delivered',
        title: 'Delivered — signed for',
        location: 'Madrid, Spain',
        hoursAgo: 26,
        description: 'Received by L. Moreau. Proof of delivery available in your dashboard.',
      },
    ],
  },
  {
    trackingNumber: 'FBX-73004466',
    status: 'Exception',
    service: 'Freight Forwarding — Ocean FCL',
    origin: 'Jebel Ali, United Arab Emirates',
    destination: 'Rotterdam, Netherlands',
    currentLocation: 'Port of Algeciras, Spain',
    etaInDays: 6,
    pieces: 1,
    weight: '38,600 lb / 17,510 kg',
    dimensions: '1 × 40ft high-cube container',
    carrier: 'FreightBridge Ocean Partner Service',
    events: [
      {
        stage: 'Order Confirmed',
        title: 'Booking confirmed',
        location: 'Jebel Ali, UAE',
        hoursAgo: 384,
        description: 'Container booked on the westbound Europe service.',
      },
      {
        stage: 'Picked Up',
        title: 'Container gated in',
        location: 'Jebel Ali, UAE',
        hoursAgo: 360,
        description: 'Container sealed and gated in at the origin port.',
      },
      {
        stage: 'In Transit',
        title: 'Transshipment delay',
        location: 'Algeciras, Spain',
        hoursAgo: 9,
        description:
          'Vessel berthing delayed by port congestion. Revised arrival issued and your account team has been notified.',
      },
      {
        stage: 'Out for Delivery',
        title: 'Final drayage',
        location: 'Rotterdam, Netherlands',
        hoursAgo: -120,
        description: 'Drayage to the consignee will be scheduled once the container discharges.',
      },
      {
        stage: 'Delivered',
        title: 'Delivered',
        location: 'Rotterdam, Netherlands',
        hoursAgo: -140,
        description: 'Awaiting delivery.',
      },
    ],
  },
];

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

export async function lookupShipment(rawInput: string): Promise<LookupOutcome> {
  const query = rawInput.trim();

  if (!query) {
    return { ok: false, reason: 'empty', query };
  }

  // Simulated network latency so the loading state is real rather than decorative.
  await sleep(900);

  if (!isPlausibleTrackingNumber(query)) {
    return { ok: false, reason: 'malformed', query };
  }

  const normalized = normalizeTrackingNumber(query);
  const match = SHIPMENTS.find((shipment) => shipment.trackingNumber === normalized);

  if (!match) {
    return { ok: false, reason: 'not-found', query: normalized };
  }

  return { ok: true, shipment: resolve(match) };
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
