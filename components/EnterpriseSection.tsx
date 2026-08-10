'use client';

import { animate, motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowRight, Building2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { EASE_PREMIUM, fadeUp, motionSafe } from '@/lib/motion';
import { Button } from './ui/Button';
import { Reveal, StaggerGroup } from './ui/Reveal';

const STATS = [
  { value: 98, suffix: '%', label: 'On-time delivery' },
  { value: 24, suffix: '/7', label: 'Shipment visibility' },
  { value: 50, suffix: '+', label: 'Service destinations' },
  { value: 10, suffix: 'K+', label: 'Shipments delivered' },
];

export function EnterpriseSection() {
  return (
    <section id="enterprise" className="section relative overflow-hidden bg-ink-950 text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_10%_0%,#152FB8_0%,transparent_55%),radial-gradient(70%_60%_at_95%_100%,#C73206_0%,transparent_55%)] opacity-60" />
        <div className="absolute inset-0 bg-grid-dark bg-[size:56px_56px] opacity-40" />
      </div>

      <div className="on-dark container relative">
        <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20">
          <div>
            <Reveal>
              <span className="eyebrow-dark">
                <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                For business & enterprise
              </span>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="display-2 mt-6 text-white">
                Logistics built for businesses that are <span className="text-gradient">going places.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-200 sm:text-lg">
                From growing businesses to established enterprises, FreightBridge provides flexible logistics
                solutions designed around your operation.
              </p>
            </Reveal>
            <Reveal delay={0.18}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button href="/contact" size="lg" variant="onDark" className="w-full sm:w-auto">
                  Talk to our team
                  <ArrowRight className="h-[1.05rem] w-[1.05rem] transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
                <Button href="/quote" size="lg" variant="outlineDark" className="w-full sm:w-auto">
                  Get a quote
                </Button>
              </div>
            </Reveal>
          </div>

          <StaggerGroup className="grid grid-cols-2 gap-4 sm:gap-5" gap={0.1}>
            {STATS.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </StaggerGroup>
        </div>

        <Reveal delay={0.1}>
          <p className="mt-12 text-xs text-ink-400">
            Figures shown are demonstration values for this website prototype.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function StatCard({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (!inView || reduced) {
      if (reduced) setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.4,
      ease: EASE_PREMIUM,
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, reduced, value]);

  return (
    <motion.div
      ref={ref}
      variants={motionSafe(Boolean(reduced), fadeUp)}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur transition-colors duration-400 ease-premium hover:border-white/25 hover:bg-white/[0.07] sm:p-7"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand-500/25 blur-2xl transition-opacity duration-500 group-hover:opacity-100 md:opacity-0"
      />
      <p className="relative font-display text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
        {display}
        <span className="text-brand-300">{suffix}</span>
      </p>
      <p className="relative mt-2 text-sm font-medium text-ink-300">{label}</p>
    </motion.div>
  );
}
