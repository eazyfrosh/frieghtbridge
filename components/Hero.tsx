'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Boxes, MoveRight, Radar, ShieldCheck } from 'lucide-react';
import { EASE_PREMIUM } from '@/lib/motion';
import { HERO_MEDIA } from '@/lib/site';
import { VideoFrame } from './ui/VideoFrame';
import { Button } from './ui/Button';
import { useReducedMotion } from '@/lib/use-reduced-motion';

const HEADLINE = ['Freight', 'That', 'Moves', 'Your', 'Business', 'Forward.'];

const TRUST_POINTS = [
  { icon: Radar, label: 'Live shipment visibility' },
  { icon: ShieldCheck, label: 'Vetted carrier network' },
  { icon: Boxes, label: 'Parcel to full truckload' },
];

export function Hero() {
  const reduced = useReducedMotion();

  const rise = (delay: number) =>
    reduced
      ? { initial: undefined, animate: undefined }
      : {
          initial: { opacity: 0, y: 22 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, ease: EASE_PREMIUM, delay },
        };

  return (
    <section className="relative isolate overflow-hidden bg-brand-700 pb-40 pt-[128px] text-white sm:pb-48 lg:pb-56 lg:pt-[150px]">
      {/* Ambient background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_15%_-10%,#7A2E0C_0%,transparent_55%),radial-gradient(90%_70%_at_92%_8%,#D1450A_0%,transparent_52%)] opacity-70" />
        <div className="absolute inset-0 bg-grid-dark bg-[size:64px_64px] mask-fade-b opacity-[0.55]" />
        <div className="absolute -left-40 top-1/3 h-[26rem] w-[26rem] rounded-full bg-white/10 blur-[110px]" />
        <div className="absolute bottom-0 left-1/2 h-64 w-[140%] -translate-x-1/2 bg-gradient-to-t from-brand-800 to-transparent" />
      </div>

      <div className="container">
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 xl:gap-16">
          {/* Copy */}
          <div className="on-dark max-w-[38rem]">
            <motion.div {...rise(0)}>
              <span className="eyebrow-dark">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-white" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                </span>
                Move Freight. Build Connections.
              </span>
            </motion.div>

            <h1 className="display-1 mt-6 text-white">
              {HEADLINE.map((word, index) => (
                <motion.span
                  key={word}
                  className="mr-[0.28em] inline-block"
                  initial={reduced ? undefined : { opacity: 0, y: '0.5em' }}
                  animate={reduced ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, ease: EASE_PREMIUM, delay: 0.12 + index * 0.06 }}
                >
                  {index >= 4 ? <span className="text-signal-200">{word}</span> : word}
                </motion.span>
              ))}
            </h1>

            <motion.p {...rise(0.46)} className="mt-6 max-w-lg text-base leading-relaxed text-ink-200 sm:text-lg">
              Reliable freight transportation and logistics solutions built to help businesses move goods faster,
              smarter, and with confidence.
            </motion.p>

            <motion.div {...rise(0.56)} className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button href="/quote" size="lg" variant="onDark" className="w-full sm:w-auto">
                Get a Quote
                <ArrowRight className="h-[1.1rem] w-[1.1rem] transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
              <Button href="/tracking" size="lg" variant="outlineDark" className="w-full sm:w-auto">
                Track a Shipment
                <MoveRight className="h-[1.1rem] w-[1.1rem] transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </motion.div>

            <motion.ul {...rise(0.68)} className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
              {TRUST_POINTS.map((point) => (
                <li key={point.label} className="flex items-center gap-2 text-sm text-ink-300">
                  <point.icon className="h-4 w-4 text-signal-200" aria-hidden="true" />
                  {point.label}
                </li>
              ))}
            </motion.ul>
          </div>

          {/* Visual */}
          <motion.div
            className="relative"
            initial={reduced ? undefined : { opacity: 0, scale: 0.96, y: 28 }}
            animate={reduced ? undefined : { opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE_PREMIUM, delay: 0.3 }}
          >
            <VideoFrame
              media={HERO_MEDIA}
              video={HERO_MEDIA.video}
              heightClass="h-[320px] sm:h-[440px] lg:h-[540px]"
              sizes="(min-width: 1024px) 42vw, 100vw"
              priority
            />

            {/* Floating status card */}
            <motion.div
              className="absolute -left-3 -bottom-6 w-[15.5rem] rounded-2xl border border-white/12 bg-ink-900/90 p-4 shadow-[0_28px_60px_-24px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:-left-8"
              initial={reduced ? undefined : { opacity: 0, x: -18 }}
              animate={reduced ? undefined : { opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: EASE_PREMIUM, delay: 0.85 }}
            >
              <div className={reduced ? '' : 'animate-float'}>
                <div className="flex items-center justify-between">
                  <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-400">
                    FBX-28473921
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/15 px-2 py-0.5 text-[0.7rem] font-semibold text-brand-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-300" aria-hidden="true" />
                    In transit
                  </span>
                </div>
                <p className="mt-2 font-display text-[0.98rem] font-semibold text-white">Chicago → Dallas</p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-300"
                    initial={reduced ? { width: '62%' } : { width: 0 }}
                    animate={{ width: '62%' }}
                    transition={{ duration: 1.4, ease: EASE_PREMIUM, delay: 1.1 }}
                  />
                </div>
                <p className="mt-2 text-xs text-ink-400">Arriving tomorrow · 08:00–12:00</p>
              </div>
            </motion.div>

            {/* Floating metric card */}
            <motion.div
              className="absolute -right-2 -top-5 rounded-2xl border border-white/12 bg-white/95 px-4 py-3 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.6)] sm:-right-6"
              initial={reduced ? undefined : { opacity: 0, y: -16 }}
              animate={reduced ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE_PREMIUM, delay: 1 }}
            >
              <div className={reduced ? '' : 'animate-float [animation-delay:1.4s]'}>
                <p className="font-display text-2xl font-semibold text-ink-900">98%</p>
                <p className="text-xs font-medium text-ink-500">On-time delivery</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
