'use client';

import { motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  Bell,
  CircleAlert,
  Clock4,
  LayoutDashboard,
  Map,
  Package,
  Search,
  Settings,
  TrendingUp,
  Truck,
} from 'lucide-react';
import { EASE_PREMIUM } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Reveal } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';
import { useReducedMotion } from '@/lib/use-reduced-motion';

const KPIS = [
  { label: 'Active shipments', value: '128', delta: '+12 this week', icon: Package, tone: 'brand' },
  { label: 'On-time delivery', value: '98%', delta: '+1.4% vs last month', icon: TrendingUp, tone: 'emerald' },
  { label: 'Open exceptions', value: '2', delta: '2 being worked', icon: CircleAlert, tone: 'rose' },
];

const SHIPMENTS = [
  { id: 'FBX-28473921', lane: 'Chicago → Dallas', status: 'In transit', progress: 62, eta: 'Tomorrow, 08:00' },
  { id: 'FBX-90112845', lane: 'Manchester → London', status: 'Out for delivery', progress: 88, eta: 'Today, 16:20' },
  { id: 'FBX-55620174', lane: 'Rotterdam → Madrid', status: 'Delivered', progress: 100, eta: 'Delivered 26h ago' },
  { id: 'FBX-73004466', lane: 'Jebel Ali → Rotterdam', status: 'Delayed', progress: 44, eta: 'Revised: in 6 days' },
];

const ACTIVITY = [
  { text: 'POD uploaded for FBX-55620174', time: '12 min ago', icon: Package },
  { text: 'Linehaul 214 departed Springfield, MO', time: '1 hour ago', icon: Truck },
  { text: 'Quote FBQ-448210 accepted', time: '3 hours ago', icon: BarChart3 },
  { text: 'New pickup scheduled — Newark, NJ', time: '5 hours ago', icon: Clock4 },
];

const STATUS_STYLES: Record<string, string> = {
  'In transit': 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 ring-brand-600/20',
  'Out for delivery': 'bg-brand-800 text-white ring-brand-900/30',
  Delivered: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-600/20',
  Delayed: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-rose-600/20',
};

const KPI_TONES: Record<string, string> = {
  brand: 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-300',
  emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300',
};

export function TechnologySection() {
  const reduced = useReducedMotion();

  return (
    <section id="technology" className="section relative overflow-hidden bg-ink-50/70">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(255,106,0,0.14)_0%,transparent_70%)]"
      />

      <div className="container relative">
        <SectionHeading
          eyebrow="Technology"
          align="center"
          title={
            <>
              Your freight. <span className="text-brand-600 dark:text-brand-300">One connected view.</span>
            </>
          }
          description="Quotes, bookings, live locations, documents, and exceptions in a single console — so nobody has to chase a status update again."
        />

        <Reveal delay={0.12} className="mt-14">
          <motion.div
            className="relative"
            animate={reduced ? undefined : { y: [0, -10, 0] }}
            transition={reduced ? undefined : { duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Floating callouts */}
            <FloatingBadge
              className="-left-8 -top-6 hidden xl:flex"
              delay={0.2}
              icon={Bell}
              title="Exception alert"
              body="Port congestion flagged"
              reduced={Boolean(reduced)}
            />
            <FloatingBadge
              className="-right-8 -bottom-6 hidden xl:flex"
              delay={0.45}
              icon={Map}
              title="Live location"
              body="Springfield, MO · 62%"
              reduced={Boolean(reduced)}
            />

            <div className="overflow-hidden rounded-4xl border border-ink-200/70 bg-surface shadow-lift">
              {/* Window chrome */}
              <div className="flex items-center gap-3 border-b border-ink-100 bg-ink-50/80 px-4 py-3 sm:px-5">
                <div className="flex gap-1.5" aria-hidden="true">
                  <span className="h-2.5 w-2.5 rounded-full bg-ink-200" />
                  <span className="h-2.5 w-2.5 rounded-full bg-ink-200" />
                  <span className="h-2.5 w-2.5 rounded-full bg-ink-200" />
                </div>
                <div className="ml-2 hidden items-center gap-2 rounded-lg bg-surface px-3 py-1.5 text-xs text-ink-400 ring-1 ring-ink-100 sm:flex">
                  <Search className="h-3 w-3" aria-hidden="true" />
                  console.freightbridge.com / shipments
                </div>
                <span className="ml-auto rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 text-[0.68rem] font-semibold text-emerald-700 dark:text-emerald-300">
                  Live
                </span>
              </div>

              <div className="grid lg:grid-cols-[64px_1fr]">
                {/* Rail */}
                <nav
                  aria-hidden="true"
                  className="hidden flex-col items-center gap-1 border-r border-ink-100 bg-surface py-5 lg:flex"
                >
                  {[LayoutDashboard, Package, Map, BarChart3, Settings].map((Icon, index) => (
                    <span
                      key={index}
                      className={cn(
                        'inline-flex h-10 w-10 items-center justify-center rounded-xl',
                        index === 1 ? 'bg-brand-600 text-white' : 'text-ink-300',
                      )}
                    >
                      <Icon className="h-[1.1rem] w-[1.1rem]" />
                    </span>
                  ))}
                </nav>

                <div className="p-4 sm:p-6">
                  {/* KPIs */}
                  <div className="grid gap-3 sm:grid-cols-3">
                    {KPIS.map((kpi) => (
                      <div key={kpi.label} className="rounded-2xl border border-ink-100 bg-surface p-4">
                        <div className="flex items-start justify-between">
                          <span
                            className={cn(
                              'inline-flex h-8 w-8 items-center justify-center rounded-lg',
                              KPI_TONES[kpi.tone],
                            )}
                          >
                            <kpi.icon className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <Sparkline tone={kpi.tone} />
                        </div>
                        <p className="mt-3 font-display text-2xl font-semibold tracking-[-0.03em] text-ink-900">
                          {kpi.value}
                        </p>
                        <p className="text-xs font-medium text-ink-500">{kpi.label}</p>
                        <p className="mt-1.5 text-[0.7rem] text-ink-400">{kpi.delta}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1.45fr_1fr]">
                    {/* Shipment list */}
                    <div className="rounded-2xl border border-ink-100 bg-surface">
                      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
                        <h3 className="text-sm font-semibold text-ink-900">Active shipments</h3>
                        <span className="text-[0.7rem] font-medium text-ink-400">Updated just now</span>
                      </div>
                      <ul className="divide-y divide-ink-100">
                        {SHIPMENTS.map((shipment, index) => (
                          <li key={shipment.id} className="px-4 py-3.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-mono text-[0.72rem] text-ink-400">{shipment.id}</p>
                                <p className="truncate text-[0.9rem] font-medium text-ink-900">{shipment.lane}</p>
                              </div>
                              <span
                                className={cn(
                                  'rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ring-1 ring-inset',
                                  STATUS_STYLES[shipment.status],
                                )}
                              >
                                {shipment.status}
                              </span>
                            </div>
                            <div className="mt-2.5 flex items-center gap-3">
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
                                <motion.div
                                  className={cn(
                                    'h-full rounded-full',
                                    shipment.status === 'Delayed'
                                      ? 'bg-rose-400'
                                      : shipment.status === 'Delivered'
                                        ? 'bg-emerald-500'
                                        : 'bg-brand-500',
                                  )}
                                  initial={reduced ? { width: `${shipment.progress}%` } : { width: 0 }}
                                  whileInView={{ width: `${shipment.progress}%` }}
                                  viewport={{ once: true }}
                                  transition={{ duration: 1, ease: EASE_PREMIUM, delay: 0.2 + index * 0.1 }}
                                />
                              </div>
                              <span className="shrink-0 text-[0.7rem] text-ink-400">{shipment.eta}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid gap-4">
                      {/* Locations */}
                      <div className="overflow-hidden rounded-2xl border border-ink-100 bg-night-950">
                        <div className="flex items-center justify-between px-4 py-3">
                          <h3 className="text-sm font-semibold text-white">Shipment locations</h3>
                          <span className="text-[0.68rem] font-medium text-ink-400">4 live</span>
                        </div>
                        <div className="relative h-32">
                          <div
                            aria-hidden="true"
                            className="absolute inset-0 bg-grid-dark bg-[size:22px_22px] opacity-50"
                          />
                          <svg viewBox="0 0 300 128" className="absolute inset-0 h-full w-full" aria-hidden="true">
                            <path
                              d="M24 96 Q 96 34 168 62 T 282 40"
                              fill="none"
                              stroke="#FA5B0A"
                              strokeWidth="2"
                              strokeDasharray="4 6"
                              strokeLinecap="round"
                              opacity="0.85"
                            />
                            <circle cx="24" cy="96" r="5" fill="#FFC5A3" />
                            <circle cx="168" cy="62" r="6" fill="#FFFFFF" />
                            <circle cx="282" cy="40" r="5" fill="#FFC5A3" />
                            {!reduced && (
                              <circle r="3.5" fill="#FFFFFF">
                                <animateMotion
                                  dur="6s"
                                  repeatCount="indefinite"
                                  path="M24 96 Q 96 34 168 62 T 282 40"
                                />
                              </circle>
                            )}
                          </svg>
                          <span className="absolute bottom-3 left-4 rounded-full bg-white/10 px-2 py-1 text-[0.65rem] font-medium text-ink-200 backdrop-blur">
                            Springfield, MO · ETA 08:00
                          </span>
                        </div>
                      </div>

                      {/* Activity */}
                      <div className="rounded-2xl border border-ink-100 bg-surface">
                        <div className="flex items-center gap-2 border-b border-ink-100 px-4 py-3">
                          <Activity className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
                          <h3 className="text-sm font-semibold text-ink-900">Recent activity</h3>
                        </div>
                        <ul className="divide-y divide-ink-100">
                          {ACTIVITY.map((item) => (
                            <li key={item.text} className="flex items-start gap-2.5 px-4 py-2.5">
                              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ink-50 text-ink-500">
                                <item.icon className="h-3 w-3" aria-hidden="true" />
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate text-[0.8rem] text-ink-700">{item.text}</span>
                                <span className="text-[0.68rem] text-ink-400">{item.time}</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Alert */}
                  <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50/70 dark:bg-rose-500/10 px-4 py-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300">
                      <CircleAlert className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <p className="text-[0.85rem] text-ink-700">
                      <span className="font-semibold text-ink-900">FBX-73004466</span> — vessel berthing delayed at
                      Algeciras. Revised arrival issued, account team notified.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mt-6 text-center text-xs text-ink-400">
            Illustrative product view built for this prototype.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function Sparkline({ tone }: { tone: string }) {
  const stroke = tone === 'emerald' ? '#059669' : tone === 'rose' ? '#E11D48' : '#D1450A';
  return (
    <svg viewBox="0 0 64 24" className="h-6 w-16" aria-hidden="true">
      <path
        d="M2 18 L12 14 L22 16 L32 8 L42 11 L52 5 L62 7"
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );
}

function FloatingBadge({
  className,
  delay,
  icon: Icon,
  title,
  body,
  reduced,
}: {
  className?: string;
  delay: number;
  icon: typeof Bell;
  title: string;
  body: string;
  reduced: boolean;
}) {
  return (
    <motion.div
      className={cn(
        'absolute z-10 items-start gap-3 rounded-2xl border border-ink-100 bg-white/95 px-4 py-3 shadow-lift backdrop-blur',
        className,
      )}
      initial={reduced ? undefined : { opacity: 0, y: 18 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: EASE_PREMIUM, delay }}
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-300">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-[0.82rem] font-semibold text-ink-900">{title}</span>
        <span className="block text-[0.75rem] text-ink-500">{body}</span>
      </span>
    </motion.div>
  );
}
