'use client';

import { useReducedMotion } from 'framer-motion';
import { Pause, Play } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { HERO_MEDIA } from '@/lib/site';
import { cn } from '@/lib/utils';

/**
 * The hero's media frame. Renders, in order of preference:
 *
 *   1. `HERO_MEDIA.video.src` — an autoplaying, muted, looping background clip
 *   2. `HERO_MEDIA.src`       — a still photograph
 *   3. `HERO_MEDIA.fallbackSrc` — the bundled illustration
 *
 * Each step degrades to the next if the asset is missing or fails to load, so
 * swapping media can never leave a broken hero.
 *
 * The video is suppressed entirely under `prefers-reduced-motion` (the poster
 * shows instead), and when it does play it carries a pause control — WCAG
 * 2.2.2 requires a way to stop motion that auto-starts and runs past five
 * seconds.
 */
export function HeroMedia() {
  const reduced = useReducedMotion();
  const [videoFailed, setVideoFailed] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [playing, setPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoSrc = HERO_MEDIA.video?.src;
  const showVideo = Boolean(videoSrc) && !videoFailed && !reduced;

  const photoSrc = photoFailed ? HERO_MEDIA.fallbackSrc : HERO_MEDIA.src;
  const photoAlt = photoFailed ? HERO_MEDIA.fallbackAlt : HERO_MEDIA.alt;

  function togglePlayback() {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-4xl border border-white/10 bg-ink-900 shadow-[0_50px_120px_-40px_rgba(0,0,0,0.9)]">
      {/* Ground colour so the fade-in resolves from something warm. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(150deg,#1B2740_0%,#3A2318_55%,#0B1524_100%)]"
      />

      {showVideo ? (
        <video
          ref={videoRef}
          // Muted + playsInline are what make autoplay legal on mobile Safari
          // and Chrome; without both, the clip silently never starts.
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={HERO_MEDIA.video?.poster}
          aria-label={HERO_MEDIA.video?.description}
          onCanPlay={() => setLoaded(true)}
          onError={() => setVideoFailed(true)}
          className={cn(
            'relative h-[320px] w-full object-cover transition-opacity duration-700 ease-premium sm:h-[440px] lg:h-[540px]',
            loaded ? 'opacity-100' : 'opacity-0',
          )}
        >
          {HERO_MEDIA.video?.webm && <source src={HERO_MEDIA.video.webm} type="video/webm" />}
          {videoSrc && <source src={videoSrc} type="video/mp4" />}
        </video>
      ) : (
        <Image
          key={photoSrc}
          src={photoSrc}
          alt={photoAlt}
          width={1600}
          height={1200}
          priority
          sizes="(min-width: 1024px) 42vw, 100vw"
          onError={() => setPhotoFailed(true)}
          onLoad={() => setLoaded(true)}
          className={cn(
            'relative h-[320px] w-full object-cover transition-opacity duration-700 ease-premium sm:h-[440px] lg:h-[540px]',
            loaded ? 'opacity-100' : 'opacity-0',
          )}
        />
      )}

      {/* Scrim: keeps the floating shipment card legible over any footage. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/75 via-ink-950/10 to-transparent"
      />
      {/* A breath of brand warmth so stock media still reads as ours. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-brand-600/20 mix-blend-soft-light"
      />

      {showVideo && (
        <button
          type="button"
          onClick={togglePlayback}
          aria-label={playing ? 'Pause background video' : 'Play background video'}
          className="absolute bottom-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-ink-950/60 text-white backdrop-blur transition-colors duration-300 hover:border-white/50 hover:bg-ink-950/80"
        >
          {playing ? (
            <Pause className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Play className="ml-0.5 h-4 w-4" aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  );
}
