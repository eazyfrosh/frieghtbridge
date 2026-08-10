import { Linkedin, Mail, MapPin, Phone, Twitter, Youtube } from 'lucide-react';
import Link from 'next/link';
import { FOOTER_COLUMNS, SITE } from '@/lib/site';
import { Logo } from './ui/Logo';

const SOCIALS = [
  { label: 'FreightBridge on LinkedIn', href: 'https://www.linkedin.com', icon: Linkedin },
  { label: 'FreightBridge on X', href: 'https://x.com', icon: Twitter },
  { label: 'FreightBridge on YouTube', href: 'https://www.youtube.com', icon: Youtube },
];

export function Footer() {
  return (
    <footer className="on-dark relative overflow-hidden bg-brand-700 text-white/80">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid-dark bg-[size:56px_56px] opacity-20" />
        <div className="absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-white/10 blur-[110px]" />
      </div>

      <div className="container relative">
        <div className="grid gap-12 py-16 lg:grid-cols-[1.35fr_2.65fr] lg:gap-16 lg:py-20">
          {/* Brand */}
          <div>
            <Logo tone="light" />
            <p className="mt-5 max-w-sm text-[0.95rem] leading-relaxed text-white/80">
              FreightBridge is a modern logistics and freight transportation company helping businesses move shipments
              efficiently across cities, states, and international destinations.
            </p>

            <ul className="mt-7 space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-signal-200" aria-hidden="true" />
                <span className="text-white/80">{SITE.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-signal-200" aria-hidden="true" />
                <a
                  href={`tel:${SITE.phone.replace(/[^+\d]/g, '')}`}
                  className="text-white/80 transition-colors hover:text-white"
                >
                  {SITE.phone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-signal-200" aria-hidden="true" />
                <a href={`mailto:${SITE.email}`} className="text-white/80 transition-colors hover:text-white">
                  {SITE.email}
                </a>
              </li>
            </ul>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {FOOTER_COLUMNS.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-white">
                  {column.title}
                </h2>
                <ul className="mt-5 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-[0.92rem] text-white/80 transition-colors duration-200 hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-start justify-between gap-6 border-t border-white/10 py-7 sm:flex-row sm:items-center">
          <p className="text-sm text-white/80">© 2026 FreightBridge. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <p className="hidden text-sm text-white/80 sm:block">{SITE.tagline}</p>
            <ul className="flex gap-2">
              {SOCIALS.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white/90 transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10 hover:text-white"
                  >
                    <social.icon className="h-[1.05rem] w-[1.05rem]" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
