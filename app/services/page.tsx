import type { Metadata } from 'next';
import { ArrowRight, Boxes, Check, Globe2, ShieldCheck, Warehouse } from 'lucide-react';
import { CTA } from '@/components/CTA';
import { HowItWorks } from '@/components/HowItWorks';
import { PageHero } from '@/components/PageHero';
import { Button } from '@/components/ui/Button';
import { Reveal, RevealItem, StaggerGroup } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { IMAGERY, SERVICES } from '@/lib/site';
import { Figure } from '@/components/ui/Figure';

export const metadata: Metadata = {
  title: 'Freight & Logistics Services',
  description:
    'Freight transportation, last-mile delivery, warehousing, freight forwarding, supply chain solutions and same-day delivery from FreightBridge.',
  alternates: { canonical: '/services' },
};

const INDUSTRIES = [
  {
    icon: Boxes,
    title: 'Retail & E-commerce',
    body: 'Fulfillment, returns, and last-mile delivery that absorbs seasonal spikes without renegotiating every lane.',
    points: ['Peak-season capacity', 'Branded delivery notifications', 'Returns consolidation'],
  },
  {
    icon: Warehouse,
    title: 'Manufacturing',
    body: 'Inbound materials and outbound finished goods on dependable schedules, with dock appointments held.',
    points: ['Inbound vendor management', 'Dedicated lanes', 'Flatbed & oversized freight'],
  },
  {
    icon: Globe2,
    title: 'Cross-Border Trade',
    body: 'Air and ocean forwarding with documentation prepared up front so shipments clear instead of waiting.',
    points: ['Customs documentation', 'FCL & LCL consolidation', 'Duty and tariff guidance'],
  },
  {
    icon: ShieldCheck,
    title: 'Enterprise Logistics',
    body: 'Managed transportation across multiple sites, with reporting your finance team will actually accept.',
    points: ['Carrier performance scoring', 'Spend analytics', 'Quarterly network reviews'],
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        breadcrumb="Services"
        title={
          <>
            Every mode, every mile, <span className="text-gradient">one partner.</span>
          </>
        }
        description="Parcel across town or a container across an ocean — FreightBridge coordinates the whole journey through a single account team and a single view."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href="/quote" size="lg" variant="onDark" className="w-full sm:w-auto">
            Get a quote
            <ArrowRight className="h-[1.05rem] w-[1.05rem] transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
          <Button href="/contact" size="lg" variant="outlineDark" className="w-full sm:w-auto">
            Talk to a specialist
          </Button>
        </div>
      </PageHero>

      {/* Service detail rows */}
      <section className="section bg-white">
        <div className="container">
          <SectionHeading
            eyebrow="What we move"
            title="Logistics solutions built around your business"
            description="Six core services, designed to be combined. Most customers start with one lane and grow into the network."
          />

          <div className="mt-14 divide-y divide-ink-100 border-y border-ink-100">
            {SERVICES.map((service, index) => (
              <Reveal key={service.slug} as="article">
                <div
                  id={service.slug}
                  className="group grid scroll-mt-32 gap-6 py-10 lg:grid-cols-[auto_1fr_auto] lg:items-start lg:gap-10 lg:py-12"
                >
                  <div className="flex items-center gap-4 lg:flex-col lg:items-start lg:gap-3">
                    <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-900 text-white transition-colors duration-400 ease-premium group-hover:bg-brand-600">
                      <service.icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <span className="font-mono text-xs font-semibold text-ink-300">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="max-w-2xl">
                    <h3 className="font-display text-2xl font-semibold tracking-[-0.025em] text-ink-900 sm:text-3xl">
                      {service.title}
                    </h3>
                    <p className="mt-2 text-lg font-medium text-ink-700">{service.tagline}</p>
                    <p className="mt-3 text-[0.98rem] leading-relaxed text-ink-500">{service.description}</p>

                    <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                      {service.highlights.map((highlight) => (
                        <li key={highlight} className="flex items-center gap-2 text-sm font-medium text-ink-600">
                          <Check className="h-4 w-4 text-brand-600" aria-hidden="true" />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button href="/quote" variant="secondary" size="md" className="shrink-0">
                    Quote this service
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </Button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section id="solutions" className="section scroll-mt-24 bg-ink-50/60">
        <div className="container">
          <SectionHeading
            eyebrow="Solutions by industry"
            title="Freight looks different in every business"
            description="The modes are the same. What changes is the timing, the paperwork, and what a bad week costs you."
          />

          <StaggerGroup className="mt-12 grid gap-5 lg:grid-cols-2" gap={0.08}>
            {INDUSTRIES.map((industry) => (
              <RevealItem
                key={industry.title}
                className="group rounded-3xl border border-ink-100 bg-white p-6 shadow-soft transition-[transform,border-color,box-shadow] duration-400 ease-premium hover:-translate-y-1 hover:border-brand-200 hover:shadow-card sm:p-8"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition-colors duration-400 group-hover:bg-brand-600 group-hover:text-white">
                  <industry.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-6 font-display text-xl font-semibold tracking-[-0.02em] text-ink-900">
                  {industry.title}
                </h3>
                <p className="mt-2.5 text-[0.95rem] leading-relaxed text-ink-500">{industry.body}</p>
                <ul className="mt-5 space-y-2">
                  {industry.points.map((point) => (
                    <li key={point} className="flex items-center gap-2 text-sm text-ink-600">
                      <span className="h-1 w-1 rounded-full bg-brand-500" aria-hidden="true" />
                      {point}
                    </li>
                  ))}
                </ul>
              </RevealItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* Warehousing visual */}
      <section className="section bg-white">
        <div className="container">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <div className="overflow-hidden rounded-4xl border border-ink-100 shadow-card">
                <Figure media={IMAGERY.warehouse} className="h-72 w-full object-cover sm:h-96" />
              </div>
            </Reveal>

            <div>
              <SectionHeading
                eyebrow="Warehousing & fulfillment"
                title="Storage that flexes with your season"
                description="Overflow space for a peak, or a permanent fulfillment base — with inventory counts your systems can read in real time."
              />
              <Reveal delay={0.16}>
                <ul className="mt-8 space-y-3">
                  {[
                    'Pick, pack and fulfillment with SLA-backed cutoffs',
                    'Cross-docking to skip storage entirely on fast lanes',
                    'Real-time inventory sync over API or scheduled export',
                    'Kitting, labelling and returns processing',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[0.98rem] text-ink-600">
                      <Check className="mt-0.5 h-[1.1rem] w-[1.1rem] shrink-0 text-brand-600" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={0.22}>
                <div className="mt-8">
                  <Button href="/contact" size="lg">
                    Discuss warehousing
                    <ArrowRight className="h-[1.05rem] w-[1.05rem] transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <HowItWorks />
      <CTA />
    </>
  );
}
