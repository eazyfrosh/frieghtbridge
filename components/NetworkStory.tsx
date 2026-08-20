'use client';

import { ArrowRight, Boxes, PackageCheck, Route } from 'lucide-react';
import { IMAGERY, STORY_VIDEO } from '@/lib/site';
import { Button } from './ui/Button';
import { Reveal } from './ui/Reveal';
import { VideoFrame } from './ui/VideoFrame';

const POINTS = [
  {
    icon: Route,
    title: 'One handoff, not five',
    body: 'Origin pickup, linehaul and final mile run on a single booking, so nothing gets dropped between carriers.',
  },
  {
    icon: Boxes,
    title: 'Scanned at every touch',
    body: 'Each transfer adds a timestamped scan, which is what makes the timeline on your dashboard trustworthy.',
  },
  {
    icon: PackageCheck,
    title: 'Proof at the doorstep',
    body: 'A photo or signature is captured on delivery and attached to the shipment record, so nobody has to take it on trust.',
  },
];

/**
 * "Inside the network" — the video feature that replaced the home page's quote
 * form. The quote path is preserved through the primary CTA here, and the full
 * form still lives at /quote.
 */
export function NetworkStory() {
  return (
    <section id="inside-the-network" className="section scroll-mt-24 bg-surface">
      <div className="container">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <div>
            <Reveal from="left">
              <span className="eyebrow">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true" />
                Inside the network
              </span>
            </Reveal>

            <Reveal delay={0.06} from="left">
              <h2 className="display-2 mt-5">
                See how your freight <span className="text-brand-600 dark:text-brand-300">actually moves.</span>
              </h2>
            </Reveal>

            <Reveal delay={0.12} from="left">
              <p className="lead mt-5 max-w-lg">
                From the loading dock to the doorstep — the journey your shipments make, and the people who
                complete it.
              </p>
            </Reveal>

            <Reveal delay={0.18} from="left">
              <ul className="mt-9 space-y-6">
                {POINTS.map((point) => (
                  <li key={point.title} className="flex gap-4">
                    <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-300">
                      <point.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block font-display text-[1.05rem] font-semibold text-ink-900">
                        {point.title}
                      </span>
                      <span className="mt-1 block text-[0.95rem] leading-relaxed text-ink-500">{point.body}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.24} from="left">
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Button href="/quote" size="lg" className="w-full sm:w-auto">
                  Get a quote
                  <ArrowRight className="h-[1.05rem] w-[1.05rem] transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
                <Button href="/contact" size="lg" variant="secondary" className="w-full sm:w-auto">
                  Talk to our team
                </Button>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.1} from="right">
            <VideoFrame
              media={IMAGERY.lastMile}
              video={STORY_VIDEO}
              heightClass="h-[280px] sm:h-[400px] lg:h-[520px]"
              sizes="(min-width: 1024px) 50vw, 100vw"
              scrim={false}
              className="border-ink-100"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
