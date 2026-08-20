import 'server-only';

import { CARRIERS, detectCarriers, normalizeCarrierNumber, type Carrier } from './carriers';
import { findShipment } from './shipments';
import { normalizeTrackingNumber, resolveShipment, type TrackingResult } from './tracking';

/**
 * Tracking for numbers we did not issue.
 *
 * Three outcomes, and being clear about which one you got is most of the
 * value:
 *
 *  - `internal` — one of ours, resolved from Firestore with a full timeline.
 *  - `carrier` — recognised as FedEx, UPS, USPS, DHL and so on. If a tracking
 *    provider is configured we return its events; otherwise we return the
 *    carrier and a deep link, which is honest about what we know.
 *  - `unknown` — the format matches nothing we recognise.
 *
 * The deep-link path needs no credentials and works the moment it deploys.
 * Real cross-carrier events need an aggregator key; the alternative is
 * registering separately with every carrier, each with its own OAuth dance and
 * its own approval process, which is a project rather than a feature.
 */

export interface CarrierEvent {
  status: string;
  location: string;
  timestamp: string;
  description: string;
}

export interface CarrierSummary {
  id: string;
  name: string;
  initials: string;
  trackingUrl: string;
  /** Whether a check digit confirmed the carrier, rather than just the shape. */
  verified: boolean;
}

export type TrackingLookup =
  | { kind: 'internal'; number: string; shipment: TrackingResult }
  | {
      kind: 'carrier';
      number: string;
      carrier: CarrierSummary;
      /** Other carriers whose formats also fit, best first. */
      alternatives: CarrierSummary[];
      /** Present only when a tracking provider is configured and answered. */
      events: CarrierEvent[] | null;
      status: string | null;
      /** Why there are no events, when there are none. */
      note: string | null;
    }
  | { kind: 'unknown'; number: string };

function summarise(carrier: Carrier, number: string, verified: boolean): CarrierSummary {
  return {
    id: carrier.id,
    name: carrier.name,
    initials: carrier.initials,
    trackingUrl: carrier.trackingUrl(number),
    verified,
  };
}

/** Everything the site can track, for the "supported carriers" list. */
export function supportedCarriers(): Array<{ id: string; name: string; initials: string }> {
  return CARRIERS.filter((c) => c.id !== 'freightbridge').map(({ id, name, initials }) => ({
    id,
    name,
    initials,
  }));
}

// ---------------------------------------------------------------------------
// Optional provider

export function trackingProviderConfigured(): boolean {
  return Boolean(process.env.TRACKING_API_KEY?.trim());
}

/**
 * Ask an aggregator for real events.
 *
 * Modelled on Ship24's tracker API, which is the simplest of the aggregators
 * to talk to: one POST, one bearer token, one normalised response covering
 * every carrier it supports. Swapping vendors means rewriting this function.
 *
 * Returns null rather than throwing. A provider outage must degrade to the
 * carrier deep link, not take the tracking page down — the customer can still
 * get their answer, just one click further away.
 */
async function fetchProviderEvents(
  number: string,
): Promise<{ events: CarrierEvent[]; status: string | null } | null> {
  const key = process.env.TRACKING_API_KEY?.trim();
  if (!key) return null;

  const endpoint = process.env.TRACKING_API_URL?.trim() || 'https://api.ship24.com/public/v1/trackers/track';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackingNumber: number }),
      // A tracking page that hangs is worse than one that offers a deep link.
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      console.error('[tracking] provider returned', response.status);
      return null;
    }

    const payload = (await response.json()) as {
      data?: { trackings?: Array<{ events?: unknown[]; shipment?: { statusMilestone?: string } }> };
    };

    const tracking = payload.data?.trackings?.[0];
    if (!tracking) return null;

    const events = (Array.isArray(tracking.events) ? tracking.events : [])
      .map((raw) => {
        const event = raw as Record<string, unknown>;
        return {
          status: typeof event.status === 'string' ? event.status : '',
          location: typeof event.location === 'string' ? event.location : '',
          timestamp: typeof event.occurrenceDatetime === 'string' ? event.occurrenceDatetime : '',
          description: typeof event.statusMilestone === 'string' ? event.statusMilestone : '',
        } satisfies CarrierEvent;
      })
      .filter((event) => event.timestamp)
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));

    return { events, status: tracking.shipment?.statusMilestone ?? null };
  } catch (error) {
    console.error('[tracking] provider unreachable:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------

/**
 * Track anything: one of ours, or somebody else's.
 *
 * Our own numbers are checked first and never go to a provider — we hold that
 * data, and paying an aggregator to tell us about our own shipments would be
 * both slower and wrong.
 */
export async function trackAnyNumber(rawInput: string): Promise<TrackingLookup> {
  const cleaned = normalizeCarrierNumber(rawInput);
  if (!cleaned) return { kind: 'unknown', number: cleaned };

  const matches = detectCarriers(cleaned);
  const internal = matches.find((m) => m.carrier.id === 'freightbridge');

  if (internal) {
    const shipment = await findShipment(normalizeTrackingNumber(cleaned));
    if (shipment) {
      return {
        kind: 'internal',
        number: shipment.trackingNumber,
        shipment: resolveShipment(shipment),
      };
    }
    // Shaped like ours but not on our books. Saying "not found" is the honest
    // answer; handing it to a carrier that never issued it is not.
    return { kind: 'unknown', number: cleaned };
  }

  const [best, ...rest] = matches;
  if (!best) return { kind: 'unknown', number: cleaned };

  const provider = await fetchProviderEvents(cleaned);

  return {
    kind: 'carrier',
    number: cleaned,
    carrier: summarise(best.carrier, cleaned, best.verified),
    alternatives: rest.map((m) => summarise(m.carrier, cleaned, m.verified)),
    events: provider?.events.length ? provider.events : null,
    status: provider?.status ?? null,
    note: provider
      ? provider.events.length
        ? null
        : 'The carrier has not reported any scans for this number yet.'
      : trackingProviderConfigured()
        ? 'Live events are temporarily unavailable — the carrier’s own page has the latest.'
        : null,
  };
}
