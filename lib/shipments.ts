import 'server-only';

import { adminDb } from './firebase/admin';
import { SEED_SHIPMENTS } from './fixtures/shipments';
import { TRACKING_STAGES, type Shipment, type ShipmentStatus, type TrackingEvent, type TrackingStage } from './tracking';

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
    events: Array.isArray(data.events) ? data.events : [],
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

/**
 * Validate an edit. Returns the reason it was rejected rather than a bare null,
 * because "Origin is required" is a fixable message and "invalid" is not.
 */
export function validateShipmentPatch(input: unknown): { patch: ShipmentPatch } | { error: string } {
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

  return {
    patch: {
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
