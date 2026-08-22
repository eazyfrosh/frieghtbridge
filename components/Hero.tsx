'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Radar, Search, Timer } from 'lucide-react';
import { EASE_PREMIUM } from '@/lib/motion';
import { HERO_MEDIA } from '@/lib/site';
import { VideoFrame } from './ui/VideoFrame';
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
            {/* Words rise in sequence; under reduced motion they are simply there.
                The lead-in runs bright orange and the last word stays near-black,
                so the line still has a fixed point to land on. */}
            <h1 className="font-display text-[2.75rem] font-semibold leading-[1.03] tracking-[-0.035em] text-ink-900 sm:text-6xl lg:text-[4.5rem] xl:text-[4.75rem]">
              {HEADLINE.map((word, index) => (
                <motion.span
                  key={word}
                  className={index < 3 ? 'mr-[0.24em] inline-block text-brand-500' : 'mr-[0.24em] inline-block'}
                  initial={reduced ? undefined : { opacity: 0, y: '0.4em' }}
                  animate={reduced ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, ease: EASE_PREMIUM, delay: index * 0.07 }}
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            <motion.p {...rise(0.32)} className="mt-7 max-w-[30rem] text-[1.05rem] leading-relaxed text-ink-500 sm:text-lg">
              FreightBridge Logistics makes shipping, tracking, and managing freight simple from one powerful platform.
            </motion.p>

            {/* A plain GET form, so tracking still works before JavaScript
                loads and the result is a shareable /tracking?number=… URL. */}
            <motion.form {...rise(0.44)} action="/tracking" method="get" className="mt-10 max-w-[32rem]">
              <label htmlFor="hero-tracking" className="sr-only">
                Tracking number
              </label>
              <div className="flex flex-col gap-2 rounded-2xl border-2 border-ink-200 bg-surface p-2 shadow-[0_2px_6px_rgba(17,17,17,0.04),0_18px_44px_-24px_rgba(17,17,17,0.28)] transition-colors duration-300 ease-premium focus-within:border-brand-500 sm:flex-row sm:items-center sm:rounded-full sm:p-1.5">
                <div className="flex flex-1 items-center gap-2.5 px-3 sm:px-4">
                  <Search className="h-[1.15rem] w-[1.15rem] shrink-0 text-ink-400" aria-hidden="true" />
                  <input
                    id="hero-tracking"
                    name="number"
                    type="text"
                    autoComplete="off"
                    maxLength={32}
                    placeholder="Enter Your Tracking Number"
                    className="h-12 w-full min-w-0 bg-transparent text-[0.98rem] text-ink-900 placeholder:text-ink-400 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="group inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 text-[0.98rem] font-semibold text-night-950 transition-all duration-300 ease-premium hover:bg-brand-400 hover:shadow-[0_14px_30px_-14px_rgba(255,106,0,0.9)] sm:rounded-full"
                >
                  Track
                  <ArrowRight
                    className="h-[1.05rem] w-[1.05rem] transition-transform duration-300 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </button>
              </div>
              <p className="mt-3 pl-1 text-[0.88rem] text-ink-500">
                Tracking numbers are <span className="font-mono text-ink-700">FBX</span> and eight
                digits — or paste the carrier&rsquo;s own.
              </p>
            </motion.form>
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
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300">
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
              <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300">
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
      className={`absolute hidden items-center gap-3 rounded-2xl bg-surface px-4 py-3.5 shadow-[0_1px_3px_rgba(17,17,17,0.05),0_16px_36px_-16px_rgba(17,17,17,0.22)] lg:flex ${className}`}
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
