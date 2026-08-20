import type { Metadata } from 'next';
import { Accordion, type AccordionItem } from '@/components/Accordion';
import { CTA } from '@/components/CTA';
import { PageHero } from '@/components/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';

export const metadata: Metadata = {
  title: 'Freight & Shipping FAQ',
  description:
    'Answers to common questions about FreightBridge Logistics quoting, tracking, transit times, freight classes, customs documentation, claims and support.',
  alternates: { canonical: '/resources/faq' },
};

const GROUPS: Array<{ title: string; items: AccordionItem[] }> = [
  {
    title: 'Quoting & booking',
    items: [
      {
        question: 'How quickly will I get a quote?',
        answer:
          'Most quotes are returned within one business hour during operating windows. Complex international moves that need customs review can take longer, and we will tell you up front if yours is one of them.',
      },
      {
        question: 'What information do you need to quote a shipment?',
        answer:
          'Origin and destination (city plus ZIP or postal code), shipment type, total weight, rough dimensions, and your ideal pickup date. Anything else — accessorials, liftgate needs, appointment windows — we will ask about before confirming.',
      },
      {
        question: 'Does the quoted price change?',
        answer:
          'Rates are honoured for the window we quote them in. Price changes after booking only happen when the shipment itself changes — extra weight, a reclassified commodity, or a service the original quote did not include.',
      },
      {
        question: 'Is there a minimum shipment size?',
        answer:
          'No. FreightBridge Logistics handles single parcels through to full container loads. Smaller shipments usually move as LTL or parcel; we will recommend whichever is cheaper for the same transit time.',
      },
    ],
  },
  {
    title: 'Tracking & transit',
    items: [
      {
        question: 'Where do I find my tracking number?',
        answer:
          'It is on your booking confirmation and every document we send for the shipment. FreightBridge Logistics tracking numbers look like FBX-28473921 — the letters FBX followed by eight digits.',
      },
      {
        question: 'How often does tracking update?',
        answer:
          'Every scan updates the timeline immediately: pickup, each facility transfer, out for delivery, and proof of delivery. On road freight you will typically see two to four scans per day in transit.',
      },
      {
        question: 'What happens if my shipment is delayed?',
        answer:
          'An exception is raised on the shipment and your account team is notified before you have to ask. You will see a revised estimate on the timeline along with the reason for the delay.',
      },
      {
        question: 'What are typical transit times?',
        answer:
          'Domestic LTL averages two to four days depending on lane length. Same-day and expedited services run point-to-point. Ocean forwarding depends on the sailing schedule, which we confirm at booking rather than estimating.',
      },
    ],
  },
  {
    title: 'International & documentation',
    items: [
      {
        question: 'Do you handle customs paperwork?',
        answer:
          'Yes. Commercial invoices, packing lists, certificates of origin, and entry documentation are prepared before the shipment moves, which is the single biggest factor in whether freight clears or waits.',
      },
      {
        question: 'Which regions do you serve?',
        answer:
          'We operate directly across the United States, Canada, the United Kingdom, Europe, and the UAE, with partner coverage beyond those regions. Coverage depth varies by mode — ask us about a specific lane.',
      },
      {
        question: 'Who pays duties and taxes?',
        answer:
          'That depends on the Incoterms agreed with your buyer or supplier. We will confirm the term on every international booking and flag anything that looks inconsistent with how the shipment is being invoiced.',
      },
    ],
  },
  {
    title: 'Claims & support',
    items: [
      {
        question: 'How do I file a claim for damaged freight?',
        answer:
          'Note the damage on the delivery receipt at the time of delivery, photograph it, and contact your account team. Documenting at delivery is what makes a claim straightforward rather than contested.',
      },
      {
        question: 'Is my freight insured?',
        answer:
          'Carrier liability applies by default and is limited by weight and commodity class. Full-value cargo insurance is available on request and is worth quoting whenever the replacement cost exceeds carrier limits.',
      },
      {
        question: 'Can I talk to a person?',
        answer:
          'Always. Every account has a named logistics specialist, and dispatch is staffed around the clock for shipments already in motion.',
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <PageHero
        eyebrow="Resources"
        breadcrumb="FAQ"
        title={
          <>
            Questions shippers <span className="text-gradient">actually ask.</span>
          </>
        }
        description="Straight answers on quoting, tracking, transit times, customs, and what happens when something goes wrong."
      />

      <section className="section bg-white">
        <div className="container">
          <div className="mx-auto max-w-3xl space-y-16">
            {GROUPS.map((group) => (
              <div key={group.title}>
                <SectionHeading title={group.title} className="mb-8" />
                <Reveal delay={0.06}>
                  <Accordion items={group.items} />
                </Reveal>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTA />
    </>
  );
}
