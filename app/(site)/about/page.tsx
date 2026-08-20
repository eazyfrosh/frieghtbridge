import type { Metadata } from 'next';
import { ArrowRight, Compass, Handshake, HeartHandshake, MapPin, Radar, Users } from 'lucide-react';
import { CTA } from '@/components/CTA';
import { EnterpriseSection } from '@/components/EnterpriseSection';
import { PageHero } from '@/components/PageHero';
import { Button } from '@/components/ui/Button';
import { IMAGERY } from '@/lib/site';
import { Figure } from '@/components/ui/Figure';
import { Reveal, RevealItem, StaggerGroup } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';

export const metadata: Metadata = {
  title: 'About FreightBridge Logistics',
  description:
    'FreightBridge Logistics is a modern freight transportation company helping businesses move shipments efficiently across cities, states, and international destinations.',
  alternates: { canonical: '/about' },
};

const VALUES = [
  {
    icon: Radar,
    title: 'Transparency by default',
    body: 'If we know something about your shipment, you know it too — including the parts that are going badly.',
  },
  {
    icon: Compass,
    title: 'Own the whole journey',
    body: 'Handoffs are where freight goes missing. We stay accountable across every leg, mode, and partner.',
  },
  {
    icon: HeartHandshake,
    title: 'Answer the phone',
    body: 'Software solves most of logistics. The rest needs a person who knows your account and picks up.',
  },
  {
    icon: Users,
    title: 'Build for the operator',
    body: 'Everything we ship is judged by whether it saves time for the person managing freight on a Tuesday.',
  },
];

const TIMELINE = [
  { year: '2019', title: 'Founded in Chicago', body: 'Two freight brokers and one engineer, working a handful of Midwest lanes.' },
  { year: '2021', title: 'Tracking console launched', body: 'The first version of the connected view our customers now run their day from.' },
  { year: '2023', title: 'Cross-border network', body: 'Forwarding, customs support, and partner coverage across Europe and the Gulf.' },
  { year: '2026', title: 'Five regions live', body: 'Road, ocean, and air coordinated through a single account team on every shipment.' },
];

const ROLES = [
  { title: 'Senior Logistics Specialist', location: 'Chicago, IL', type: 'Full-time' },
  { title: 'Carrier Operations Manager', location: 'Dallas, TX', type: 'Full-time' },
  { title: 'Frontend Engineer, Console', location: 'Remote (US / UK)', type: 'Full-time' },
  { title: 'Customs Documentation Analyst', location: 'Rotterdam, NL', type: 'Full-time' },
  { title: 'Last-Mile Dispatch Lead', location: 'London, UK', type: 'Full-time' },
];

const PARTNERS = [
  { title: 'Asset carriers', body: 'Vetted road carriers scored on on-time performance, claims, and communication.' },
  { title: 'Ocean & air partners', body: 'Allocation on the trade lanes our customers rely on most, with contracted space.' },
  { title: 'Warehouse operators', body: 'Fulfillment and cross-dock partners integrated into the same inventory view.' },
  { title: 'Technology', body: 'ERP, TMS, and marketplace integrations so freight data lands where your team already works.' },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Company"
        breadcrumb="About"
        title={
          <>
            We build the bridge between <span className="text-gradient">freight and the people moving it.</span>
          </>
        }
        description="FreightBridge Logistics started because moving goods should not require five phone calls to find out where a truck is. We are a logistics company with an engineering habit."
      />

      {/* Story */}
      <section className="section bg-surface">
        <div className="container">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <SectionHeading
                eyebrow="Our story"
                title="Logistics, rebuilt around visibility"
                description="We spent years on the operator's side of freight — chasing scans, rekeying paperwork, apologising for delays nobody warned us about. FreightBridge Logistics is the company we wanted to hire."
              />
              <Reveal delay={0.18}>
                <p className="mt-6 text-[0.98rem] leading-relaxed text-ink-500">
                  Today we move parcels, pallets, partial and full truckloads, and containers across five regions.
                  What has not changed is the operating principle: every shipment has a named owner, and every status
                  is visible without asking for it.
                </p>
              </Reveal>
              <Reveal delay={0.24}>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button href="/contact" size="lg">
                    Talk to our team
                    <ArrowRight className="h-[1.05rem] w-[1.05rem] transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                  <Button href="/services" variant="secondary" size="lg">
                    Explore services
                  </Button>
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.1}>
              <div className="overflow-hidden rounded-4xl border border-ink-100 shadow-card">
                <Figure media={IMAGERY.port} className="h-72 w-full object-cover sm:h-96" />
              </div>
            </Reveal>
          </div>

          {/* Timeline */}
          <StaggerGroup className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" gap={0.09}>
            {TIMELINE.map((entry) => (
              <RevealItem key={entry.year} className="relative border-t-2 border-ink-100 pt-6">
                <span className="absolute -top-[5px] left-0 h-2 w-2 rounded-full bg-brand-600" aria-hidden="true" />
                <p className="font-mono text-sm font-semibold text-brand-700 dark:text-brand-300">{entry.year}</p>
                <h3 className="mt-2 font-display text-lg font-semibold text-ink-900">{entry.title}</h3>
                <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-500">{entry.body}</p>
              </RevealItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* Values */}
      <section className="section bg-ink-50/60">
        <div className="container">
          <SectionHeading
            eyebrow="How we work"
            align="center"
            title="Four things we refuse to compromise on"
          />
          <StaggerGroup className="mt-12 grid gap-5 sm:grid-cols-2" gap={0.08}>
            {VALUES.map((value) => (
              <RevealItem
                key={value.title}
                className="rounded-3xl border border-ink-100 bg-surface p-6 shadow-soft transition-[transform,box-shadow] duration-400 ease-premium hover:-translate-y-1 hover:shadow-card sm:p-8"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-night-900 text-white">
                  <value.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-6 font-display text-xl font-semibold tracking-[-0.02em] text-ink-900">
                  {value.title}
                </h3>
                <p className="mt-2.5 text-[0.95rem] leading-relaxed text-ink-500">{value.body}</p>
              </RevealItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      <EnterpriseSection />

      {/* Careers */}
      <section id="careers" className="section scroll-mt-24 bg-surface">
        <div className="container">
          <SectionHeading
            eyebrow="Careers"
            title="Open roles across the network"
            description="We hire operators who like solving the messy parts of logistics, and engineers who want their work used on a loading dock."
            actions={
              <Button href="/contact" variant="secondary" size="lg">
                Send an open application
              </Button>
            }
          />

          <StaggerGroup className="mt-12 divide-y divide-ink-100 border-y border-ink-100" gap={0.06}>
            {ROLES.map((role) => (
              <RevealItem key={role.title}>
                <div className="group flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-ink-900">{role.title}</h3>
                    <p className="mt-1 flex items-center gap-2 text-sm text-ink-500">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      {role.location} · {role.type}
                    </p>
                  </div>
                  <Button href="/contact" variant="ghost" size="md" className="self-start sm:self-auto">
                    Apply
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </div>
              </RevealItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* Partners */}
      <section id="partners" className="section scroll-mt-24 bg-ink-50/60">
        <div className="container">
          <SectionHeading
            eyebrow="Partners"
            title="The network behind the network"
            description="FreightBridge Logistics is only as good as the operators we work with. Here is how we build that bench."
          />
          <StaggerGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" gap={0.07}>
            {PARTNERS.map((partner) => (
              <RevealItem
                key={partner.title}
                className="rounded-3xl border border-ink-100 bg-surface p-6 shadow-soft transition-[transform,border-color] duration-400 ease-premium hover:-translate-y-1 hover:border-brand-200 dark:hover:border-brand-500/30"
              >
                <Handshake className="h-5 w-5 text-brand-600 dark:text-brand-300" aria-hidden="true" />
                <h3 className="mt-5 font-display text-lg font-semibold text-ink-900">{partner.title}</h3>
                <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-500">{partner.body}</p>
              </RevealItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      <CTA />
    </>
  );
}
