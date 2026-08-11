'use client';

import { motion } from 'framer-motion';
import { ArrowRight, MoveRight, Radar, Timer } from 'lucide-react';
import { EASE_PREMIUM } from '@/lib/motion';
import { HERO_MEDIA } from '@/lib/site';
import { VideoFrame } from './ui/VideoFrame';
import { Button } from './ui/Button';
import { useReducedMotion } from '@/lib/use-reduced-motion';

const HEADLINE = ['Move', 'Freight', 'With', 'Confidence.'];

export function Hero() {
  const reduced = useReducedMotion();

  /** Fade-and-rise, the shared entrance for every element in the left column. */
  const rise = (delay: number) =>
    reduced
      ? { initial: undefined, animate: undefined }
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, ease: EASE_PREMIUM, delay },
        };

  return (
    // The bottom padding clears the tracking section's -mt-28/-32/-36 pull-up
    // (see app/page.tsx) so that card never covers the hero visual.
    <section className="relative isolate overflow-hidden bg-canvas pb-40 pt-[120px] sm:pb-48 lg:pb-56 lg:pt-[148px]">
      <div className="container">
        {/* Asymmetric split — the visual takes the larger share on desktop. */}
        <div className="grid items-center gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16 xl:gap-20">
          {/* Copy */}
          <div className="max-w-[36rem]">
            <motion.p
              {...rise(0)}
              className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-ink-500 sm:text-[0.78rem]"
            >
              <span className="mr-2.5 inline-block h-1.5 w-1.5 -translate-y-[3px] rounded-full bg-brand-500" aria-hidden="true" />
              Smarter freight. Better delivery.
            </motion.p>

            {/* Words rise in sequence; under reduced motion they are simply there. */}
            <h1 className="mt-6 font-display text-[2.75rem] font-semibold leading-[1.03] tracking-[-0.035em] text-ink-900 sm:text-6xl lg:text-[4.5rem] xl:text-[4.75rem]">
              {HEADLINE.map((word, index) => (
                <motion.span
                  key={word}
                  className="mr-[0.24em] inline-block"
                  initial={reduced ? undefined : { opacity: 0, y: '0.4em' }}
                  animate={reduced ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, ease: EASE_PREMIUM, delay: 0.12 + index * 0.07 }}
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            <motion.p {...rise(0.44)} className="mt-7 max-w-[30rem] text-[1.05rem] leading-relaxed text-ink-500 sm:text-lg">
              FreightBridge makes shipping, tracking, and managing freight simple from one powerful platform.
            </motion.p>

            <motion.div {...rise(0.56)} className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Button href="/quote" size="lg" className="w-full sm:w-auto">
                Get a Quote
                <ArrowRight className="h-[1.1rem] w-[1.1rem] transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
              <Button href="/tracking" size="lg" variant="secondary" className="w-full sm:w-auto">
                Track Shipment
                <MoveRight className="h-[1.1rem] w-[1.1rem] transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </motion.div>
          </div>

          {/* Visual */}
          <motion.div
            className="relative"
            initial={reduced ? undefined : { opacity: 0, scale: 0.97 }}
            animate={reduced ? undefined : { opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: EASE_PREMIUM, delay: 0.24 }}
          >
            {/* A soft wash of the page colour behind the frame, so the image
                settles into the background instead of being pasted onto it. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem] bg-[radial-gradient(60%_60%_at_50%_50%,rgba(255,106,0,0.10)_0%,transparent_70%)]"
            />

            <VideoFrame
              media={HERO_MEDIA}
              video={HERO_MEDIA.video}
              tone="light"
              scrim={false}
              heightClass="h-[320px] sm:h-[440px] lg:h-[540px]"
              sizes="(min-width: 1024px) 52vw, 100vw"
              priority
            />

            {/* Floating cards — decorative, and shown only once the layout is
                two-column. Below that the image is full-bleed and the cards
                would hang past the container edge and be clipped. */}
            <FloatingCard
              className="-left-8 top-12"
              delay={0.9}
              reduced={reduced}
              from={-16}
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Timer className="h-[1.05rem] w-[1.05rem]" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-display text-[1.35rem] font-semibold leading-none text-ink-900">2.4 days</span>
                <span className="mt-1 block text-xs font-medium text-ink-500">Average transit time</span>
              </span>
            </FloatingCard>

            <FloatingCard
              className="-right-2 bottom-12"
              delay={1.05}
              reduced={reduced}
              from={16}
              floatDelay="1.6s"
            >
              <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Radar className="h-[1.05rem] w-[1.05rem]" aria-hidden="true" />
              </span>
              <span>
                <span className="flex items-center gap-1.5 font-display text-[1.35rem] font-semibold leading-none text-ink-900">
                  98.4%
                </span>
                <span className="mt-1 block text-xs font-medium text-ink-500">On-time delivery</span>
              </span>
            </FloatingCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

interface FloatingCardProps {
  children: React.ReactNode;
  className: string;
  delay: number;
  /** Horizontal offset the card enters from. */
  from: number;
  floatDelay?: string;
  reduced: boolean;
}

function FloatingCard({ children, className, delay, from, floatDelay, reduced }: FloatingCardProps) {
  return (
    <motion.div
      aria-hidden="true"
      className={`absolute hidden items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(17,17,17,0.05),0_16px_36px_-16px_rgba(17,17,17,0.22)] lg:flex ${className}`}
      initial={reduced ? undefined : { opacity: 0, x: from, y: 10 }}
      animate={reduced ? undefined : { opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.7, ease: EASE_PREMIUM, delay }}
    >
      <span
        className={reduced ? 'flex items-center gap-3' : 'flex animate-float items-center gap-3'}
        style={floatDelay && !reduced ? { animationDelay: floatDelay } : undefined}
      >
        {children}
      </span>
    </motion.div>
  );
}
