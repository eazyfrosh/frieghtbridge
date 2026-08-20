import type { Metadata } from 'next';
import { CircleDashed, Clock4, Headphones, PackageSearch, ShieldCheck, Truck } from 'lucide-react';
import { PageHero } from '@/components/PageHero';
import { TrackingWidget } from '@/components/TrackingWidget';
import { Button } from '@/components/ui/Button';
import { StaggerGroup, RevealItem } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { supportedCarriers } from '@/lib/multi-tracking';

export const metadata: Metadata = {
  title: 'Track a Shipment',
  description:
    'Track your FreightBridge Logistics shipment in real time. Enter your tracking number for live status, current location, timeline, and estimated delivery.',
  alternates: { canonical: '/tracking' },
};

const STATUS_GUIDE = [
  {
    icon: PackageSearch,
    title: 'Order Confirmed',
    body: 'Your booking is accepted and a pickup window has been scheduled with the origin terminal.',
  },
  {
    icon: Truck,
    title: 'Picked Up',
    body: 'Freight has been collected and scanned into the network. Piece counts are verified at this scan.',
  },
  {
    icon: CircleDashed,
    title: 'In Transit',
    body: 'Your shipment is moving between facilities. Each transfer adds a new scan to the timeline.',
  },
  {
    icon: Clock4,
    title: 'Out for Delivery',
    body: 'A final-mile driver has your freight and a delivery window has been sent to the recipient.',
  },
  {
    icon: ShieldCheck,
    title: 'Delivered',
    body: 'Proof of delivery — signature or photo — is captured and attached to the shipment record.',
  },
];

interface TrackingPageProps {
  searchParams: Promise<{ number?: string }>;
}

export default async function TrackingPage({ searchParams }: TrackingPageProps) {
  const params = await searchParams;
  const initialQuery = typeof params.number === 'string' ? params.number.slice(0, 32) : '';

  return (
    <>
      <PageHero
        eyebrow="Shipment tracking"
        breadcrumb="Tracking"
        overlap
        title={
          <>
            Know exactly where <span className="text-gradient">your freight is.</span>
          </>
        }
        description="Every pickup, transfer, and delivery scan lands in one live timeline — no phone calls, no chasing carriers."
      />

      <section className="relative z-10 -mt-24 sm:-mt-28">
        <div className="container">
          <TrackingWidget variant="floating" initialQuery={initialQuery} />
        </div>
      </section>

      <section className="section bg-surface">
        <div className="container">
          <SectionHeading
            eyebrow="Status guide"
            title="What each shipment status means"
            description="FreightBridge Logistics uses the same five milestones on every service, from a single parcel to a full container."
          />

          <StaggerGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" gap={0.07}>
            {STATUS_GUIDE.map((status, index) => (
              <RevealItem
                key={status.title}
                className="rounded-3xl border border-ink-100 bg-surface p-6 shadow-soft transition-[border-color,box-shadow,transform] duration-400 ease-premium hover:-translate-y-1 hover:border-brand-200 dark:hover:border-brand-500/30 hover:shadow-card"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-300">
                    <status.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-xs font-semibold text-ink-300">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-ink-900">{status.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-500">{status.body}</p>
              </RevealItem>
            ))}

            <RevealItem className="flex flex-col justify-between rounded-3xl border border-night-900 bg-night-950 p-6 text-white">
              <div>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-brand-300">
                  <Headphones className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-white">Something look wrong?</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-300">
                  If a scan is missing or a delivery window has moved, our team can pull the carrier record and get
                  you an answer.
                </p>
              </div>
              <div className="on-dark mt-6">
                <Button href="/contact" variant="onDark" size="md">
                  Contact support
                </Button>
              </div>
            </RevealItem>
          </StaggerGroup>

          <div className="mt-14 rounded-3xl border border-ink-100 bg-ink-50/60 p-6 sm:p-8">
            <h3 className="font-display text-lg font-semibold text-ink-900">Carriers we recognise</h3>
            <p className="mt-1.5 max-w-2xl text-[0.95rem] text-ink-500">
              Paste a tracking number from any of these and we identify the carrier from the number
              itself — no need to tell us who is carrying it.
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {supportedCarriers().map((carrier) => (
                <li
                  key={carrier.id}
                  className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-surface px-3.5 py-2 text-sm font-medium text-ink-700"
                >
                  <span
                    aria-hidden="true"
                    className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-md bg-ink-900 px-1.5 text-[0.6rem] font-bold text-surface"
                  >
                    {carrier.initials}
                  </span>
                  {carrier.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
