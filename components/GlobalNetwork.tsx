'use client';

import { motion } from 'framer-motion';
import { Globe2, Plane, Ship, Truck } from 'lucide-react';
import { useState } from 'react';
import { EASE_PREMIUM, viewportOnce } from '@/lib/motion';
import { LANES, REGIONS } from '@/lib/site';
import { cn } from '@/lib/utils';
import { Reveal } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';
import { useReducedMotion } from '@/lib/use-reduced-motion';

const VIEW_W = 860;
const VIEW_H = 420;

const NODE_BY_CODE = Object.fromEntries(REGIONS.map((region) => [region.code, region]));

/** Quadratic arc between two nodes, bowed away from the map's centre line. */
function arcPath(from: { x: number; y: number }, to: { x: number; y: number }): string {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const lift = Math.min(distance * 0.28, 92);
  return `M ${from.x} ${from.y} Q ${midX} ${midY - lift} ${to.x} ${to.y}`;
}

/** Where a region's label sits relative to its node. */
const LABEL_OFFSET: Record<string, string> = {
  above: 'translate(-50%, -190%)',
  below: 'translate(-50%, 70%)',
  right: 'translate(18px, -50%)',
};

const MODES = [
  { icon: Truck, label: 'Road' },
  { icon: Ship, label: 'Ocean' },
  { icon: Plane, label: 'Air' },
];

export function GlobalNetwork() {
  const [hovered, setHovered] = useState<string | null>(null);
  const reduced = useReducedMotion();

  return (
    <section id="coverage" className="section relative overflow-hidden bg-white">
      <div className="container">
        <SectionHeading
          eyebrow="Global coverage"
          align="center"
          title={
            <>
              Connecting businesses to destinations <span className="text-brand-600">around the world.</span>
            </>
          }
          description="Regional depth where you ship most, and partner coverage everywhere else — coordinated through a single point of contact."
        />

        <Reveal delay={0.1} className="mt-14">
          <div className="relative overflow-hidden rounded-4xl border border-white/20 bg-brand-500 p-4 shadow-lift sm:p-6 lg:p-8">
            {/* Ambient field */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,#C24500_0%,transparent_62%)] opacity-70" />
              <div className="absolute inset-0 bg-grid-light bg-[size:44px_44px] opacity-40" />
            </div>

            <div className="relative">
              <div className="relative mx-auto w-full" style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}>
                <svg
                  viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                  className="absolute inset-0 h-full w-full"
                  role="img"
                  aria-label="Abstract network diagram connecting FreightBridge service regions: United States, Canada, United Kingdom, Europe, UAE, Nigeria and Ghana"
                >
                  <defs>
                    <linearGradient id="laneStroke" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.15" />
                      <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.85" />
                      <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.7" />
                    </linearGradient>
                    <radialGradient id="nodeGlow">
                      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                    </radialGradient>
                    <pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="1.5" fill="#FFFFFF" fillOpacity="0.32" />
                    </pattern>
                  </defs>

                  {/* Stylised landmass fields — abstract dot fields, not a map projection */}
                  <g opacity="0.75">
                    <ellipse cx="170" cy="180" rx="120" ry="86" fill="url(#dots)" />
                    <ellipse cx="212" cy="98" rx="96" ry="52" fill="url(#dots)" />
                    <ellipse cx="200" cy="316" rx="62" ry="72" fill="url(#dots)" />
                    <ellipse cx="482" cy="150" rx="96" ry="62" fill="url(#dots)" />
                    <ellipse cx="470" cy="300" rx="104" ry="84" fill="url(#dots)" />
                    <ellipse cx="672" cy="216" rx="118" ry="80" fill="url(#dots)" />
                    <ellipse cx="768" cy="344" rx="62" ry="44" fill="url(#dots)" />
                  </g>

                  {/* Meridian sweep for a globe-like read */}
                  <g stroke="#FFFFFF" strokeOpacity="0.16" fill="none">
                    <ellipse cx="430" cy="210" rx="410" ry="196" />
                    <ellipse cx="430" cy="210" rx="290" ry="196" />
                    <ellipse cx="430" cy="210" rx="150" ry="196" />
                    <path d="M20 210h820" />
                    <path d="M56 128h748" />
                    <path d="M56 292h748" />
                  </g>

                  {/* Lanes */}
                  {LANES.map(([fromCode, toCode], index) => {
                    const from = NODE_BY_CODE[fromCode];
                    const to = NODE_BY_CODE[toCode];
                    if (!from || !to) return null;
                    const d = arcPath(from, to);
                    const active = hovered === fromCode || hovered === toCode;

                    return (
                      <g key={`${fromCode}-${toCode}`}>
                        <path d={d} fill="none" stroke="#FFFFFF" strokeOpacity="0.16" strokeWidth="1.2" />
                        <motion.path
                          d={d}
                          fill="none"
                          stroke="url(#laneStroke)"
                          strokeWidth={active ? 2.6 : 1.6}
                          strokeLinecap="round"
                          initial={reduced ? { pathLength: 1, opacity: 0.8 } : { pathLength: 0, opacity: 0 }}
                          whileInView={{ pathLength: 1, opacity: active ? 1 : 0.75 }}
                          viewport={viewportOnce}
                          transition={{ duration: 1.5, ease: EASE_PREMIUM, delay: 0.15 + index * 0.12 }}
                        />
                        {!reduced && (
                          <circle r="3.4" fill="#FFFFFF">
                            <animateMotion
                              dur={`${7 + index}s`}
                              repeatCount="indefinite"
                              path={d}
                              begin={`${index * 0.8}s`}
                            />
                          </circle>
                        )}
                      </g>
                    );
                  })}

                  {/* Nodes */}
                  {REGIONS.map((region, index) => {
                    const active = hovered === region.code;
                    return (
                      <motion.g
                        key={region.code}
                        initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.6 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={viewportOnce}
                        transition={{ duration: 0.5, ease: EASE_PREMIUM, delay: 0.3 + index * 0.08 }}
                        style={{ transformOrigin: `${region.x}px ${region.y}px` }}
                      >
                        <circle cx={region.x} cy={region.y} r="34" fill="url(#nodeGlow)" opacity={active ? 1 : 0.6} />
                        {!reduced && (
                          <circle
                            cx={region.x}
                            cy={region.y}
                            r="10"
                            fill="none"
                            stroke="#FFFFFF"
                            strokeWidth="1.5"
                            className="animate-pulse-ring"
                            style={{ transformOrigin: `${region.x}px ${region.y}px`, animationDelay: `${index * 0.4}s` }}
                          />
                        )}
                        <circle cx={region.x} cy={region.y} r={active ? 8 : 6.5} fill="#FFFFFF" />
                        <circle cx={region.x} cy={region.y} r={active ? 4 : 3} fill="#FF8A22" />
                      </motion.g>
                    );
                  })}
                </svg>

                {/* Labels — hidden on small screens where the list below reads better */}
                <div className="pointer-events-none absolute inset-0 hidden md:block">
                  {REGIONS.map((region) => (
                    <span
                      key={region.code}
                      className={cn(
                        'pointer-events-auto absolute whitespace-nowrap rounded-full border px-2.5 py-1 text-[0.72rem] font-semibold backdrop-blur transition-colors duration-300 ease-premium',
                        hovered === region.code
                          ? 'border-white bg-white text-brand-800'
                          : 'border-white/40 bg-white/[0.16] text-white',
                      )}
                      style={{
                        left: `${(region.x / VIEW_W) * 100}%`,
                        top: `${(region.y / VIEW_H) * 100}%`,
                        transform: LABEL_OFFSET[region.anchor],
                      }}
                      onMouseEnter={() => setHovered(region.code)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      {region.name}
                      <span className="ml-1.5 font-mono text-[0.65rem] opacity-70">{region.hubs} hubs</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/25 pt-5">
                <ul className="flex flex-wrap gap-x-5 gap-y-2">
                  {MODES.map((mode) => (
                    <li key={mode.label} className="flex items-center gap-2 text-sm text-white">
                      <mode.icon className="h-4 w-4 text-white" aria-hidden="true" />
                      {mode.label}
                    </li>
                  ))}
                </ul>
                <p className="flex items-center gap-2 text-sm text-white">
                  <Globe2 className="h-4 w-4 text-white" aria-hidden="true" />
                  Stylised network view — regions shown are illustrative of our service coverage.
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Region list — the mobile-friendly version of the map */}
        <Reveal delay={0.16} from="right">
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {REGIONS.map((region) => (
              <li
                key={region.code}
                onMouseEnter={() => setHovered(region.code)}
                onMouseLeave={() => setHovered(null)}
                className={cn(
                  'flex items-center justify-between rounded-2xl border bg-white px-4 py-3.5 transition-all duration-300 ease-premium',
                  hovered === region.code
                    ? 'border-brand-300 shadow-soft'
                    : 'border-ink-100 hover:border-ink-200',
                )}
              >
                <span className="flex items-center gap-2.5">
                  <span className="inline-flex h-7 w-9 items-center justify-center rounded-md bg-ink-900 font-mono text-[0.68rem] font-semibold text-white">
                    {region.code}
                  </span>
                  <span className="text-[0.95rem] font-medium text-ink-800">{region.name}</span>
                </span>
                <span className="font-mono text-xs text-ink-400">{region.hubs} hubs</span>
              </li>
            ))}
            <li className="flex items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-ink-50/60 px-4 py-3.5 text-sm font-medium text-ink-500">
              + Partner coverage worldwide
            </li>
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
