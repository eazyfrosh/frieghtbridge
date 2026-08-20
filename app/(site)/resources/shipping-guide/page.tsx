import type { Metadata } from 'next';
import { ArrowRight, Boxes, FileText, Ruler, Scale, Thermometer, Truck } from 'lucide-react';
import { CTA } from '@/components/CTA';
import { PageHero } from '@/components/PageHero';
import { Button } from '@/components/ui/Button';
import { Reveal, RevealItem, StaggerGroup } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';

export const metadata: Metadata = {
  title: 'Shipping Guide',
  description:
    'A practical FreightBridge Logistics guide to choosing a shipment type, packaging freight, calculating weight and dimensions, and preparing shipping documentation.',
  alternates: { canonical: '/resources/shipping-guide' },
};

const MODES = [
  {
    icon: Boxes,
    name: 'Parcel',
    when: 'Single cartons under about 70 lb (32 kg).',
    detail: 'Fastest to book and cheapest for small, non-palletised goods travelling to a single address.',
  },
  {
    icon: Truck,
    name: 'Pallet & LTL',
    when: 'One to six pallets, or anything too heavy for parcel.',
    detail: 'Your freight shares a trailer with other shipments. Cost-effective, with one or two extra transfers.',
  },
  {
    icon: Scale,
    name: 'FTL',
    when: 'Roughly ten pallets or more, or high-value freight.',
    detail: 'The whole trailer is yours. Fewer handoffs means faster transit and a lower damage risk.',
  },
  {
    icon: Thermometer,
    name: 'Container',
    when: 'International ocean freight, FCL or LCL.',
    detail: 'A 20ft or 40ft container on a scheduled sailing, with customs handled before the box gates in.',
  },
];

const PACKING = [
  {
    title: 'Build the pallet properly',
    body: 'Keep cartons inside the pallet footprint, heaviest at the bottom, and stretch-wrap from the base up so the load and pallet move as one unit.',
  },
  {
    title: 'Label every piece',
    body: 'One label per carton, on the top and one side. If a shipment splits across a transfer, unlabelled pieces are the ones that go missing.',
  },
  {
    title: 'Measure after wrapping',
    body: 'Carriers bill on the wrapped, palletised dimensions — including any overhang. Measure the finished unit, not the cartons.',
  },
  {
    title: 'Declare the real weight',
    body: 'Reweighs are the most common source of an invoice that does not match the quote. Round up rather than guessing low.',
  },
];

const DOCUMENTS = [
  { title: 'Bill of Lading (BOL)', body: 'The contract of carriage and receipt. Issued at pickup for every road shipment.' },
  { title: 'Commercial invoice', body: 'Required for international freight. States value, commodity, and terms of sale.' },
  { title: 'Packing list', body: 'Piece counts, weights, and contents per carton — used at customs and at delivery.' },
  { title: 'Certificate of origin', body: 'Needed on many trade lanes to establish where the goods were manufactured.' },
];

export default function ShippingGuidePage() {
  return (
    <>
      <PageHero
        eyebrow="Resources"
        breadcrumb="Shipping guide"
        title={
          <>
            Ship it right the <span className="text-gradient">first time.</span>
          </>
        }
        description="Choosing a service, packing a pallet, measuring correctly, and preparing paperwork — the fundamentals that decide whether freight arrives on time and on budget."
      />

      {/* Choosing a mode */}
      <section className="section bg-white">
        <div className="container">
          <SectionHeading
            eyebrow="Step one"
            title="Choose the right shipment type"
            description="The cheapest option is rarely the smallest one. Match the service to the load and the deadline."
          />

          <StaggerGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" gap={0.07}>
            {MODES.map((mode) => (
              <RevealItem
                key={mode.name}
                className="group rounded-3xl border border-ink-100 bg-white p-6 shadow-soft transition-[transform,border-color,box-shadow] duration-400 ease-premium hover:-translate-y-1 hover:border-brand-200 hover:shadow-card"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-ink-900 text-white transition-colors duration-400 group-hover:bg-brand-600">
                  <mode.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-ink-900">{mode.name}</h3>
                <p className="mt-2 text-sm font-medium text-brand-700">{mode.when}</p>
                <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-500">{mode.detail}</p>
              </RevealItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* Packing */}
      <section className="section bg-ink-50/60">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <SectionHeading
                eyebrow="Step two"
                title="Pack and measure for the road"
                description="Most freight damage and most billing surprises trace back to the same two things: how the load was built, and how it was measured."
              />
              <Reveal delay={0.2}>
                <div className="mt-8 rounded-3xl border border-ink-100 bg-white p-6 shadow-soft">
                  <h3 className="flex items-center gap-2 font-display text-base font-semibold text-ink-900">
                    <Ruler className="h-4 w-4 text-brand-600" aria-hidden="true" />
                    Dimensional weight, quickly
                  </h3>
                  <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-500">
                    Carriers bill on whichever is greater: actual weight, or volume converted to weight. For imperial
                    parcel freight that conversion is length × width × height in inches, divided by 139.
                  </p>
                  <p className="mt-3 rounded-2xl bg-ink-50 p-3.5 font-mono text-sm text-ink-700">
                    48 × 40 × 52 in ÷ 139 ≈ 718 lb billable
                  </p>
                </div>
              </Reveal>
            </div>

            <StaggerGroup className="grid gap-4 sm:grid-cols-2" gap={0.08}>
              {PACKING.map((tip, index) => (
                <RevealItem key={tip.title} className="rounded-3xl border border-ink-100 bg-white p-6 shadow-soft">
                  <span className="font-mono text-xs font-semibold text-brand-700">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-3 font-display text-lg font-semibold text-ink-900">{tip.title}</h3>
                  <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-500">{tip.body}</p>
                </RevealItem>
              ))}
            </StaggerGroup>
          </div>
        </div>
      </section>

      {/* Documents */}
      <section className="section bg-white">
        <div className="container">
          <SectionHeading
            eyebrow="Step three"
            title="Get the paperwork ahead of the freight"
            description="Documents prepared before dispatch are the difference between a container that clears and a container that sits."
            actions={
              <Button href="/quote" size="lg">
                Start a shipment
                <ArrowRight className="h-[1.05rem] w-[1.05rem] transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            }
          />

          <StaggerGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" gap={0.07}>
            {DOCUMENTS.map((document) => (
              <RevealItem
                key={document.title}
                className="rounded-3xl border border-ink-100 bg-white p-6 shadow-soft transition-[transform,box-shadow] duration-400 ease-premium hover:-translate-y-1 hover:shadow-card"
              >
                <FileText className="h-5 w-5 text-brand-600" aria-hidden="true" />
                <h3 className="mt-5 font-display text-base font-semibold text-ink-900">{document.title}</h3>
                <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-500">{document.body}</p>
              </RevealItem>
            ))}
          </StaggerGroup>

          <Reveal delay={0.12}>
            <p className="mt-10 rounded-2xl border border-dashed border-ink-200 bg-ink-50/60 p-5 text-sm text-ink-500">
              This guide is general shipping guidance for the FreightBridge Logistics prototype and is not legal, customs, or
              tax advice. Requirements vary by lane, commodity, and country.
            </p>
          </Reveal>
        </div>
      </section>

      <CTA />
    </>
  );
}
