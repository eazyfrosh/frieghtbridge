import type { Shipment } from '../tracking';

/**
 * Seed data. Deliberately empty.
 *
 * This held four demo consignments — the ones the tracking page used to
 * advertise. They are gone because the site is now running on real bookings,
 * and demo rows mixed in with real ones are worse than no rows: an operator
 * cannot tell at a glance which shipments exist, and a customer who guesses a
 * demo number gets a convincing shipment that nobody is carrying.
 *
 * Two things still read this array, and both behave correctly when it is
 * empty:
 *
 *  - `scripts/seed-firestore.mjs` writes nothing.
 *  - `lib/shipments.ts` falls back to it when Firebase is not configured, so a
 *    clone with no credentials shows an empty operations area rather than
 *    fabricated traffic. The shipments page says Firestore is unconfigured
 *    rather than leaving that to be guessed.
 *
 * To demo the site again, add shipments here in the shape below and run
 * `npm run seed`. `hoursAgo` is relative on purpose: fixtures have to look
 * plausible whenever the demo is opened, unlike a real scan, which has an
 * absolute `at`.
 *
 * ```ts
 * {
 *   trackingNumber: 'FBX-10000001',
 *   status: 'In Transit',
 *   service: 'LTL Freight — Standard',
 *   origin: 'Chicago, IL, United States',
 *   destination: 'Dallas, TX, United States',
 *   currentLocation: 'Springfield, MO, United States',
 *   etaInDays: 1,
 *   pieces: 6,
 *   weight: '1,240 lb / 562 kg',
 *   dimensions: '48 × 40 × 52 in',
 *   carrier: 'FreightBridge Linehaul 214',
 *   events: [
 *     {
 *       stage: 'Order Confirmed',
 *       title: 'Booking confirmed',
 *       location: 'Chicago, IL',
 *       hoursAgo: 52,
 *       description: 'Pickup scheduled with the origin terminal.',
 *     },
 *   ],
 * }
 * ```
 */
export const SEED_SHIPMENTS: Shipment[] = [];
