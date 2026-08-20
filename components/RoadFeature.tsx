'use client';

import { ArrowRight, BadgeCheck, Gauge, ShieldCheck } from 'lucide-react';
import { IMAGERY, ROAD_VIDEO } from '@/lib/site';
import { Button } from './ui/Button';
import { Reveal } from './ui/Reveal';
import { VideoFrame } from './ui/VideoFrame';

const STATS = [
  { icon: BadgeCheck, value: '100%', label: 'Deliveries signed for' },
  { icon: ShieldCheck, value: '98%', label: 'On-time delivery' },
  { icon: Gauge, value: '1,240', label: 'Routes running weekly' },
];

/**
 * The driver-network band, built around `ROAD_VIDEO`.
 *
 * Copy is written to the footage — a driver collecting a signature — rather
 * than to the section's original truck framing, and the poster is a frame
 * lifted from the same clip so the still and the video agree.
 */
export function RoadFeature() {
  return (
    <section id="on-the-road" className="section scroll-mt-24 bg-ink-50/60">
      <div className="container">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          {/* Media leads on desktop, follows the copy on mobile. */}
          <Reveal from="left" className="order-2 lg:order-1">
            <VideoFrame
              media={IMAGERY.driver}
              video={ROAD_VIDEO}
              heightClass="h-[280px] sm:h-[400px] lg:h-[500px]"
              sizes="(min-width: 1024px) 50vw, 100vw"
              scrim={false}
              className="border-ink-100"
            />
          </Reveal>

          <div className="order-1 lg:order-2">
            <Reveal from="right">
              <span className="eyebrow">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true" />
                Our driver network
              </span>
            </Reveal>

            <Reveal delay={0.06} from="right">
              <h2 className="display-2 mt-5">
                Every delivery has <span className="text-brand-600 dark:text-brand-300">a name on it.</span>
              </h2>
            </Reveal>

            <Reveal delay={0.12} from="right">
              <p className="lead mt-5 max-w-lg">
                Vetted drivers, scored route by route, with dispatch behind them. When your freight arrives, the
                person who handed it over is on the record — not a gap in the tracking.
              </p>
            </Reveal>

            <Reveal delay={0.18} from="right">
              <dl className="mt-10 grid gap-4 sm:grid-cols-3">
                {STATS.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-ink-100 bg-surface p-4 shadow-soft"
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300">
                      <stat.icon className="h-[1.05rem] w-[1.05rem]" aria-hidden="true" />
                    </span>
                    <dt className="sr-only">{stat.label}</dt>
                    <dd>
                      <span className="mt-3 block font-display text-[1.45rem] font-semibold leading-none text-ink-900">
                        {stat.value}
                      </span>
                      <span className="mt-1.5 block text-xs font-medium text-ink-500">{stat.label}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            <Reveal delay={0.24} from="right">
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Button href="/services#last-mile-delivery" size="lg" className="w-full sm:w-auto">
                  Explore last-mile delivery
                  <ArrowRight className="h-[1.05rem] w-[1.05rem] transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
                <Button href="/contact" size="lg" variant="secondary" className="w-full sm:w-auto">
                  Talk to dispatch
                </Button>
              </div>
            </Reveal>
          </div>
        </div>

        <Reveal delay={0.3}>
          <p className="mt-10 text-center text-xs text-ink-400">
            Figures shown are demonstration values for this website prototype.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
