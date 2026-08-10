'use client';

import { motion } from 'framer-motion';
import { Cpu, Eye, Gauge, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { fadeUp, motionSafe } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Reveal, StaggerGroup } from './ui/Reveal';
import { useReducedMotion } from '@/lib/use-reduced-motion';

const BENEFITS = [
  {
    id: 'speed',
    title: 'Speed',
    copy: 'Move shipments efficiently with optimized logistics.',
    detail:
      'Lane-level routing and consolidated linehauls cut idle time between scans, so freight spends its hours moving instead of waiting on a dock.',
    metric: '2.4 days',
    metricLabel: 'Average domestic transit',
    icon: Gauge,
  },
  {
    id: 'visibility',
    title: 'Visibility',
    copy: 'Know where your freight is at every step.',
    detail:
      'Every pickup, transfer, and delivery scan lands in one live timeline — shared with your team and your customers automatically.',
    metric: '24/7',
    metricLabel: 'Live shipment tracking',
    icon: Eye,
  },
  {
    id: 'reliability',
    title: 'Reliability',
    copy: 'Consistent transportation you can depend on.',
    detail:
      'A vetted carrier network with performance scoring on every lane, plus proactive exception handling before a delay reaches your customer.',
    metric: '98%',
    metricLabel: 'On-time delivery',
    icon: ShieldCheck,
  },
  {
    id: 'technology',
    title: 'Technology',
    copy: 'Modern tools that make logistics simpler.',
    detail:
      'Quoting, booking, documents, and reporting in one connected view — with an API when you would rather it lived inside your own systems.',
    metric: '1 view',
    metricLabel: 'Quotes, docs & tracking',
    icon: Cpu,
  },
];

export function WhyFreightBridge() {
  const [active, setActive] = useState(BENEFITS[0].id);
  const reduced = useReducedMotion();

  return (
    <section id="why" className="section relative overflow-hidden bg-ink-50/60">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid-light bg-[size:72px_72px] opacity-60 mask-fade-b"
      />

      <div className="container relative">
        <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          {/* Editorial column */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <span className="eyebrow">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true" />
                Why FreightBridge
              </span>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="display-2 mt-5">
                Built for the way freight <span className="text-brand-600">moves today.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="lead mt-5 max-w-md">
                Supply chains stopped being predictable a long time ago. FreightBridge is designed for the version of
                logistics you actually work in — fast, visible, and accountable at every handoff.
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="relative mt-10 overflow-hidden rounded-4xl border border-ink-100 bg-white shadow-card">
                <Image
                  src="/images/port-terminal.svg"
                  alt="Gantry cranes loading containers onto a cargo ship at a FreightBridge port terminal"
                  width={1000}
                  height={760}
                  loading="lazy"
                  className="h-56 w-full object-cover sm:h-72 lg:h-[17rem]"
                />
                <div className="flex items-center gap-3 border-t border-ink-100 px-5 py-4">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <p className="text-sm text-ink-600">
                    Air, ocean, road and rail coordinated by one account team.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Benefit stack */}
          <StaggerGroup className="flex flex-col" gap={0.08}>
            {BENEFITS.map((benefit, index) => {
              const isActive = active === benefit.id;
              return (
                <motion.div
                  key={benefit.id}
                  variants={motionSafe(reduced, fadeUp)}
                  onMouseEnter={() => setActive(benefit.id)}
                  onFocus={() => setActive(benefit.id)}
                  tabIndex={0}
                  className={cn(
                    'group relative cursor-default border-t border-ink-200/70 py-8 transition-colors duration-400 ease-premium first:border-t-0 first:pt-0 sm:py-10',
                    isActive && 'border-brand-200',
                  )}
                >
                  <div className="flex items-start gap-5 sm:gap-8">
                    <span
                      className={cn(
                        'mt-1 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-all duration-400 ease-premium sm:h-14 sm:w-14',
                        isActive
                          ? 'border-brand-500 bg-brand-600 text-white shadow-[0_16px_36px_-18px_rgba(209,69,10,0.95)]'
                          : 'border-ink-200 bg-white text-ink-500',
                      )}
                    >
                      <benefit.icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                        <h3 className="font-display text-2xl font-semibold tracking-[-0.025em] text-ink-900 sm:text-[2rem]">
                          {benefit.title}
                        </h3>
                        <span className="font-mono text-xs font-semibold text-ink-300">
                          0{index + 1}
                        </span>
                      </div>
                      <p className="mt-2 text-[1.05rem] font-medium text-ink-700 sm:text-lg">{benefit.copy}</p>
                      <p className="mt-2.5 max-w-xl text-[0.95rem] leading-relaxed text-ink-500">{benefit.detail}</p>

                      <div className="mt-5 inline-flex items-baseline gap-2.5 rounded-full bg-white px-4 py-2 shadow-soft ring-1 ring-ink-100">
                        <span className="font-display text-lg font-semibold text-brand-600">{benefit.metric}</span>
                        <span className="text-xs font-medium uppercase tracking-[0.1em] text-ink-400">
                          {benefit.metricLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <motion.span
                    aria-hidden="true"
                    className="absolute -left-4 top-8 hidden h-[calc(100%-4rem)] w-0.5 origin-center rounded-full bg-brand-500 sm:-left-6 lg:block"
                    initial={false}
                    animate={{ opacity: isActive ? 1 : 0, scaleY: isActive ? 1 : 0.4 }}
                    transition={{ duration: reduced ? 0 : 0.35 }}
                  />
                </motion.div>
              );
            })}
          </StaggerGroup>
        </div>
      </div>
    </section>
  );
}
