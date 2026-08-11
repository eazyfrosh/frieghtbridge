import { CTA } from '@/components/CTA';
import { EnterpriseSection } from '@/components/EnterpriseSection';
import { GlobalNetwork } from '@/components/GlobalNetwork';
import { Hero } from '@/components/Hero';
import { HowItWorks } from '@/components/HowItWorks';
import { NetworkStory } from '@/components/NetworkStory';
import { Services } from '@/components/Services';
import { ShowcaseCarousel } from '@/components/ShowcaseCarousel';
import { TechnologySection } from '@/components/TechnologySection';
import { Testimonials } from '@/components/Testimonials';
import { TrackingWidget } from '@/components/TrackingWidget';
import { WhyFreightBridge } from '@/components/WhyFreightBridge';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* Tracking widget lifted over the hero's lower edge */}
      <section id="tracking" className="relative z-10 -mt-28 bg-transparent sm:-mt-32 lg:-mt-36">
        <div className="container">
          <TrackingWidget variant="floating" />
        </div>
      </section>

      <Services />
      <ShowcaseCarousel />
      <WhyFreightBridge />
      <HowItWorks />

      <NetworkStory />

      <GlobalNetwork />
      <EnterpriseSection />
      <TechnologySection />
      <Testimonials />

      {/* Secondary conversion strip */}
      <section className="bg-white pt-20 sm:pt-24">
        <div className="container">
          <Reveal>
            <div className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-ink-100 bg-ink-50/60 px-6 py-8 sm:flex-row sm:px-10">
              <div>
                <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-ink-900 sm:text-2xl">
                  Already shipping with us?
                </h2>
                <p className="mt-1.5 text-[0.95rem] text-ink-500">
                  Track a shipment or pick up where your last quote left off.
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Button href="/tracking" variant="secondary" size="lg" className="w-full sm:w-auto">
                  Track a shipment
                </Button>
                <Button href="/quote" size="lg" className="w-full sm:w-auto">
                  Get a quote
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <CTA />
    </>
  );
}
