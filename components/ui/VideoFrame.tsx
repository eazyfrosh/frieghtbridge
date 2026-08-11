'use client';

import { Pause, Play } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { MediaAsset, VideoAsset } from '@/lib/site';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { cn } from '@/lib/utils';

interface VideoFrameProps {
  /** Still shown as the base layer, and whenever the clip cannot play. */
  media: MediaAsset;
  /** Optional clip. Leave `src` empty to render the still on its own. */
  video?: VideoAsset;
  /** Height/crop classes applied to both layers. */
  heightClass: string;
  sizes?: string;
  priority?: boolean;
  /** Darkens the lower edge, for frames with content overlapping the bottom. */
  scrim?: boolean;
  /**
   * `dark` is the frame used on the orange bands. `light` drops the dark base
   * and warm overlay for a plain frame that sits on an off-white surface.
   */
  tone?: 'dark' | 'light';
  className?: string;
}

/**
 * A still image with an optional looping clip layered over it.
 *
 * The still is always the server-rendered base, so it is the LCP candidate and
 * the frame is never empty. The clip mounts on the client and fades in once it
 * can play; if it fails, the still is already underneath. The still itself
 * falls back to its bundled illustration.
 *
 * Three details here are load-bearing and easy to get wrong:
 *
 *  - The source is set via `src`, not a `<source>` child. An error on a
 *    `<source>` fires on that child and does not bubble, so `onError` would
 *    never run and a broken clip would leave a blank frame.
 *  - `muted` + `playsInline` are what make autoplay legal on mobile browsers.
 *  - Video selection waits for mount. The server cannot know the visitor's
 *    motion preference, so branching the tree on it during SSR mismatches on
 *    hydration.
 *
 * WCAG 2.2.2 wants a way to stop motion that auto-starts and runs past five
 * seconds, hence the pause control.
 */
export function VideoFrame({
  media,
  video,
  heightClass,
  sizes = '(min-width: 1024px) 50vw, 100vw',
  priority,
  scrim = true,
  tone = 'dark',
  className,
}: VideoFrameProps) {
  const light = tone === 'light';
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

  const videoSrc = useMemo(() => {
    if (!mounted || !video) return null;
    const { src = '', webm = '' } = video;
    if (webm && document.createElement('video').canPlayType('video/webm; codecs="vp9"') === 'probably') {
      return webm;
    }
    return src || null;
  }, [mounted, video]);

  const showVideo = Boolean(videoSrc) && !videoFailed && !reduced;

  const photoSrc = photoFailed ? media.fallbackSrc : media.src;
  const photoAlt = photoFailed ? (media.fallbackAlt ?? media.alt) : media.alt;

  function togglePlayback() {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        light
          ? 'rounded-3xl bg-ink-100 shadow-[0_2px_6px_rgba(17,17,17,0.04),0_40px_80px_-32px_rgba(17,17,17,0.28)]'
          : 'rounded-4xl border border-white/10 bg-ink-900 shadow-[0_50px_120px_-40px_rgba(0,0,0,0.9)]',
        className,
      )}
    >
      {!light && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(150deg,#7A2E0C_0%,#A93706_55%,#121212_100%)]"
        />
      )}

      <Image
        key={photoSrc}
        src={photoSrc}
        alt={photoAlt}
        width={1600}
        height={1200}
        priority={priority}
        loading={priority ? undefined : 'lazy'}
        sizes={sizes}
        onError={() => setPhotoFailed(true)}
        onLoad={() => setPhotoLoaded(true)}
        className={cn(
          'relative w-full object-cover transition-opacity duration-700 ease-premium',
          heightClass,
          photoLoaded ? 'opacity-100' : 'opacity-0',
        )}
      />

      {showVideo && videoSrc && (
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={video?.description}
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

      {scrim && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/75 via-ink-950/10 to-transparent"
        />
      )}
      {!light && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-brand-600/20 mix-blend-soft-light"
        />
      )}

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
