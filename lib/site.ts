import type { LucideIcon } from 'lucide-react';
import {
  Boxes,
  Clock4,
  Gauge,
  Globe2,
  Headphones,
  LifeBuoy,
  MapPin,
  Network,
  PackageSearch,
  Route,
  ShieldCheck,
  Ship,
  Truck,
  Warehouse,
} from 'lucide-react';

export const SITE = {
  name: 'FreightBridge',
  tagline: 'Move Freight. Build Connections.',
  description:
    'FreightBridge provides reliable freight transportation, logistics, delivery, warehousing, and supply chain solutions for modern businesses.',
  url: 'https://freightbridge.example.com',
  email: 'hello@freightbridge.com',
  phone: '+1 (312) 555-0142',
  address: '210 Harbor Point Drive, Suite 900, Chicago, IL 60601',
} as const;

/**
 * Hero photography.
 *
 * To use your own shot, drop it in `public/images/` and point `src` at it —
 * e.g. `/images/hero-freight.jpg`. No other change is needed. For a hosted
 * image, add the host to `images.remotePatterns` in `next.config.mjs` first.
 *
 * The default below is a stock placeholder. If it fails to load, the hero
 * renders `fallbackSrc` instead of breaking.
 *
 * Aim for a landscape shot around 1600×1200 or wider. The frame crops to
 * `object-cover`, and a scrim sits over the lower third — keep the subject
 * out of the bottom-left corner, where the shipment card overlaps.
 */
export const HERO_MEDIA = {
  /**
   * Set `video.src` to show a looping background clip instead of the still.
   * Drop an MP4 in `public/video/` and reference it as `/video/<name>.mp4`.
   * Leave it empty to use the still image below.
   *
   * Keep it short (6–10s), silent, and compressed — under ~3 MB. It is
   * muted and `playsInline` so mobile browsers will autoplay it, it is
   * suppressed entirely under `prefers-reduced-motion`, and it carries a
   * pause control.
   */
  video: {
    src: '/video/hero-freight.mp4',
    webm: '/video/hero-freight.webm',
    poster: '/images/hero-freight.svg',
    description: 'Freight moving through a FreightBridge distribution network',
  },

  /** Still image — the poster for the video, and the hero when there is none. */
  src: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=75',
  alt: 'A freight truck on the highway at dusk, hauling goods for a FreightBridge customer',
  fallbackSrc: '/images/hero-freight.svg',
  fallbackAlt:
    'Illustration of a FreightBridge semi-truck travelling a highway at dusk past a container yard and gantry cranes',
} as const;

/**
 * A swappable image. `src` is what renders; `fallbackSrc` is the bundled
 * illustration used if that file cannot be loaded.
 */
export interface MediaAsset {
  src: string;
  alt: string;
  fallbackSrc: string;
  fallbackAlt?: string;
}

/**
 * Section imagery.
 *
 * Every entry ships pointing at its bundled illustration. To use photographs,
 * drop the files in `public/images/` and change `src` — one line per image,
 * nothing else. Alt text lives here too, so update it to describe your photo.
 * If a `src` is missing or mistyped the illustration renders instead, so a
 * typo degrades rather than breaking the page.
 *
 * Landscape, 1600px wide or more. Each is cropped with `object-cover`.
 */
export const IMAGERY: Record<'road' | 'port' | 'warehouse', MediaAsset> = {
  road: {
    src: '/images/hero-freight.svg',
    alt: 'A FreightBridge truck on the highway at dusk beside a container yard',
    fallbackSrc: '/images/hero-freight.svg',
  },
  port: {
    src: '/images/port-terminal.svg',
    alt: 'Gantry cranes loading containers onto a cargo ship at a FreightBridge port terminal',
    fallbackSrc: '/images/port-terminal.svg',
  },
  warehouse: {
    src: '/images/warehouse-ops.svg',
    alt: 'Inside a FreightBridge fulfillment warehouse with pallet racking, a forklift and loading bays',
    fallbackSrc: '/images/warehouse-ops.svg',
  },
};

export interface NavLink {
  label: string;
  href: string;
  description?: string;
  icon?: LucideIcon;
}

export interface NavItem {
  label: string;
  href: string;
  /** Present for items that open a dropdown panel on desktop. */
  children?: NavLink[];
  featured?: { title: string; body: string; href: string; cta: string };
}

export const SERVICES: Array<{
  slug: string;
  title: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  highlights: string[];
}> = [
  {
    slug: 'freight-transportation',
    title: 'Freight Transportation',
    tagline: 'Reliable transportation for full and partial loads.',
    description:
      'FTL and LTL capacity across a vetted carrier network, with lane pricing that holds and dispatch that answers.',
    icon: Truck,
    highlights: ['FTL & LTL capacity', 'Dedicated lanes', 'Temperature-controlled options'],
  },
  {
    slug: 'last-mile-delivery',
    title: 'Last-Mile Delivery',
    tagline: 'Fast and dependable delivery to your customers.',
    description:
      'Metro delivery routes with live driver tracking, recipient notifications, and proof of delivery in every scan.',
    icon: MapPin,
    highlights: ['Live driver ETAs', 'Recipient notifications', 'Photo & signature POD'],
  },
  {
    slug: 'warehousing',
    title: 'Warehousing',
    tagline: 'Flexible storage and fulfillment solutions.',
    description:
      'Short-term overflow or long-term fulfillment, with real-time inventory counts synced to your systems.',
    icon: Warehouse,
    highlights: ['Pick, pack & fulfillment', 'Cross-docking', 'Real-time inventory'],
  },
  {
    slug: 'freight-forwarding',
    title: 'Freight Forwarding',
    tagline: 'Simplified movement of goods across borders.',
    description:
      'Air and ocean forwarding with customs documentation handled up front so shipments do not sit at the border.',
    icon: Ship,
    highlights: ['Air & ocean FCL/LCL', 'Customs documentation', 'Duty & tariff guidance'],
  },
  {
    slug: 'supply-chain',
    title: 'Supply Chain Solutions',
    tagline: 'Technology-driven logistics management.',
    description:
      'Network design, carrier management, and reporting that turns freight spend into decisions you can defend.',
    icon: Network,
    highlights: ['Network design', 'Carrier management', 'Spend analytics'],
  },
  {
    slug: 'same-day-delivery',
    title: 'Same-Day Delivery',
    tagline: 'Time-sensitive delivery when every hour matters.',
    description:
      'Two-hour pickup windows and direct point-to-point runs for the shipments that cannot wait until tomorrow.',
    icon: Clock4,
    highlights: ['2-hour pickup windows', 'Direct point-to-point', 'Live exception alerts'],
  },
];

export const SOLUTIONS: NavLink[] = [
  {
    label: 'Retail & E-commerce',
    href: '/services#solutions',
    description: 'Fulfillment and last-mile built for order volume that spikes.',
    icon: Boxes,
  },
  {
    label: 'Manufacturing',
    href: '/services#solutions',
    description: 'Inbound materials and outbound freight on dependable lanes.',
    icon: Warehouse,
  },
  {
    label: 'Cross-Border Trade',
    href: '/services#solutions',
    description: 'Forwarding and customs support across seven regions.',
    icon: Globe2,
  },
  {
    label: 'Enterprise Logistics',
    href: '/about#enterprise',
    description: 'Managed transportation for multi-site operations.',
    icon: ShieldCheck,
  },
];

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Solutions',
    href: '/services#solutions',
    children: SOLUTIONS,
    featured: {
      title: 'Not sure where to start?',
      body: 'Tell us what you move and we will map the lanes, modes, and costs in one working session.',
      href: '/quote',
      cta: 'Get a quote',
    },
  },
  {
    label: 'Services',
    href: '/services',
    children: SERVICES.map((service) => ({
      label: service.title,
      href: `/services#${service.slug}`,
      description: service.tagline,
      icon: service.icon,
    })),
  },
  { label: 'Tracking', href: '/tracking' },
  {
    label: 'Resources',
    href: '/tracking',
    children: [
      {
        label: 'Track a shipment',
        href: '/tracking',
        description: 'Live status, timeline, and delivery estimates.',
        icon: PackageSearch,
      },
      {
        label: 'Shipping guide',
        href: '/resources/shipping-guide',
        description: 'Packaging, classes, and paperwork explained.',
        icon: Route,
      },
      {
        label: 'FAQ',
        href: '/resources/faq',
        description: 'Answers to the questions shippers ask most.',
        icon: LifeBuoy,
      },
      {
        label: 'Support',
        href: '/contact',
        description: 'Reach a logistics specialist any time.',
        icon: Headphones,
      },
    ],
  },
  {
    label: 'Company',
    href: '/about',
    children: [
      { label: 'About', href: '/about', description: 'Why we built FreightBridge.', icon: Globe2 },
      { label: 'Careers', href: '/about#careers', description: 'Open roles across our network.', icon: Gauge },
      { label: 'Contact', href: '/contact', description: 'Talk to sales, support, or dispatch.', icon: Headphones },
      { label: 'Partners', href: '/about#partners', description: 'Carriers and technology partners.', icon: Network },
    ],
  },
];

export const FOOTER_COLUMNS: Array<{ title: string; links: NavLink[] }> = [
  {
    title: 'Solutions',
    links: [
      { label: 'Freight Transportation', href: '/services#freight-transportation' },
      { label: 'Last-Mile Delivery', href: '/services#last-mile-delivery' },
      { label: 'Warehousing', href: '/services#warehousing' },
      { label: 'Freight Forwarding', href: '/services#freight-forwarding' },
      { label: 'Supply Chain', href: '/services#supply-chain' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Careers', href: '/about#careers' },
      { label: 'Contact', href: '/contact' },
      { label: 'Partners', href: '/about#partners' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Tracking', href: '/tracking' },
      { label: 'Shipping Guide', href: '/resources/shipping-guide' },
      { label: 'FAQ', href: '/resources/faq' },
      { label: 'Support', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/legal/privacy' },
      { label: 'Terms', href: '/legal/terms' },
      { label: 'Cookie Policy', href: '/legal/cookies' },
    ],
  },
];

/**
 * Coverage-map nodes. `x`/`y` are positions inside the map's 860 × 420 viewBox —
 * a stylised arrangement of our regions, not a geographic projection.
 */
export const REGIONS = [
  { name: 'United States', code: 'US', hubs: 18, x: 152, y: 196, anchor: 'below' },
  { name: 'Canada', code: 'CA', hubs: 6, x: 188, y: 106, anchor: 'above' },
  { name: 'United Kingdom', code: 'UK', hubs: 5, x: 432, y: 124, anchor: 'above' },
  { name: 'Europe', code: 'EU', hubs: 12, x: 508, y: 168, anchor: 'right' },
  { name: 'UAE', code: 'AE', hubs: 4, x: 646, y: 244, anchor: 'right' },
  { name: 'Nigeria', code: 'NG', hubs: 5, x: 470, y: 298, anchor: 'right' },
  { name: 'Ghana', code: 'GH', hubs: 3, x: 408, y: 322, anchor: 'below' },
] as const;

export type Region = (typeof REGIONS)[number];

/** Region-to-region lanes drawn as animated arcs on the coverage map. */
export const LANES: Array<[string, string]> = [
  ['US', 'UK'],
  ['US', 'CA'],
  ['UK', 'EU'],
  ['EU', 'AE'],
  ['UK', 'NG'],
  ['NG', 'GH'],
  ['AE', 'NG'],
  ['US', 'EU'],
];
