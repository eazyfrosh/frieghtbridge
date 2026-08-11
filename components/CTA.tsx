'use client';

import { ArrowRight, MessageSquare } from 'lucide-react';
import { Button } from './ui/Button';
import { Reveal } from './ui/Reveal';

export function CTA() {
  return (
    <section className="relative overflow-hidden bg-white pb-24 pt-4 sm:pb-28">
      <div className="container">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-brand-500 px-6 py-16 text-center sm:px-12 sm:py-24 lg:py-28">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(70%_80%_at_50%_-10%,#9C3800_0%,transparent_60%),radial-gradient(50%_60%_at_85%_110%,#C24500_0%,transparent_60%)] opacity-55" />
              <div className="absolute inset-0 bg-grid-light bg-[size:52px_52px] opacity-30" />
              <div className="absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-white/20 blur-[100px]" />
            </div>

            <div className="on-dark relative mx-auto max-w-2xl">
              <span className="eyebrow-dark">
                <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
                Move Freight. Build Connections.
              </span>

              <h2 className="display-1 mt-7 text-white">
                Ready to move <span className="text-gradient">what matters?</span>
              </h2>

              <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-white sm:text-lg">
                Let&rsquo;s build a smarter way to move your freight.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button href="/quote" size="lg" variant="onDark" className="w-full sm:w-auto">
                  Get a Quote
                  <ArrowRight className="h-[1.05rem] w-[1.05rem] transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
                <Button href="/contact" size="lg" variant="outlineDark" className="w-full sm:w-auto">
                  <MessageSquare className="h-[1.05rem] w-[1.05rem]" />
                  Contact FreightBridge
                </Button>
              </div>

              <p className="mt-8 text-sm text-white">
                No obligation · Most quotes returned within one business hour
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
