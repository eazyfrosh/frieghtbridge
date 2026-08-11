'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { EASE_PREMIUM } from '@/lib/motion';
import { IMAGERY, type MediaAsset } from '@/lib/site';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { cn } from '@/lib/utils';
import { Button } from './ui/Button';
import { Figure } from './ui/Figure';
import { Reveal } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';

interface Slide {
  eyebrow: string;
  title: string;
  copy: string;
  /** Pulled from IMAGERY so slides swap to photographs with the rest. */
  media: MediaAsset;
  stats: Array<{ value: string; label: string }>;
  href: string;
  cta: string;
}

const SLIDES: Slide[] = [
  {
    eyebrow: 'Road freight',
    title: 'Lanes that hold their promise',
    copy: 'FTL and LTL capacity across a vetted carrier network, priced on the lane rather than the day, with dispatch that answers on the first ring.',
    media: IMAGERY.road,
    stats: [
      { value: '2.4 days', label: 'Avg. domestic transit' },
      { value: '98%', label: 'On-time delivery' },
    ],
    href: '/services#freight-transportation',
    cta: 'Explore road freight',
  },
  {
    eyebrow: 'Ocean & air',
    title: 'Border paperwork, handled up front',
    copy: 'Customs documentation is prepared before the container gates in, which is the single biggest reason freight clears instead of sitting on a quay.',
    media: IMAGERY.port,
    stats: [
      { value: '7 regions', label: 'Direct coverage' },
      { value: 'FCL & LCL', label: 'Consolidation' },
    ],
    href: '/services#freight-forwarding',
    cta: 'Explore forwarding',
  },
  {
    eyebrow: 'Warehousing',
    title: 'Storage that flexes with your season',
    copy: 'Overflow space for a peak or a permanent fulfillment base, with inventory counts your own systems can read in real time.',
    media: IMAGERY.warehouse,
    stats: [
      { value: 'Same-day', label: 'Pick & pack cutoff' },
      { value: 'Real-time', label: 'Inventory sync' },
    ],
    href: '/services#warehousing',
    cta: 'Explore warehousing',
  },
];

const AUTOPLAY_MS = 6500;

export function ShowcaseCarousel() {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);

  const go = useCallback((next: number, dir: number) => {
    setDirection(dir);
    setIndex((next + SLIDES.length) % SLIDES.length);
  }, []);

  // Autoplay never runs under reduced motion, and pauses on hover or focus so
  // it cannot yank content away from someone reading or tabbing through it.
  useEffect(() => {
    if (paused || reduced) return;
    const timer = setTimeout(() => go(index + 1, 1), AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [index, paused, reduced, go]);

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(index - 1, -1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(index + 1, 1);
    }
  }

  const slide = SLIDES[index];
  const autoplayOn = !paused && !reduced;

  return (
    <section id="showcase" className="section relative overflow-hidden bg-brand-500 text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(85%_70%_at_15%_0%,#C24500_0%,transparent_55%),radial-gradient(60%_60%_at_90%_100%,#9C3800_0%,transparent_55%)] opacity-60" />
        <div className="absolute inset-0 bg-grid-light bg-[size:56px_56px] opacity-30" />
      </div>

      <div className="on-dark container relative">
        <SectionHeading
          eyebrow="How we move it"
          tone="light"
          title={
            <>
              One network, <span className="text-gradient">every kind of freight.</span>
            </>
          }
          description="Three of the ways FreightBridge moves goods for customers today."
        />

        <Reveal delay={0.1} className="mt-14">
          <div
            ref={regionRef}
            role="group"
            aria-roledescription="carousel"
            aria-label="FreightBridge capabilities"
            tabIndex={0}
            onKeyDown={onKeyDown}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
            className="relative rounded-4xl border border-white/25 bg-white/[0.12] p-4 backdrop-blur sm:p-6 lg:p-8"
          >
            <div className="relative overflow-hidden">
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                <motion.div
                  key={index}
                  custom={direction}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, x: direction * 64 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, x: direction * -64 }}
                  transition={{ duration: 0.5, ease: EASE_PREMIUM }}
                  drag={reduced ? false : 'x'}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.16}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -80) go(index + 1, 1);
                    else if (info.offset.x > 80) go(index - 1, -1);
                  }}
                  aria-roledescription="slide"
                  aria-label={`${index + 1} of ${SLIDES.length}: ${slide.title}`}
                  className="grid cursor-grab items-center gap-8 active:cursor-grabbing lg:grid-cols-[1fr_1.05fr] lg:gap-12"
                >
                  <div className="min-w-0">
                    <span className="eyebrow-dark">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
                      {slide.eyebrow}
                    </span>
                    <h3 className="mt-5 font-display text-[1.9rem] font-semibold leading-[1.1] tracking-[-0.03em] text-white sm:text-4xl">
                      {slide.title}
                    </h3>
                    <p className="mt-4 max-w-lg text-[0.98rem] leading-relaxed text-white sm:text-lg">
                      {slide.copy}
                    </p>

                    <dl className="mt-7 flex flex-wrap gap-x-10 gap-y-4">
                      {slide.stats.map((stat) => (
                        <div key={stat.label}>
                          <dt className="sr-only">{stat.label}</dt>
                          <dd>
                            <span className="block font-display text-2xl font-semibold text-ink-950">
                              {stat.value}
                            </span>
                            <span className="mt-0.5 block text-xs font-medium uppercase tracking-[0.12em] text-white">
                              {stat.label}
                            </span>
                          </dd>
                        </div>
                      ))}
                    </dl>

                    <Button href={slide.href} variant="onDark" size="lg" className="mt-8">
                      {slide.cta}
                      <ArrowRight className="h-[1.05rem] w-[1.05rem] transition-transform duration-300 group-hover:translate-x-1" />
                    </Button>
                  </div>

                  <div className="overflow-hidden rounded-3xl border border-white/25 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.9)]">
                    <Figure
                      media={slide.media}
                      sizes="(min-width: 1024px) 48vw, 100vw"
                      className="pointer-events-none h-56 w-full select-none object-cover sm:h-72 lg:h-[22rem]"
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/25 pt-6">
              <div className="flex items-center gap-3">
                {SLIDES.map((item, dotIndex) => {
                  const active = dotIndex === index;
                  return (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => go(dotIndex, dotIndex > index ? 1 : -1)}
                      aria-label={`Show slide ${dotIndex + 1}: ${item.title}`}
                      aria-current={active}
                      className="group/dot py-2"
                    >
                      <span
                        className={cn(
                          'relative block h-1 overflow-hidden rounded-full transition-all duration-400 ease-premium',
                          active ? 'w-16 bg-white/25' : 'w-6 bg-white/25 group-hover/dot:bg-white/40',
                        )}
                      >
                        {active && (
                          <motion.span
                            key={`${index}-${paused}-${String(reduced)}`}
                            className="absolute inset-y-0 left-0 rounded-full bg-white"
                            initial={{ width: autoplayOn ? '0%' : '100%' }}
                            animate={{ width: '100%' }}
                            transition={{
                              duration: autoplayOn ? AUTOPLAY_MS / 1000 : 0,
                              ease: 'linear',
                            }}
                          />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPaused((value) => !value)}
                  aria-label={paused ? 'Resume slideshow' : 'Pause slideshow'}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-white/[0.12] text-white transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:border-white/70 hover:bg-white/20"
                >
                  {paused || reduced ? (
                    <Play className="ml-0.5 h-[1.05rem] w-[1.05rem]" aria-hidden="true" />
                  ) : (
                    <Pause className="h-[1.05rem] w-[1.05rem]" aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => go(index - 1, -1)}
                  aria-label="Previous slide"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-white/[0.12] text-white transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:border-white/70 hover:bg-white/20"
                >
                  <ChevronLeft className="h-[1.15rem] w-[1.15rem]" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => go(index + 1, 1)}
                  aria-label="Next slide"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-white/[0.12] text-white transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:border-white/70 hover:bg-white/20"
                >
                  <ChevronRight className="h-[1.15rem] w-[1.15rem]" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Announce slide changes without stealing focus. */}
            <p aria-live="polite" className="sr-only">
              Slide {index + 1} of {SLIDES.length}: {slide.title}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
