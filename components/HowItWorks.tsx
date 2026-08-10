'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ClipboardList, MapPinned, PackageCheck, Route } from 'lucide-react';
import { fadeUp, motionSafe, viewportOnce } from '@/lib/motion';
import { Button } from './ui/Button';
import { StaggerGroup } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';

const STEPS = [
  {
    number: '01',
    title: 'Request a Quote',
    copy: "Tell us what you're shipping and where it needs to go.",
    icon: ClipboardList,
  },
  {
    number: '02',
    title: 'Plan Your Shipment',
    copy: 'We match your shipment with the right logistics solution.',
    icon: Route,
  },
  {
    number: '03',
    title: 'Track Your Freight',
    copy: 'Follow your shipment from pickup to destination.',
    icon: MapPinned,
  },
  {
    number: '04',
    title: 'Delivered',
    copy: 'Your freight arrives safely and on schedule.',
    icon: PackageCheck,
  },
];

export function HowItWorks() {
  const reduced = useReducedMotion();

  return (
    <section id="how-it-works" className="section bg-white">
      <div className="container">
        <SectionHeading
          eyebrow="How it works"
          align="center"
          title={
            <>
              Moving freight is easier <span className="text-brand-600">with FreightBridge.</span>
            </>
          }
          description="Four steps from first quote to proof of delivery — with a named logistics specialist on every one of them."
        />

        <div className="relative mt-16">
          {/* Connecting rail (desktop) */}
          <div className="pointer-events-none absolute inset-x-0 top-9 hidden lg:block" aria-hidden="true">
            <div className="mx-auto h-px w-[82%] bg-ink-100" />
            <motion.div
              className="mx-auto -mt-px h-px w-[82%] origin-left bg-gradient-to-r from-brand-500 via-brand-400 to-signal-400"
              initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={viewportOnce}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            />
          </div>

          <StaggerGroup className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6" gap={0.12}>
            {STEPS.map((step) => (
              <motion.div
                key={step.number}
                variants={motionSafe(reduced, fadeUp)}
                className="group relative flex flex-col items-start lg:items-center lg:text-center"
              >
                <span className="relative z-10 inline-flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-3xl border border-ink-100 bg-white text-ink-900 shadow-soft transition-all duration-400 ease-premium group-hover:-translate-y-1 group-hover:border-brand-200 group-hover:bg-brand-600 group-hover:text-white group-hover:shadow-glow">
                  <step.icon className="h-7 w-7" aria-hidden="true" />
                </span>

                <span className="mt-6 font-mono text-sm font-semibold tracking-[0.18em] text-brand-600">
                  {step.number}
                </span>
                <h3 className="mt-2 font-display text-xl font-semibold tracking-[-0.02em] text-ink-900">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-xs text-[0.95rem] leading-relaxed text-ink-500 lg:mx-auto">{step.copy}</p>
              </motion.div>
            ))}
          </StaggerGroup>
        </div>

        <div className="mt-14 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button href="/quote" size="lg" className="w-full sm:w-auto">
            Start with a quote
          </Button>
          <Button href="/contact" size="lg" variant="secondary" className="w-full sm:w-auto">
            Talk to a specialist
          </Button>
        </div>
      </div>
    </section>
  );
}
