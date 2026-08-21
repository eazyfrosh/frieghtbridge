import 'server-only';

import { carrierById, carrierService } from './carriers';

/**
 * Tendering a booking to whichever carrier it was booked onto.
 *
 * Detection (`lib/carriers.ts`) answers "who is carrying this?" after the fact.
 * This is the other half: at booking time, hand the consignment to UPS, FedEx,
 * USPS, DHL or our own network, and get back the number the customer will
 * track with.
 *
 * **Two modes, and the site is useful in both.**
 *
 * - *Manual* (no `SHIPPING_API_KEY`): the operator books on the carrier's own
 *   platform and records their number here. That needs no credentials and is
 *   how most small freight brokers actually work — the shipment record still
 *   carries both numbers and the customer still gets one timeline.
 * - *Connected* (key set): we call a multi-carrier shipping API and the
 *   carrier's number and label come back automatically.
 *
 * Nothing here is required for the platform to function, which is deliberate.
 * A booking must never be lost because a carrier's API was down.
 */

export interface TenderRequest {
  carrierId: string;
  serviceCode: string;
  reference: string;
  from: { city: string; postalCode: string; country: string };
  to: { city: string; postalCode: string; country: string };
  parcel: { pieces: number; weight: string; dimensions: string };
  contact: { name: string; company: string; email: string; phone: string };
}

export interface TenderResult {
  trackingNumber: string;
  labelUrl: string | null;
}

export function shippingProviderConfigured(): boolean {
  return Boolean(process.env.SHIPPING_API_KEY?.trim());
}

/** Which of the two modes an operator is in, for the booking form to explain. */
export function fulfilmentMode(): 'connected' | 'manual' {
  return shippingProviderConfigured() ? 'connected' : 'manual';
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

/**
 * Ask the provider to create the shipment with the carrier.
 *
 * The request and response shapes below are neutral rather than any one
 * vendor's. Every aggregator names these fields differently — and the larger
 * ones need a rate to be selected before a label exists — so this function is
 * the adapter, and it is the only place that changes when you sign with one.
 *
 * Returns null on every failure. A carrier refusing a tender, or an aggregator
 * being down, must not lose the booking: the shipment is still created and the
 * operator is told to add the carrier's number by hand.
 */
export async function tenderShipment(request: TenderRequest): Promise<TenderResult | null> {
  const key = process.env.SHIPPING_API_KEY?.trim();
  if (!key) return null;

  const carrier = carrierById(request.carrierId);
  const service = carrierService(request.carrierId, request.serviceCode);
  if (!carrier || !service) return null;

  const endpoint = process.env.SHIPPING_API_URL?.trim() || 'https://api.easypost.com/v2/shipments';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        carrier: carrier.id,
        service: service.code,
        reference: request.reference,
        from_address: {
          city: request.from.city,
          zip: request.from.postalCode,
          country: request.from.country,
        },
        to_address: {
          name: request.contact.name,
          company: request.contact.company,
          email: request.contact.email,
          phone: request.contact.phone,
          city: request.to.city,
          zip: request.to.postalCode,
          country: request.to.country,
        },
        parcel: {
          pieces: request.parcel.pieces,
          weight: request.parcel.weight,
          dimensions: request.parcel.dimensions,
        },
      }),
      // A booking form that hangs is worse than one that asks for the number.
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error('[fulfilment] provider returned', response.status);
      return null;
    }

    const payload = (await response.json()) as Record<string, unknown>;
    const label = payload.postage_label as Record<string, unknown> | undefined;

    const trackingNumber = firstString(
      payload.tracking_code,
      payload.trackingNumber,
      payload.tracking_number,
    );
    if (!trackingNumber) {
      console.error('[fulfilment] provider returned no tracking number');
      return null;
    }

    return {
      trackingNumber,
      labelUrl: firstString(payload.label_url, payload.labelUrl, label?.label_url),
    };
  } catch (error) {
    console.error('[fulfilment] provider unreachable:', error);
    return null;
  }
}
