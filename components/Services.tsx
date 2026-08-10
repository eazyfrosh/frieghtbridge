'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { fadeUp, motionSafe } from '@/lib/motion';
import { SERVICES } from '@/lib/site';
import { Button } from './ui/Button';
import { StaggerGroup } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';
import { useReducedMotion } from '@/lib/use-reduced-motion';

export function Services() {
  const reduced = useReducedMotion();

  return (
    <section id="services" className="section relative bg-white">
      <div className="container">
        <SectionHeading
          eyebrow="Services"
          title={
            <>
              Logistics solutions built <span className="text-brand-600">around your business</span>
            </>
          }
          description="One partner across every mode and every mile — from a single pallet across town to a container across an ocean."
          actions={
            <Button href="/services" variant="secondary" size="lg">
              Explore all services
              <ArrowUpRight className="h-[1.05rem] w-[1.05rem] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Button>
          }
        />

        <StaggerGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" gap={0.07}>
          {SERVICES.map((service, index) => (
            <motion.article
              key={service.slug}
              variants={motionSafe(reduced, fadeUp)}
              whileHover={reduced ? undefined : { y: -8 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              className="group relative overflow-hidden rounded-3xl border border-ink-100 bg-white p-6 shadow-soft transition-[border-color,box-shadow] duration-400 ease-premium hover:border-brand-200 hover:shadow-lift sm:p-7"
            >
              {/* Visual treatment: a soft freight-lane sweep that warms on hover */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-brand-100 to-brand-50 opacity-70 blur-2xl transition-all duration-500 ease-premium group-hover:-right-8 group-hover:-top-10 group-hover:from-brand-200 group-hover:opacity-90"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-400 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />

              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-900 text-white shadow-[0_10px_24px_-14px_rgba(18,18,18,0.9)] transition-colors duration-400 ease-premium group-hover:bg-brand-600">
                    <service.icon className="h-[1.35rem] w-[1.35rem]" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-xs font-semibold text-ink-300">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                <h3 className="mt-6 font-display text-xl font-semibold tracking-[-0.02em] text-ink-900">
                  {service.title}
                </h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-500">{service.tagline}</p>

                <ul className="mt-5 space-y-1.5">
                  {service.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-center gap-2 text-sm text-ink-500">
                      <span className="h-1 w-1 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                      {highlight}
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/services#${service.slug}`}
                  className="mt-auto inline-flex items-center gap-1.5 pt-6 text-[0.95rem] font-semibold text-ink-900 transition-colors duration-300 hover:text-brand-600 focus-visible:text-brand-600"
                >
                  <span className="relative">
                    Learn more
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-brand-500 transition-all duration-400 ease-premium group-hover:w-full"
                    />
                  </span>
                  <ArrowUpRight
                    className="h-4 w-4 transition-transform duration-300 ease-premium group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                  <span className="sr-only">about {service.title}</span>
                </Link>
              </div>
            </motion.article>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
