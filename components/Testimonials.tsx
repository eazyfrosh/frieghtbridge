'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { EASE_PREMIUM } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Reveal } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';

const TESTIMONIALS = [
  {
    quote: 'FreightBridge has completely simplified the way we manage our shipments.',
    detail:
      'We went from four inboxes and a spreadsheet to one view the whole team trusts. Booking a lane takes minutes now.',
    name: 'Operations Director',
    company: 'Industrial equipment manufacturer',
    initials: 'OD',
  },
  {
    quote: 'Reliable, transparent, and incredibly easy to work with.',
    detail:
      'Pricing holds, pickups happen when they say they will, and when something moves we hear it from FreightBridge first.',
    name: 'E-commerce Founder',
    company: 'Direct-to-consumer brand',
    initials: 'EF',
  },
  {
    quote: 'The shipment visibility alone has transformed our logistics workflow.',
    detail:
      'Our customer service team stopped calling carriers. Every status question is answered by the timeline before it reaches us.',
    name: 'Supply Chain Manager',
    company: 'Multi-site retail group',
    initials: 'SM',
  },
  {
    quote: 'Cross-border finally stopped being the hard part of our week.',
    detail:
      'Documentation is prepared up front, so our containers clear instead of sitting. That change alone bought back days.',
    name: 'Head of Distribution',
    company: 'Consumer goods importer',
    initials: 'HD',
  },
];

const AUTOPLAY_MS = 7000;

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();

  const go = useCallback((next: number, dir: number) => {
    setDirection(dir);
    setIndex((next + TESTIMONIALS.length) % TESTIMONIALS.length);
  }, []);

  useEffect(() => {
    if (paused || reduced) return;
    const timer = setTimeout(() => go(index + 1, 1), AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [index, paused, reduced, go]);

  const active = TESTIMONIALS[index];

  return (
    <section id="testimonials" className="section bg-white">
      <div className="container">
        <SectionHeading
          eyebrow="Customer stories"
          align="center"
          title={
            <>
              Teams that move freight <span className="text-brand-600">every single day.</span>
            </>
          }
          description="What shippers tell us after their first quarter on the FreightBridge network."
        />

        <Reveal delay={0.1}>
          <div
            className="relative mx-auto mt-14 max-w-4xl"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
          >
            <div className="relative overflow-hidden rounded-4xl border border-ink-100 bg-gradient-to-br from-ink-50/80 via-white to-brand-50/40 p-7 shadow-card sm:p-10 lg:p-12">
              <Quote
                className="absolute right-8 top-8 h-16 w-16 text-brand-100 sm:h-24 sm:w-24"
                aria-hidden="true"
              />

              <div className="relative min-h-[19rem] sm:min-h-[16rem]">
                <AnimatePresence mode="wait" custom={direction} initial={false}>
                  <motion.blockquote
                    key={index}
                    custom={direction}
                    initial={reduced ? { opacity: 0 } : { opacity: 0, x: direction * 36 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduced ? { opacity: 0 } : { opacity: 0, x: direction * -36 }}
                    transition={{ duration: 0.45, ease: EASE_PREMIUM }}
                    className="flex h-full flex-col"
                  >
                    <div className="flex gap-1" aria-label="Rated 5 out of 5">
                      {[0, 1, 2, 3, 4].map((star) => (
                        <Star key={star} className="h-4 w-4 fill-signal-400 text-signal-400" aria-hidden="true" />
                      ))}
                    </div>

                    <p className="mt-6 font-display text-xl font-semibold leading-snug tracking-[-0.02em] text-ink-900 sm:text-[1.75rem]">
                      &ldquo;{active.quote}&rdquo;
                    </p>
                    <p className="mt-4 max-w-2xl text-[0.98rem] leading-relaxed text-ink-500">{active.detail}</p>

                    <footer className="mt-auto flex items-center gap-3.5 pt-8">
                      <span
                        aria-hidden="true"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-ink-900 font-display text-sm font-semibold text-white"
                      >
                        {active.initials}
                      </span>
                      <span>
                        <cite className="block not-italic font-semibold text-ink-900">{active.name}</cite>
                        <span className="block text-sm text-ink-500">{active.company}</span>
                      </span>
                    </footer>
                  </motion.blockquote>
                </AnimatePresence>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-6 flex items-center justify-between gap-4">
              <div className="flex gap-2" role="tablist" aria-label="Choose a testimonial">
                {TESTIMONIALS.map((testimonial, dotIndex) => (
                  <button
                    key={testimonial.name}
                    type="button"
                    role="tab"
                    aria-selected={dotIndex === index}
                    aria-label={`Testimonial ${dotIndex + 1} of ${TESTIMONIALS.length}`}
                    onClick={() => go(dotIndex, dotIndex > index ? 1 : -1)}
                    className={cn(
                      'h-2 rounded-full transition-all duration-400 ease-premium',
                      dotIndex === index ? 'w-8 bg-brand-600' : 'w-2 bg-ink-200 hover:bg-ink-300',
                    )}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => go(index - 1, -1)}
                  aria-label="Previous testimonial"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-700 transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:border-ink-300 hover:bg-ink-50"
                >
                  <ChevronLeft className="h-[1.15rem] w-[1.15rem]" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => go(index + 1, 1)}
                  aria-label="Next testimonial"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-700 transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:border-ink-300 hover:bg-ink-50"
                >
                  <ChevronRight className="h-[1.15rem] w-[1.15rem]" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
