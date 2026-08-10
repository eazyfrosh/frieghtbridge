'use client';

import Image from 'next/image';
import { useState } from 'react';
import { HERO_MEDIA } from '@/lib/site';
import { cn } from '@/lib/utils';

/**
 * The hero's photographic frame.
 *
 * `HERO_MEDIA.src` is expected to be a photograph — either a file in
 * `public/images/` or a remote URL whose host is allowed in
 * `next.config.mjs`. If it cannot be loaded (wrong path, dead URL, blocked
 * host) the frame falls back to the bundled illustration rather than showing
 * a broken hero, so swapping the photo can never take the page down.
 */
export function HeroPhoto() {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const usingFallback = failed;
  const src = usingFallback ? HERO_MEDIA.fallbackSrc : HERO_MEDIA.src;
  const alt = usingFallback ? HERO_MEDIA.fallbackAlt : HERO_MEDIA.alt;

  return (
    <div className="relative overflow-hidden rounded-4xl border border-white/10 bg-ink-900 shadow-[0_50px_120px_-40px_rgba(0,0,0,0.9)]">
      {/* Warm ground colour behind the photo so the fade-in has something to
          resolve from instead of a flash of empty dark. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(150deg,#1B2740_0%,#3A2318_55%,#0B1524_100%)]"
      />

      <Image
        key={src}
        src={src}
        alt={alt}
        width={1600}
        height={1200}
        priority
        sizes="(min-width: 1024px) 42vw, 100vw"
        onError={() => setFailed(true)}
        onLoad={() => setLoaded(true)}
        className={cn(
          'relative h-[320px] w-full object-cover transition-opacity duration-700 ease-premium sm:h-[440px] lg:h-[540px]',
          loaded ? 'opacity-100' : 'opacity-0',
        )}
      />

      {/* Scrim: keeps the floating shipment card legible over any photograph. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/75 via-ink-950/10 to-transparent"
      />
      {/* A breath of brand warmth so stock photography still reads as ours. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-brand-600/20 mix-blend-soft-light"
      />
    </div>
  );
}
