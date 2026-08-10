'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { MediaAsset } from '@/lib/site';
import { cn } from '@/lib/utils';

interface FigureProps {
  media: MediaAsset;
  /** Sizing/cropping classes for the rendered image. */
  className?: string;
  sizes?: string;
  priority?: boolean;
}

/**
 * Renders a `MediaAsset` and degrades to its bundled illustration if the
 * photograph cannot be loaded, so pointing `src` at a file that is missing or
 * mistyped leaves the layout intact instead of showing a broken image.
 */
export function Figure({ media, className, sizes = '(min-width: 1024px) 50vw, 100vw', priority }: FigureProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const src = failed ? media.fallbackSrc : media.src;
  const alt = failed ? (media.fallbackAlt ?? media.alt) : media.alt;

  return (
    <Image
      key={src}
      src={src}
      alt={alt}
      width={1600}
      height={1200}
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : 'lazy'}
      onError={() => setFailed(true)}
      onLoad={() => setLoaded(true)}
      className={cn('transition-opacity duration-700 ease-premium', loaded ? 'opacity-100' : 'opacity-0', className)}
    />
  );
}
