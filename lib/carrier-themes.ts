/**
 * A carrier's colours, for the tracking page.
 *
 * The tracking result takes on the livery of whoever is carrying the freight —
 * FedEx purple and orange, UPS brown and gold — so a customer recognises their
 * shipment before reading a word of it. Everything derives from two hex values
 * per carrier; nothing else is hand-picked.
 *
 * Adapted from the same map in the operator's own multi-carrier platform, so
 * the two products agree on what each carrier looks like.
 */

export interface CarrierTheme {
  primary: string;
  secondary: string;
  /** Readable text on `primary`. Computed, never chosen by hand. */
  onPrimary: string;
  /** Readable text on `secondary`. */
  onSecondary: string;
}

interface ThemeInput {
  primary: string;
  secondary: string;
}

const THEME_INPUTS: Record<string, ThemeInput> = {
  ups: { primary: '#351C15', secondary: '#FFB500' },
  fedex: { primary: '#4D148C', secondary: '#FF6600' },
  usps: { primary: '#004B87', secondary: '#D2232A' },
  'dhl-express': { primary: '#D40511', secondary: '#FFCC00' },
  'dhl-ecommerce': { primary: '#D40511', secondary: '#FFCC00' },
  'royal-mail': { primary: '#CC0000', secondary: '#FFD100' },
  'canada-post': { primary: '#E31837', secondary: '#333333' },
  dpd: { primary: '#B0003A', secondary: '#555555' },
  gls: { primary: '#003B7A', secondary: '#FFD100' },
  tnt: { primary: '#FF6600', secondary: '#333333' },
  'usps-international': { primary: '#004B87', secondary: '#7A8794' },
};

/**
 * Our own brand, and the fallback for any carrier with no entry above.
 *
 * A shipment on our own network is not an absence of livery — it is ours, so
 * the header wears FreightBridge orange exactly as a FedEx one wears purple.
 */
const DEFAULT_THEME_INPUT: ThemeInput = { primary: '#FF6A00', secondary: '#9C3800' };

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Black or white, whichever is readable on this background.
 *
 * WCAG relative luminance, so adding a carrier needs only its two brand hexes
 * and legible text follows. The 0.55 threshold is deliberately above the
 * midpoint: DHL yellow and UPS gold are bright enough that white on them fails
 * badly, while a mid-blue is still comfortably white-on-dark.
 */
function contrastText(hex: string): string {
  const [r, g, b] = hexToRgb(hex).map((c) => c / 255);
  const linear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  return luminance > 0.55 ? '#0B0F1A' : '#FFFFFF';
}

function buildTheme(input: ThemeInput): CarrierTheme {
  return {
    primary: input.primary,
    secondary: input.secondary,
    onPrimary: contrastText(input.primary),
    onSecondary: contrastText(input.secondary),
  };
}

const THEMES: Record<string, CarrierTheme> = Object.fromEntries(
  Object.entries(THEME_INPUTS).map(([id, input]) => [id, buildTheme(input)]),
);

export const DEFAULT_CARRIER_THEME = buildTheme(DEFAULT_THEME_INPUT);

export function carrierTheme(carrierId: string | null | undefined): CarrierTheme {
  if (!carrierId) return DEFAULT_CARRIER_THEME;
  return THEMES[carrierId] ?? DEFAULT_CARRIER_THEME;
}
