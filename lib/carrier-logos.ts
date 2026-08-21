import 'server-only';

import { readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Which carriers have a logo file on disk.
 *
 * Read from `public/carriers/` rather than listed in the registry, so adding a
 * logo is dropping a file in — no code change, and any format works.
 *
 * Discovery rather than a hardcoded path is what keeps the missing case clean:
 * a registry that claimed `/carriers/ups.svg` before anyone added it would put
 * a 404 in the console on every page load, for every carrier without a file.
 * Here a carrier with no logo simply gets its initials tile, silently.
 */

export type { CarrierLogos } from './carriers';

const EXTENSIONS = new Set(['.svg', '.png', '.webp', '.jpg', '.jpeg', '.avif']);

let cached: Record<string, string> | null = null;

/**
 * Map of carrier id to its public URL, for every logo present.
 *
 * Cached for the life of the process. The directory is part of the deployed
 * bundle and cannot change under a running server, so re-reading it on every
 * render would be a syscall per carrier chip for an answer that never moves.
 */
export function carrierLogos(): Record<string, string> {
  if (cached) return cached;

  const logos: Record<string, string> = {};

  try {
    for (const entry of readdirSync(join(process.cwd(), 'public', 'carriers'), {
      withFileTypes: true,
    })) {
      if (!entry.isFile()) continue;

      const dot = entry.name.lastIndexOf('.');
      if (dot <= 0) continue;

      const id = entry.name.slice(0, dot).toLowerCase();
      const extension = entry.name.slice(dot).toLowerCase();
      if (!EXTENSIONS.has(extension)) continue;

      // First match wins, so a stray `ups.png` alongside `ups.svg` does not
      // flip between deploys depending on directory order.
      logos[id] ??= `/carriers/${entry.name}`;
    }
  } catch {
    // No directory yet. Every carrier falls back to its initials.
  }

  cached = logos;
  return logos;
}
