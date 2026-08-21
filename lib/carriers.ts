/**
 * Carrier detection from a tracking number.
 *
 * Every major carrier encodes its own format, and most embed a check digit, so
 * a number can usually be attributed without asking the customer which carrier
 * they used — which is the point. People paste what is on the label; being
 * made to pick "FedEx or UPS?" from a dropdown first is a question the site
 * can answer itself.
 *
 * **Checksums rank, they never reject.** A number whose pattern matches but
 * whose check digit fails is still offered, just below one that verifies. A
 * mistake in one of these algorithms should cost a carrier its top spot, not
 * cost a customer the ability to track a real parcel.
 */

/** What can be handed to a carrier. Shared by the booking form and the server. */
export const SHIPMENT_TYPES = ['Parcel', 'Pallet', 'LTL', 'FTL', 'Container'] as const;
export type ShipmentType = (typeof SHIPMENT_TYPES)[number];

/**
 * A product a carrier sells, as an operator would name it on a booking.
 *
 * `transitDays` is the carrier's published door-to-door time, counted from
 * collection — added to the days until pickup, so a booking made for next week
 * is not promised in three days.
 */
export interface CarrierService {
  code: string;
  name: string;
  transitDays: number;
}

export interface Carrier {
  id: string;
  name: string;
  /** Two or three letters for the chip when no logo is available. */
  initials: string;
  /** Where to send someone to see the carrier's own tracking page. */
  trackingUrl: (trackingNumber: string) => string;
  /** Formats this carrier issues. */
  patterns: RegExp[];
  /** Confirms a check digit when the format has one. */
  verify?: (trackingNumber: string) => boolean;
  /**
   * Services a shipment can be booked onto. Absent means detection-only: we
   * recognise the carrier's numbers but cannot tender freight to it — which is
   * true of "International post", a format rather than a company.
   */
  services?: CarrierService[];
  /** Freight this carrier will take. A parcel carrier does not move containers. */
  handles?: ShipmentType[];
}

export interface CarrierMatch {
  carrier: Carrier;
  /** True when a check digit confirmed it, not just the shape. */
  verified: boolean;
}

/** Uppercase, and strip the spaces and dashes people paste from labels. */
export function normalizeCarrierNumber(input: string): string {
  return input.toUpperCase().replace(/[\s-]/g, '');
}

// ---------------------------------------------------------------------------
// Check digits

/** UPS 1Z: letters score (code − 63) mod 10, odd positions ×1, even ×2. */
function upsCheck(value: string): boolean {
  const body = value.slice(2, 17);
  const check = value.slice(17, 18);
  if (body.length !== 15 || !/^\d$/.test(check)) return false;

  let sum = 0;
  for (let i = 0; i < body.length; i += 1) {
    const char = body[i];
    const digit = /\d/.test(char) ? Number(char) : (char.charCodeAt(0) - 63) % 10;
    sum += i % 2 === 0 ? digit : digit * 2;
  }

  return (Math.ceil(sum / 10) * 10 - sum) % 10 === Number(check);
}

/** USPS package barcodes: mod 10, weights 3 and 1 alternating from the right. */
function mod10Check(value: string): boolean {
  if (!/^\d+$/.test(value) || value.length < 2) return false;
  const digits = value.slice(0, -1).split('').map(Number).reverse();
  const check = Number(value.slice(-1));
  const sum = digits.reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

/** FedEx Express 12-digit: mod 11, weights 3-1-7 repeating from the right. */
function fedex12Check(value: string): boolean {
  if (!/^\d{12}$/.test(value)) return false;
  const weights = [3, 1, 7];
  const digits = value.slice(0, 11).split('').map(Number).reverse();
  const sum = digits.reduce((total, digit, index) => total + digit * weights[index % 3], 0);
  const expected = sum % 11 % 10;
  return expected === Number(value.slice(-1));
}

/** UPU S10, used by most postal operators: weights 8,6,4,2,3,5,9,7 over 8 digits. */
function s10Check(value: string): boolean {
  const match = /^[A-Z]{2}(\d{9})[A-Z]{2}$/.exec(value);
  if (!match) return false;

  const digits = match[1];
  const weights = [8, 6, 4, 2, 3, 5, 9, 7];
  const sum = weights.reduce((total, weight, index) => total + Number(digits[index]) * weight, 0);

  let check = 11 - (sum % 11);
  if (check === 10) check = 0;
  if (check === 11) check = 5;

  return check === Number(digits[8]);
}

// ---------------------------------------------------------------------------
// Registry

export const CARRIERS: Carrier[] = [
  {
    id: 'freightbridge',
    name: 'FreightBridge Logistics',
    initials: 'FB',
    trackingUrl: (n) => `/tracking?number=${encodeURIComponent(n)}`,
    patterns: [/^FBX\d{6,10}$/],
    // Our own network is the only one that takes everything up to a container.
    handles: [...SHIPMENT_TYPES],
    services: [
      { code: 'fb-economy', name: 'Economy', transitDays: 7 },
      { code: 'fb-standard', name: 'Standard', transitDays: 4 },
      { code: 'fb-expedited', name: 'Expedited', transitDays: 2 },
      { code: 'fb-same-day', name: 'Same Day', transitDays: 0 },
    ],
  },
  {
    id: 'ups',
    name: 'UPS',
    initials: 'UPS',
    trackingUrl: (n) => `https://www.ups.com/track?tracknum=${encodeURIComponent(n)}`,
    patterns: [/^1Z[0-9A-Z]{16}$/, /^T\d{10}$/, /^\d{9}$/, /^\d{26}$/],
    verify: (n) => (n.startsWith('1Z') ? upsCheck(n) : false),
    handles: ['Parcel', 'Pallet', 'LTL'],
    services: [
      { code: 'ups-ground', name: 'UPS Ground', transitDays: 5 },
      { code: 'ups-3-day-select', name: 'UPS 3 Day Select', transitDays: 3 },
      { code: 'ups-2nd-day-air', name: 'UPS 2nd Day Air', transitDays: 2 },
      { code: 'ups-next-day-air', name: 'UPS Next Day Air', transitDays: 1 },
      { code: 'ups-worldwide-expedited', name: 'UPS Worldwide Expedited', transitDays: 4 },
    ],
  },
  {
    id: 'fedex',
    name: 'FedEx',
    initials: 'FDX',
    trackingUrl: (n) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`,
    // 12-digit Express, 15-digit Ground, 20-digit SmartPost, 22-digit.
    patterns: [/^\d{12}$/, /^\d{15}$/, /^\d{20}$/, /^\d{22}$/, /^96\d{20}$/],
    verify: (n) => (n.length === 12 ? fedex12Check(n) : false),
    handles: ['Parcel', 'Pallet', 'LTL'],
    services: [
      { code: 'fedex-ground', name: 'FedEx Ground', transitDays: 5 },
      { code: 'fedex-express-saver', name: 'FedEx Express Saver', transitDays: 3 },
      { code: 'fedex-2day', name: 'FedEx 2Day', transitDays: 2 },
      { code: 'fedex-priority-overnight', name: 'FedEx Priority Overnight', transitDays: 1 },
      { code: 'fedex-international-priority', name: 'FedEx International Priority', transitDays: 3 },
    ],
  },
  {
    id: 'usps',
    name: 'USPS',
    initials: 'USPS',
    trackingUrl: (n) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(n)}`,
    patterns: [/^(94|93|92|95)\d{18,24}$/, /^\d{20}$/, /^\d{26}$/, /^[A-Z]{2}\d{9}US$/],
    verify: (n) => (/^\d{20,26}$/.test(n) ? mod10Check(n) : /^[A-Z]{2}\d{9}US$/.test(n) ? s10Check(n) : false),
    handles: ['Parcel'],
    services: [
      { code: 'usps-ground-advantage', name: 'USPS Ground Advantage', transitDays: 4 },
      { code: 'usps-priority-mail', name: 'USPS Priority Mail', transitDays: 2 },
      { code: 'usps-priority-express', name: 'USPS Priority Mail Express', transitDays: 1 },
    ],
  },
  {
    id: 'dhl-express',
    name: 'DHL Express',
    initials: 'DHL',
    trackingUrl: (n) => `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(n)}`,
    // Air waybills are 10 digits; some services prefix a 3-digit account.
    patterns: [/^\d{10}$/, /^\d{11}$/, /^JD\d{16,18}$/],
    handles: ['Parcel', 'Pallet'],
    services: [
      { code: 'dhl-economy-select', name: 'DHL Economy Select', transitDays: 5 },
      { code: 'dhl-express-worldwide', name: 'DHL Express Worldwide', transitDays: 3 },
      { code: 'dhl-express-1200', name: 'DHL Express 12:00', transitDays: 2 },
    ],
  },
  {
    id: 'dhl-ecommerce',
    name: 'DHL eCommerce',
    initials: 'DHL',
    trackingUrl: (n) => `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(n)}`,
    patterns: [/^(JJD|JVGL|GM)[0-9A-Z]{10,22}$/],
  },
  {
    id: 'royal-mail',
    name: 'Royal Mail',
    initials: 'RM',
    trackingUrl: (n) => `https://www.royalmail.com/track-your-item#/tracking-results/${encodeURIComponent(n)}`,
    patterns: [/^[A-Z]{2}\d{9}GB$/],
    verify: s10Check,
    handles: ['Parcel'],
    services: [
      { code: 'rm-tracked-48', name: 'Royal Mail Tracked 48', transitDays: 2 },
      { code: 'rm-tracked-24', name: 'Royal Mail Tracked 24', transitDays: 1 },
    ],
  },
  {
    id: 'canada-post',
    name: 'Canada Post',
    initials: 'CP',
    trackingUrl: (n) => `https://www.canadapost-postescanada.ca/track-reperage/en#/resultList?searchFor=${encodeURIComponent(n)}`,
    patterns: [/^\d{16}$/, /^[A-Z]{2}\d{9}CA$/],
    verify: (n) => (/^[A-Z]{2}\d{9}CA$/.test(n) ? s10Check(n) : false),
    handles: ['Parcel'],
    services: [
      { code: 'cp-regular-parcel', name: 'Canada Post Regular Parcel', transitDays: 5 },
      { code: 'cp-expedited-parcel', name: 'Canada Post Expedited Parcel', transitDays: 3 },
      { code: 'cp-xpresspost', name: 'Canada Post Xpresspost', transitDays: 2 },
    ],
  },
  {
    id: 'dpd',
    name: 'DPD',
    initials: 'DPD',
    trackingUrl: (n) => `https://www.dpd.co.uk/service/tracking?parcel=${encodeURIComponent(n)}`,
    patterns: [/^\d{14}$/, /^\d{28}$/],
    handles: ['Parcel', 'Pallet'],
    services: [
      { code: 'dpd-classic', name: 'DPD Classic', transitDays: 3 },
      { code: 'dpd-next-day', name: 'DPD Next Day', transitDays: 1 },
    ],
  },
  {
    id: 'gls',
    name: 'GLS',
    initials: 'GLS',
    trackingUrl: (n) => `https://gls-group.eu/EU/en/parcel-tracking?match=${encodeURIComponent(n)}`,
    patterns: [/^\d{11}$/, /^\d{12}$/],
    handles: ['Parcel', 'Pallet'],
    services: [
      { code: 'gls-business-parcel', name: 'GLS Business Parcel', transitDays: 3 },
      { code: 'gls-express', name: 'GLS Express', transitDays: 1 },
    ],
  },
  {
    id: 'tnt',
    name: 'TNT',
    initials: 'TNT',
    trackingUrl: (n) => `https://www.tnt.com/express/en_gb/site/shipping-tools/tracking.html?searchType=con&cons=${encodeURIComponent(n)}`,
    patterns: [/^\d{9}$/, /^[A-Z]{2}\d{9}[A-Z]{2}$/],
    handles: ['Parcel', 'Pallet', 'LTL'],
    services: [
      { code: 'tnt-economy-express', name: 'TNT Economy Express', transitDays: 4 },
      { code: 'tnt-express', name: 'TNT Express', transitDays: 2 },
    ],
  },
  {
    id: 'usps-international',
    name: 'International post',
    initials: 'S10',
    // The final two letters are the origin country; every S10 operator honours
    // this lookup, so it is the right destination for a number we can place as
    // postal but cannot attribute to a specific operator.
    trackingUrl: (n) => `https://parcelsapp.com/en/tracking/${encodeURIComponent(n)}`,
    patterns: [/^[A-Z]{2}\d{9}[A-Z]{2}$/],
    verify: s10Check,
  },
];

const BY_ID = new Map(CARRIERS.map((carrier) => [carrier.id, carrier]));

export function carrierById(id: string): Carrier | null {
  return BY_ID.get(id) ?? null;
}

/**
 * Which carriers could have issued this number, best guess first.
 *
 * Ordering: a confirmed check digit beats an unconfirmed one, and among equals
 * the more specific pattern wins — `94…` is unmistakably USPS, while "twenty
 * digits" is shared by three carriers and says much less.
 */
export function detectCarriers(rawInput: string): CarrierMatch[] {
  const value = normalizeCarrierNumber(rawInput);
  if (!value) return [];

  const matches: Array<CarrierMatch & { specificity: number }> = [];

  for (const carrier of CARRIERS) {
    let best: { specificity: number } | null = null;

    for (const pattern of carrier.patterns) {
      if (!pattern.test(value)) continue;
      // A pattern with literal characters in it narrows far more than one made
      // only of digit counts, so score by how much of it is not `\d`.
      const literals = pattern.source.replace(/\\d|\[[^\]]*\]|[\^$(){}?*+|]/g, '').length;
      if (!best || literals > best.specificity) best = { specificity: literals };
    }

    if (!best) continue;
    matches.push({
      carrier,
      verified: carrier.verify ? carrier.verify(value) : false,
      specificity: best.specificity,
    });
  }

  return matches
    .sort((a, b) => {
      if (a.verified !== b.verified) return a.verified ? -1 : 1;
      return b.specificity - a.specificity;
    })
    .map(({ carrier, verified }) => ({ carrier, verified }));
}

/** The single best guess, or null when nothing recognises the format. */
export function detectCarrier(rawInput: string): CarrierMatch | null {
  return detectCarriers(rawInput)[0] ?? null;
}

export function isFreightBridgeNumber(rawInput: string): boolean {
  return /^FBX\d{6,10}$/.test(normalizeCarrierNumber(rawInput));
}

// ---------------------------------------------------------------------------
// Booking
//
// Detection answers "who is carrying this?" after the fact. The other half of a
// multi-carrier platform is choosing, at booking time, who is going to.

export const OWN_CARRIER_ID = 'freightbridge';

/** Carriers a shipment can actually be tendered to, our own network first. */
export const BOOKABLE_CARRIERS: Carrier[] = CARRIERS.filter(
  (carrier) => carrier.services && carrier.services.length > 0,
);

/**
 * Who can take this freight.
 *
 * Filtering by shipment type is the point: offering USPS for a 40ft container
 * is an invitation to book something that will be refused at the dock. With no
 * type given, everything bookable is returned.
 */
export function carriersFor(shipmentType?: string): Carrier[] {
  if (!shipmentType) return BOOKABLE_CARRIERS;
  return BOOKABLE_CARRIERS.filter((carrier) => carrier.handles?.includes(shipmentType as ShipmentType));
}

export function carrierService(carrierId: string, serviceCode: string): CarrierService | null {
  return carrierById(carrierId)?.services?.find((service) => service.code === serviceCode) ?? null;
}

/**
 * Whether a number looks like something this carrier issues.
 *
 * Used to warn an operator who has pasted a UPS number under FedEx — a warning
 * and not a rejection, for the same reason check digits only rank: our registry
 * does not know every format a carrier has ever printed, and refusing a real
 * number because of a gap in it is the worse outcome.
 */
export function matchesCarrierFormat(carrierId: string, trackingNumber: string): boolean {
  const carrier = carrierById(carrierId);
  if (!carrier) return false;
  const value = normalizeCarrierNumber(trackingNumber);
  return carrier.patterns.some((pattern) => pattern.test(value));
}
