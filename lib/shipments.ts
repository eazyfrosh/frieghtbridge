import 'server-only';

import { adminDb } from './firebase/admin';
import { SEED_SHIPMENTS } from './fixtures/shipments';
import type { Shipment, ShipmentStatus } from './tracking';

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

export async function listShipments(): Promise<Shipment[]> {
  const db = adminDb();
  if (!db) {
    warnOnce();
    return SEED_SHIPMENTS;
  }

  const snapshot = await db.collection(COLLECTION).get();
  // An empty collection means "not seeded yet", not "no shipments" — falling
  // back keeps the ops views legible instead of showing a bare empty state.
  if (snapshot.empty) return SEED_SHIPMENTS;

  return snapshot.docs
    .map((doc) => toShipment(doc.data()))
    .filter((shipment): shipment is Shipment => shipment !== null);
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
