'use client';


import { Pause, Play } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { HERO_MEDIA } from '@/lib/site';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/lib/use-reduced-motion';

/**
 * The hero's media frame.
 *
 * The still image is always the base layer and is server-rendered, so it is
 * the LCP candidate and there is never an empty frame. When a clip is
 * configured and motion is allowed, the video layers over the image after
 * mount and fades in once it can play. Anything that fails simply reveals the
 * layer beneath: video -> photograph -> bundled illustration.
 *
 * Video selection is deliberately deferred until after mount. The server
 * cannot know the visitor's motion preference, so branching the render tree on
 * `useReducedMotion` during SSR produces a hydration mismatch.
 *
 * WCAG 2.2.2 requires a way to stop motion that auto-starts and runs past five
 * seconds, hence the pause control.
 */
export function HeroMedia() {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [photoLoaded, setPhotoLoaded] = useState(false);
  // Driven by the element's own events, never assumed — autoplay can be
  // refused, and the control must not claim the clip is running when it is not.
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => setMounted(true), []);

  /**
   * Prefer webm only when the browser is confident about it; otherwise fall
   * through to the mp4 and let `onError` catch an unplayable file. `onError`
   * is reliable here because the source is set via `src` — an error on a
   * `<source>` child fires on that child and does not bubble to the video.
   */
  const videoSrc = useMemo(() => {
    if (!mounted) return null;
    const src = HERO_MEDIA.video?.src ?? '';
    const webm = HERO_MEDIA.video?.webm ?? '';
    if (webm && document.createElement('video').canPlayType('video/webm; codecs="vp9"') === 'probably') {
      return webm;
    }
    return src || null;
  }, [mounted]);

  const showVideo = Boolean(videoSrc) && !videoFailed && !reduced;

  const photoSrc = photoFailed ? HERO_MEDIA.fallbackSrc : HERO_MEDIA.src;
  const photoAlt = photoFailed ? HERO_MEDIA.fallbackAlt : HERO_MEDIA.alt;

  function togglePlayback() {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  }

  return (
    <div className="relative overflow-hidden rounded-4xl border border-white/10 bg-ink-900 shadow-[0_50px_120px_-40px_rgba(0,0,0,0.9)]">
      {/* Ground colour so the fade-in resolves from something warm. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(150deg,#7A2E0C_0%,#A93706_55%,#121212_100%)]"
      />

      <Image
        key={photoSrc}
        src={photoSrc}
        alt={photoAlt}
        width={1600}
        height={1200}
        priority
        sizes="(min-width: 1024px) 42vw, 100vw"
        onError={() => setPhotoFailed(true)}
        onLoad={() => setPhotoLoaded(true)}
        className={cn(
          'relative h-[320px] w-full object-cover transition-opacity duration-700 ease-premium sm:h-[440px] lg:h-[540px]',
          photoLoaded ? 'opacity-100' : 'opacity-0',
        )}
      />

      {showVideo && videoSrc && (
        <video
          ref={videoRef}
          src={videoSrc}
          // Muted + playsInline are what make autoplay legal on mobile Safari
          // and Chrome; without both, the clip silently never starts.
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={HERO_MEDIA.video?.description}
          onCanPlay={() => setVideoReady(true)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => setVideoFailed(true)}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-premium',
            videoReady ? 'opacity-100' : 'opacity-0',
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

      {showVideo && videoReady && (
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
