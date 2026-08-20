import type { Shipment, ShipmentStatus } from './tracking';

/**
 * Presentation helpers for the operations views.
 *
 * Reads live in `lib/shipments.ts` (Firestore); this file only shapes what has
 * already been fetched, so it stays free of `server-only` and can be imported
 * from anywhere.
 */

export interface AdminStats {
  total: number;
  inTransit: number;
  delivered: number;
  exceptions: number;
  onTimeRate: number;
}

export function shipmentStats(shipments: Shipment[]): AdminStats {
  const counts = shipments.reduce(
    (acc, shipment) => {
      if (shipment.status === 'Delivered') acc.delivered += 1;
      else if (shipment.status === 'Exception') acc.exceptions += 1;
      else acc.inTransit += 1;
      return acc;
    },
    { delivered: 0, exceptions: 0, inTransit: 0 },
  );

  const total = shipments.length;
  // Guard the divide: an empty fixture set would otherwise render NaN%.
  const onTimeRate = total === 0 ? 0 : Math.round(((total - counts.exceptions) / total) * 100);

  return { total, ...counts, onTimeRate };
}

/** Tailwind classes per status, shared by the table and the detail header. */
export function adminStatusTone(status: ShipmentStatus): string {
  switch (status) {
    case 'Delivered':
      return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-600/20';
    case 'Exception':
      return 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-rose-600/20';
    case 'Out for Delivery':
      return 'bg-brand-800 text-white ring-brand-900/30';
    default:
      return 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 ring-brand-600/20';
  }
}

export const SHIPMENT_FILTERS = ['All', 'Active', 'Delivered', 'Exception'] as const;
export type ShipmentFilter = (typeof SHIPMENT_FILTERS)[number];

export function filterShipments(shipments: Shipment[], filter: ShipmentFilter): Shipment[] {
  switch (filter) {
    case 'Active':
      return shipments.filter((s) => s.status !== 'Delivered' && s.status !== 'Exception');
    case 'Delivered':
      return shipments.filter((s) => s.status === 'Delivered');
    case 'Exception':
      return shipments.filter((s) => s.status === 'Exception');
    default:
      return shipments;
  }
}
