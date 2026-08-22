import 'server-only';

import {
  OWN_CARRIER_ID,
  SHIPMENT_TYPES,
  carrierById,
  carrierService,
  carriersFor,
  generateCarrierNumber,
  matchesCarrierFormat,
  normalizeCarrierNumber,
} from './carriers';
import { adminDb } from './firebase/admin';
import { SEED_SHIPMENTS } from './fixtures/shipments';
import { tenderShipment, shippingProviderConfigured, type TenderResult } from './fulfilment';
import {
  TRACKING_STAGES,
  type Shipment,
  type ShipmentCustomer,
  type ShipmentStatus,
  type TrackingEvent,
  type TrackingStage,
} from './tracking';

/**
 * Shipment reads, backed by Firestore.
 *
 * All access goes through the Admin SDK on the server. Firestore rules deny
 * every client read (see `firestore.rules`), so shipment data is never exposed
 * to the browser except through code in this repository that decides what to
 * return — the public tracking endpoint hands back one shipment for an exact
 * tracking number, and nothing else.
 *
 * **Fallback:** with no Firebase configured, these fall back to the seed
 * fixtures so a fresh clone still runs. Data degrades; authentication never
 * does — `lib/session.ts` returns null rather than pretending.
 */

const COLLECTION = 'shipments';

let warned = false;
function warnOnce() {
  if (warned || process.env.NODE_ENV === 'test') return;
  warned = true;
  console.warn(
    '[freightbridge] Firebase is not configured — serving seed shipment fixtures. ' +
      'Set FIREBASE_SERVICE_ACCOUNT_KEY to read from Firestore.',
  );
}

/** Narrows an untrusted Firestore document to a Shipment, or discards it. */
function toShipment(data: FirebaseFirestore.DocumentData | undefined): Shipment | null {
  if (!data) return null;
  const { trackingNumber, status, origin, destination } = data;
  if (typeof trackingNumber !== 'string' || typeof status !== 'string') return null;
  if (typeof origin !== 'string' || typeof destination !== 'string') return null;

  return {
    trackingNumber,
    status: status as ShipmentStatus,
    service: typeof data.service === 'string' ? data.service : '',
    origin,
    destination,
    currentLocation: typeof data.currentLocation === 'string' ? data.currentLocation : '',
    etaInDays: typeof data.etaInDays === 'number' ? data.etaInDays : 0,
    pieces: typeof data.pieces === 'number' ? data.pieces : 0,
    weight: typeof data.weight === 'string' ? data.weight : '',
    dimensions: typeof data.dimensions === 'string' ? data.dimensions : '',
    carrier: typeof data.carrier === 'string' ? data.carrier : '',
    carrierId: typeof data.carrierId === 'string' ? data.carrierId : null,
    carrierService: typeof data.carrierService === 'string' ? data.carrierService : null,
    carrierTrackingNumber:
      typeof data.carrierTrackingNumber === 'string' ? data.carrierTrackingNumber : null,
    carrierNumberSource:
      data.carrierNumberSource === 'provider' ||
      data.carrierNumberSource === 'operator' ||
      data.carrierNumberSource === 'generated'
        ? data.carrierNumberSource
        : null,
    labelUrl: typeof data.labelUrl === 'string' ? data.labelUrl : null,
    events: Array.isArray(data.events) ? data.events : [],
    customer: toCustomer(data.customer),
    pickupDate: typeof data.pickupDate === 'string' ? data.pickupDate : null,
  };
}

/** Absent on fixtures and on anything written before booking existed. */
function toCustomer(value: unknown): ShipmentCustomer | null {
  if (typeof value !== 'object' || value === null) return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.name !== 'string' || typeof raw.email !== 'string') return null;
  return {
    name: raw.name,
    email: raw.email,
    phone: typeof raw.phone === 'string' ? raw.phone : '',
    company: typeof raw.company === 'string' ? raw.company : '',
  };
}

/**
 * Every shipment: what is in Firestore, plus any fixture not yet stored there.
 *
 * The merge matters now that shipments are editable. Editing writes one
 * document, and a plain "non-empty collection wins" rule would make the other
 * three demo shipments vanish the moment an operator saved a change to the
 * first — a list that empties itself as you use it.
 *
 * Firestore always wins for a tracking number it holds, so an edited shipment
 * shows its edits. To retire the demo data for good, delete the entries from
 * `lib/fixtures/shipments.ts`.
 */
export async function listShipments(): Promise<Shipment[]> {
  const db = adminDb();
  if (!db) {
    warnOnce();
    return SEED_SHIPMENTS;
  }

  const snapshot = await db.collection(COLLECTION).get();
  const stored = snapshot.docs
    .map((doc) => toShipment(doc.data()))
    .filter((shipment): shipment is Shipment => shipment !== null);

  const storedNumbers = new Set(stored.map((shipment) => shipment.trackingNumber.toUpperCase()));
  const remainingFixtures = SEED_SHIPMENTS.filter(
    (fixture) => !storedNumbers.has(fixture.trackingNumber.toUpperCase()),
  );

  return [...stored, ...remainingFixtures];
}

export async function findShipment(trackingNumber: string): Promise<Shipment | null> {
  const wanted = trackingNumber.trim().toUpperCase();
  if (!wanted) return null;

  const db = adminDb();
  if (!db) {
    warnOnce();
    return SEED_SHIPMENTS.find((s) => s.trackingNumber.toUpperCase() === wanted) ?? null;
  }

  // The tracking number is the document id, so this is a point read rather
  // than a query — no index, and no scan proportional to collection size.
  const doc = await db.collection(COLLECTION).doc(wanted).get();
  if (doc.exists) return toShipment(doc.data());

  return SEED_SHIPMENTS.find((s) => s.trackingNumber.toUpperCase() === wanted) ?? null;
}

// ---------------------------------------------------------------------------
// Writes
//
// Shipments were read-only until now. Two operations are enough to run a
// consignment: correct its details, and record a scan.

/** Fields an operator may change. Tracking number is the document id, so not that. */
export interface ShipmentPatch {
  status: ShipmentStatus;
  service: string;
  origin: string;
  destination: string;
  currentLocation: string;
  etaInDays: number;
  pieces: number;
  weight: string;
  dimensions: string;
  carrier: string;
  /** Which platform the shipment is running on. Empty means none assigned. */
  carrierId: string | null;
  carrierService: string | null;
  /** That platform's own tracking number, once they have issued one. */
  carrierTrackingNumber: string | null;
  /**
   * Set by the route, not the form. An operator retyping the same generated
   * number must not promote it to a real one — only a different number is an
   * operator supplying the carrier's own reference.
   */
  carrierNumberSource: Shipment['carrierNumberSource'];
}

export const SHIPMENT_STATUSES: ShipmentStatus[] = [...TRACKING_STAGES, 'Exception'];

const MAX_TEXT = 120;
const MAX_DESCRIPTION = 400;

function text(value: unknown, max = MAX_TEXT): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

function count(value: unknown, min: number, max: number): number | null {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return null;
  const rounded = Math.round(parsed);
  if (rounded < min || rounded > max) return null;
  return rounded;
}

export interface CarrierAssignment {
  carrierId: string | null;
  carrierService: string | null;
  carrierTrackingNumber: string | null;
}

/**
 * Validate the platform a shipment is running on.
 *
 * Shared by booking and editing, because assigning a carrier at booking and
 * attaching one afterwards — which is what happens when freight is re-tendered
 * — have to agree on what a valid assignment is.
 *
 * A tracking number that does not match the carrier's known formats is
 * accepted with a warning rather than refused, for the same reason check
 * digits only rank in `lib/carriers.ts`: the registry does not know every
 * format a carrier has ever printed, and an operator holding a real number
 * should not be argued with by a regex.
 */
export function validateCarrierAssignment(
  raw: Record<string, unknown>,
): { assignment: CarrierAssignment; warning: string | null } | { error: string } {
  const carrierId = typeof raw.carrierId === 'string' ? raw.carrierId.trim() : '';
  if (!carrierId) {
    return { assignment: { carrierId: null, carrierService: null, carrierTrackingNumber: null }, warning: null };
  }

  const carrier = carrierById(carrierId);
  if (!carrier?.services?.length) return { error: 'That is not a carrier we can book onto.' };

  const serviceCode = typeof raw.carrierService === 'string' ? raw.carrierService.trim() : '';
  if (serviceCode && !carrierService(carrierId, serviceCode)) {
    return { error: `${carrier.name} does not offer that service.` };
  }

  const rawNumber = typeof raw.carrierTrackingNumber === 'string' ? raw.carrierTrackingNumber : '';
  const number = normalizeCarrierNumber(rawNumber.trim());

  if (number && !/^[A-Z0-9]{4,40}$/.test(number)) {
    return { error: 'A carrier tracking number is 4–40 letters and digits.' };
  }

  return {
    assignment: {
      carrierId,
      carrierService: serviceCode || null,
      carrierTrackingNumber: number || null,
    },
    warning:
      number && carrierId !== OWN_CARRIER_ID && !matchesCarrierFormat(carrierId, number)
        ? `Saved, but ${number} does not look like a ${carrier.name} tracking number. Check it before sending it to the customer.`
        : null,
  };
}

/**
 * Validate an edit. Returns the reason it was rejected rather than a bare null,
 * because "Origin is required" is a fixable message and "invalid" is not.
 */
export function validateShipmentPatch(
  input: unknown,
): { patch: ShipmentPatch; warning: string | null } | { error: string } {
  if (typeof input !== 'object' || input === null) return { error: 'Malformed request.' };
  const raw = input as Record<string, unknown>;

  const status = SHIPMENT_STATUSES.find((option) => option === raw.status);
  if (!status) return { error: 'Choose a valid status.' };

  const fields: Array<[keyof ShipmentPatch, string]> = [
    ['service', 'Service'],
    ['origin', 'Origin'],
    ['destination', 'Destination'],
    ['currentLocation', 'Current location'],
    ['weight', 'Weight'],
    ['dimensions', 'Dimensions'],
    ['carrier', 'Carrier'],
  ];

  const values: Record<string, string> = {};
  for (const [key, label] of fields) {
    const value = text(raw[key]);
    if (!value) return { error: `${label} is required, and must be under ${MAX_TEXT} characters.` };
    values[key] = value;
  }

  const pieces = count(raw.pieces, 1, 100_000);
  if (pieces === null) return { error: 'Pieces must be a whole number of at least 1.' };

  // Negative days are allowed: a shipment can be past its promised date, and
  // refusing to record that would force the operator to lie about the ETA.
  const etaInDays = count(raw.etaInDays, -365, 365);
  if (etaInDays === null) return { error: 'ETA must be a number of days within a year either side.' };

  const assignment = validateCarrierAssignment(raw);
  if ('error' in assignment) return { error: assignment.error };

  return {
    patch: {
      ...assignment.assignment,
      // Provisional: the route replaces this once it can compare against the
      // stored shipment.
      carrierNumberSource: assignment.assignment.carrierTrackingNumber ? 'operator' : null,
      status,
      service: values.service,
      origin: values.origin,
      destination: values.destination,
      currentLocation: values.currentLocation,
      weight: values.weight,
      dimensions: values.dimensions,
      carrier: values.carrier,
      pieces,
      etaInDays,
    },
    warning: assignment.warning,
  };
}

export interface NewEventInput {
  stage: TrackingStage;
  title: string;
  location: string;
  description: string;
  at: string;
  /** Move the shipment's status and current location to match this scan. */
  advanceShipment: boolean;
}

export function validateEvent(input: unknown): { event: NewEventInput } | { error: string } {
  if (typeof input !== 'object' || input === null) return { error: 'Malformed request.' };
  const raw = input as Record<string, unknown>;

  const stage = TRACKING_STAGES.find((option) => option === raw.stage);
  if (!stage) return { error: 'Choose a valid stage.' };

  const title = text(raw.title);
  if (!title) return { error: 'Give the event a short title.' };

  const location = text(raw.location);
  if (!location) return { error: 'Where did this happen?' };

  const description = text(raw.description, MAX_DESCRIPTION);
  if (!description) return { error: `Add a description, under ${MAX_DESCRIPTION} characters.` };

  // Defaults to now, which is what recording a scan as it happens means.
  const rawAt = typeof raw.at === 'string' && raw.at.trim() ? raw.at.trim() : new Date().toISOString();
  const parsed = Date.parse(rawAt);
  if (Number.isNaN(parsed)) return { error: 'That date and time could not be read.' };
  if (parsed > Date.now() + 366 * 86_400_000) return { error: 'That date is too far in the future.' };

  return {
    event: {
      stage,
      title,
      location,
      description,
      at: new Date(parsed).toISOString(),
      advanceShipment: raw.advanceShipment !== false,
    },
  };
}

/**
 * The record to write for a shipment that has only ever been a fixture.
 *
 * Editing one of the demo shipments has to store the whole thing, not just the
 * changed fields — a document holding nothing but an edited origin would read
 * back as a shipment with no events and no carrier.
 */
function baseFor(trackingNumber: string): Shipment | null {
  return SEED_SHIPMENTS.find((s) => s.trackingNumber.toUpperCase() === trackingNumber) ?? null;
}

/** Apply an edit. Returns the saved shipment, or null if it does not exist. */
export async function updateShipment(
  trackingNumber: string,
  patch: ShipmentPatch,
): Promise<Shipment | null> {
  const wanted = trackingNumber.trim().toUpperCase();
  const db = adminDb();
  if (!db || !wanted) return null;

  const ref = db.collection(COLLECTION).doc(wanted);
  const existing = await ref.get();
  const current = existing.exists ? toShipment(existing.data()) : baseFor(wanted);
  if (!current) return null;

  const next: Shipment = { ...current, ...patch, trackingNumber: wanted };
  await ref.set(next);
  return next;
}

/**
 * Record a scan.
 *
 * A transaction, because the read-modify-write of the events array would
 * otherwise drop one of two scans entered at the same moment — which is
 * exactly when a depot and a driver both update a shipment.
 */
export async function addTrackingEvent(
  trackingNumber: string,
  input: NewEventInput,
): Promise<Shipment | null> {
  const wanted = trackingNumber.trim().toUpperCase();
  const db = adminDb();
  if (!db || !wanted) return null;

  const ref = db.collection(COLLECTION).doc(wanted);

  return db.runTransaction(async (tx) => {
    const snapshot = await tx.get(ref);
    const current = snapshot.exists ? toShipment(snapshot.data()) : baseFor(wanted);
    if (!current) return null;

    const event: TrackingEvent = {
      stage: input.stage,
      title: input.title,
      location: input.location,
      description: input.description,
      at: input.at,
      // Ignored whenever `at` is set, but kept so a record written here is the
      // same shape as a fixture and nothing downstream has to special-case it.
      hoursAgo: 0,
    };

    const next: Shipment = {
      ...current,
      trackingNumber: wanted,
      events: [...current.events, event],
      ...(input.advanceShipment
        ? { status: input.stage as ShipmentStatus, currentLocation: input.location }
        : {}),
    };

    tx.set(ref, next);
    return next;
  });
}

/**
 * Whether writes can land. Reads fall back to fixtures without Firestore, but
 * a save has nowhere to go — so the admin forms say so instead of failing.
 */
export function shipmentsWritable(): boolean {
  return adminDb() !== null;
}

// ---------------------------------------------------------------------------
// Booking
//
// The last piece that only pretended to work: /admin/book waited 1.2 seconds
// and invented a reference number. A booking now creates a real shipment, with
// a tracking number the customer can actually use — on our own network or on
// whichever carrier's platform the operator books it onto.

export interface BookingInput {
  fromCountry: string;
  fromCity: string;
  fromZip: string;
  toCountry: string;
  toCity: string;
  toZip: string;
  shipmentType: string;
  weight: string;
  dimensions: string;
  pieces: number;
  pickupDate: string;
  /** Registry id of the platform this is booked onto. */
  carrierId: string;
  /** Service code within that platform, e.g. `ups-2nd-day-air`. */
  carrierService: string;
  /** Their number, when the operator already has one. */
  carrierTrackingNumber: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
}

export function validateBooking(
  input: unknown,
): { booking: BookingInput; warning: string | null } | { error: string } {
  if (typeof input !== 'object' || input === null) return { error: 'Malformed request.' };
  const raw = input as Record<string, unknown>;

  const required: Array<[keyof BookingInput, string]> = [
    ['fromCountry', 'Origin country'],
    ['fromCity', 'Pickup city'],
    ['fromZip', 'Origin postal code'],
    ['toCountry', 'Destination country'],
    ['toCity', 'Delivery city'],
    ['toZip', 'Destination postal code'],
    ['weight', 'Weight'],
    ['name', 'Contact name'],
    ['phone', 'Phone number'],
  ];

  const values: Record<string, string> = {};
  for (const [key, label] of required) {
    const value = text(raw[key]);
    if (!value) return { error: `${label} is required.` };
    values[key] = value;
  }

  const shipmentType = SHIPMENT_TYPES.find((option) => option === raw.shipmentType);
  if (!shipmentType) return { error: 'Choose a shipment type.' };

  // Which platform, and which of its products. Both are required at booking —
  // unlike an edit, where a shipment can legitimately sit unassigned while the
  // operator decides who to tender it to.
  const assignment = validateCarrierAssignment(raw);
  if ('error' in assignment) return { error: assignment.error };

  const carrierId = assignment.assignment.carrierId;
  if (!carrierId) return { error: 'Choose which carrier is taking this shipment.' };

  const carrier = carrierById(carrierId);
  if (!carrier?.handles?.includes(shipmentType)) {
    return { error: `${carrier?.name ?? 'That carrier'} does not take ${shipmentType.toLowerCase()} freight.` };
  }

  const serviceCode = assignment.assignment.carrierService;
  if (!serviceCode) return { error: `Choose a ${carrier.name} service.` };

  const email = typeof raw.email === 'string' ? raw.email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Enter a valid email address.' };

  const pieces = count(raw.pieces, 1, 100_000);
  if (pieces === null) return { error: 'Pieces must be a whole number of at least 1.' };

  const pickupDate = typeof raw.pickupDate === 'string' ? raw.pickupDate.trim() : '';
  const pickupMs = Date.parse(`${pickupDate}T00:00:00Z`);
  if (!pickupDate || Number.isNaN(pickupMs)) return { error: 'Choose a pickup date.' };
  if (pickupMs > Date.now() + 366 * 86_400_000) return { error: 'That pickup date is too far ahead.' };

  return {
    booking: {
      fromCountry: values.fromCountry,
      fromCity: values.fromCity,
      fromZip: values.fromZip,
      toCountry: values.toCountry,
      toCity: values.toCity,
      toZip: values.toZip,
      shipmentType,
      weight: values.weight,
      // The form does not require dimensions, and a booking should not be
      // blocked on them — the operator can fill them in later.
      dimensions: text(raw.dimensions) ?? 'Not specified',
      pieces,
      pickupDate,
      carrierId,
      carrierService: serviceCode,
      carrierTrackingNumber: assignment.assignment.carrierTrackingNumber ?? '',
      name: values.name,
      businessName: text(raw.businessName) ?? '',
      email,
      phone: values.phone,
    },
    warning: assignment.warning,
  };
}

/** `FBX-` plus eight digits, matching what the public lookup accepts. */
function candidateTrackingNumber(): string {
  const digits = Math.floor(10_000_000 + Math.random() * 90_000_000);
  return `FBX-${digits}`;
}

/** Whole days from today to `date`, floored at zero. */
function daysUntil(date: string): number {
  const target = Date.parse(`${date}T00:00:00Z`);
  const today = new Date();
  const startOfToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.max(0, Math.round((target - startOfToday) / 86_400_000));
}

function shipmentFromBooking(
  trackingNumber: string,
  booking: BookingInput,
  carrierNumber: { value: string; source: Shipment['carrierNumberSource'] } | null,
  labelUrl: string | null,
): Shipment {
  const origin = `${booking.fromCity}, ${booking.fromCountry}`;
  const destination = `${booking.toCity}, ${booking.toCountry}`;
  const now = new Date().toISOString();

  const carrier = carrierById(booking.carrierId);
  const service = carrierService(booking.carrierId, booking.carrierService);
  const onOwnNetwork = booking.carrierId === OWN_CARRIER_ID;

  const carrierTrackingNumber = carrierNumber?.value ?? '';

  const serviceName = service?.name ?? booking.carrierService;

  return {
    trackingNumber,
    // Reads "Pallet · UPS 2nd Day Air" off-network, "Pallet · Standard" on it,
    // since prefixing our own services with our own name says nothing.
    service: `${booking.shipmentType} · ${serviceName}`,
    status: 'Order Confirmed',
    origin,
    destination,
    currentLocation: origin,
    // Collection plus transit, rather than transit alone — a booking made for
    // next week is not arriving in four days.
    etaInDays: daysUntil(booking.pickupDate) + (service?.transitDays ?? 4),
    pieces: booking.pieces,
    weight: booking.weight,
    dimensions: booking.dimensions,
    carrier: carrier?.name ?? 'FreightBridge Logistics',
    carrierId: booking.carrierId,
    carrierService: booking.carrierService,
    carrierTrackingNumber: carrierTrackingNumber || null,
    carrierNumberSource: carrierNumber?.source ?? null,
    labelUrl,
    pickupDate: booking.pickupDate,
    customer: {
      name: booking.name,
      email: booking.email,
      phone: booking.phone,
      company: booking.businessName,
    } satisfies ShipmentCustomer,
    events: [
      {
        stage: 'Order Confirmed',
        title: 'Booking confirmed',
        location: origin,
        description: `${booking.pieces} ${booking.shipmentType.toLowerCase()}${
          booking.pieces === 1 ? '' : 's'
        } booked for collection on ${booking.pickupDate}. ${serviceName} to ${destination}.${
          // A generated reference is deliberately left out of the customer's
          // timeline. It is shown alongside the shipment either way, but
          // writing "UPS reference X" into the history asserts UPS issued it,
          // and they did not.
          onOwnNetwork || !carrierTrackingNumber || carrierNumber?.source === 'generated'
            ? ''
            : ` ${carrier?.name ?? 'Carrier'} reference ${carrierTrackingNumber}.`
        }`,
        at: now,
        hoursAgo: 0,
      },
    ],
  };
}

/**
 * Hand the booking to the carrier, if there is anything to hand it to.
 *
 * Three cases, and `attempted` is what separates the last from the first two:
 * our own network needs no tender, an unconfigured provider means the operator
 * is working manually, and a configured provider that failed is a problem the
 * operator has to be told about.
 */
async function tenderIfPossible(
  booking: BookingInput,
): Promise<{ attempted: boolean; result: { trackingNumber: string; labelUrl: string | null } | null }> {
  if (booking.carrierId === OWN_CARRIER_ID) return { attempted: false, result: null };
  if (!shippingProviderConfigured()) return { attempted: false, result: null };
  // Already tendered elsewhere: the operator booked it on the carrier's own
  // platform and pasted the number, so buying a second label would be a second
  // consignment and a second invoice.
  if (booking.carrierTrackingNumber) return { attempted: false, result: null };

  const result = await tenderShipment({
    carrierId: booking.carrierId,
    serviceCode: booking.carrierService,
    reference: `${booking.name} · ${booking.pickupDate}`,
    from: { city: booking.fromCity, postalCode: booking.fromZip, country: booking.fromCountry },
    to: { city: booking.toCity, postalCode: booking.toZip, country: booking.toCountry },
    parcel: { pieces: booking.pieces, weight: booking.weight, dimensions: booking.dimensions },
    contact: {
      name: booking.name,
      company: booking.businessName,
      email: booking.email,
      phone: booking.phone,
    },
  });

  return { attempted: true, result };
}

/**
 * Which carrier reference the shipment gets, and where it came from.
 *
 * Three sources in strict order of authority:
 *
 *  1. the provider, which is the carrier's own system answering;
 *  2. whatever the operator typed, because they are looking at the label;
 *  3. one we allocate in the carrier's format, so the shipment is not left
 *     with a blank where its reference should be.
 *
 * The third is a placeholder and is recorded as such. It has the right shape
 * and a valid check digit — it will not be mistaken for a typo, and our own
 * detector recognises it — but the carrier has never heard of it, so nothing
 * downstream offers it as a link to them.
 */
function resolveCarrierNumber(
  booking: BookingInput,
  tendered: TenderResult | null,
): { value: string; source: Shipment['carrierNumberSource'] } | null {
  if (tendered?.trackingNumber) return { value: tendered.trackingNumber, source: 'provider' };
  if (booking.carrierTrackingNumber) {
    return { value: booking.carrierTrackingNumber, source: 'operator' };
  }
  if (booking.carrierId === OWN_CARRIER_ID) return null;

  const generated = generateCarrierNumber(booking.carrierId);
  return generated ? { value: generated, source: 'generated' } : null;
}

/**
 * Create a shipment from a booking.
 *
 * The tracking number is random rather than sequential, and written with
 * `create()` so a collision fails instead of overwriting somebody else's
 * consignment. Eight digits makes a clash vanishingly unlikely, but "unlikely"
 * is not a guarantee when the failure mode is losing a shipment, so it retries.
 */
export async function createShipmentFromBooking(
  booking: BookingInput,
): Promise<{ shipment: Shipment; warning: string | null } | { error: string }> {
  const db = adminDb();
  if (!db) return { error: 'Firestore is not configured on this deployment.' };

  const takenByFixture = new Set(SEED_SHIPMENTS.map((s) => s.trackingNumber.toUpperCase()));

  // Tendered once, outside the retry loop: the retries are for tracking-number
  // collisions, and asking a carrier to create the same shipment five times
  // would leave four orphans on their system.
  const tendered = await tenderIfPossible(booking);
  const carrierNumber = resolveCarrierNumber(booking, tendered.result);

  const warning =
    tendered.attempted && !tendered.result
      ? `The shipment is saved, but ${carrierById(booking.carrierId)?.name ?? 'the carrier'} did not accept the tender. ${
          carrierNumber?.source === 'generated'
            ? 'A placeholder reference has been allocated — replace it with theirs once you have it.'
            : 'Add their tracking number by hand once you have it.'
        }`
      : null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const trackingNumber = candidateTrackingNumber();
    if (takenByFixture.has(trackingNumber)) continue;

    const shipment = shipmentFromBooking(
      trackingNumber,
      booking,
      carrierNumber,
      tendered.result?.labelUrl ?? null,
    );
    try {
      await db.collection(COLLECTION).doc(trackingNumber).create(shipment);
      return { shipment, warning };
    } catch (error) {
      // ALREADY_EXISTS is the only error worth retrying; anything else is a
      // real fault and should surface rather than burn four more attempts.
      const code = typeof error === 'object' && error && 'code' in error ? Number(error.code) : null;
      if (code !== 6) {
        console.error('[shipments] booking write failed:', error);
        return { error: 'Could not save the booking.' };
      }
    }
  }

  return { error: 'Could not allocate a tracking number. Please try again.' };
}
