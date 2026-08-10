'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronDown, Menu, Phone, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { NAV_ITEMS, SITE, type NavItem } from '@/lib/site';
import { cn } from '@/lib/utils';
import { Button } from './ui/Button';
import { Logo } from './ui/Logo';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduced = useReducedMotion();

  // Every route change should leave the visitor with a clean header. Menu links
  // call `closeAll` directly; this covers browser back/forward as well.
  // (Deliberately not `usePathname` — a navigation hook in a root-layout client
  // component trips an RSC manifest bug when Next prerenders /_not-found.)
  const closeAll = useCallback(() => {
    setMobileOpen(false);
    setOpenMenu(null);
    setMobileSection(null);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    window.addEventListener('popstate', closeAll);
    return () => window.removeEventListener('popstate', closeAll);
  }, [closeAll]);

  // Prevent the page behind the mobile sheet from scrolling.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpenMenu(null);
      setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const scheduleClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 140);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  return (
    <>
      {/* Positioned only on focus, so the hidden link can never sit over page
          content and swallow clicks. */}
      <a
        href="#main"
        className="sr-only rounded-full bg-ink-900 px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70]"
      >
        Skip to content
      </a>

      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,border-color,backdrop-filter] duration-500 ease-premium',
          scrolled
            ? 'border-b border-ink-100 bg-white/85 shadow-[0_1px_24px_-12px_rgba(11,21,36,0.4)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/70'
            : 'border-b border-transparent bg-transparent',
        )}
      >
        <div className="container">
          <div
            className={cn(
              'flex items-center justify-between gap-6 transition-[height] duration-500 ease-premium',
              scrolled ? 'h-[68px]' : 'h-[80px]',
            )}
          >
            <div className={scrolled ? '' : 'on-dark'}>
              <Logo tone={scrolled ? 'dark' : 'light'} onClick={closeAll} />
            </div>

            {/* Desktop navigation */}
            <nav aria-label="Main" className="hidden lg:block" onMouseLeave={scheduleClose}>
              <ul className="flex items-center gap-1">
                {NAV_ITEMS.map((item) => (
                  <DesktopNavItem
                    key={item.label}
                    item={item}
                    scrolled={scrolled}
                    open={openMenu === item.label}
                    reduced={Boolean(reduced)}
                    onOpen={() => {
                      cancelClose();
                      setOpenMenu(item.label);
                    }}
                    onToggle={() => setOpenMenu((current) => (current === item.label ? null : item.label))}
                    onClose={() => setOpenMenu(null)}
                  />
                ))}
              </ul>
            </nav>

            <div className="hidden items-center gap-2 lg:flex">
              <Link
                href="/contact"
                onClick={closeAll}
                className={cn(
                  'rounded-full px-4 py-2 text-[0.95rem] font-semibold transition-colors duration-300',
                  scrolled ? 'text-ink-700 hover:bg-ink-50 hover:text-ink-900' : 'text-white/90 hover:text-white',
                )}
              >
                Sign In
              </Link>
              <Button href="/quote" size="md" variant={scrolled ? 'primary' : 'onDark'}>
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Button>
            </div>

            {/* Mobile trigger */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              className={cn(
                'inline-flex h-11 w-11 items-center justify-center rounded-full border transition-colors duration-300 lg:hidden',
                scrolled
                  ? 'border-ink-200 bg-white text-ink-800 hover:bg-ink-50'
                  : 'border-white/25 bg-white/10 text-white backdrop-blur hover:bg-white/20',
              )}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile sheet */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-[60] lg:hidden"
            initial={reduced ? { opacity: 0 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 h-full w-full cursor-default bg-ink-950/50 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
              className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-white shadow-2xl"
              initial={reduced ? false : { x: '100%' }}
              animate={{ x: 0 }}
              exit={reduced ? undefined : { x: '100%' }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex h-[80px] items-center justify-between border-b border-ink-100 px-5">
                <Logo onClick={closeAll} />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink-200 text-ink-700 transition-colors hover:bg-ink-50"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 py-4">
                <ul className="flex flex-col">
                  {NAV_ITEMS.map((item) => {
                    const expanded = mobileSection === item.label;
                    if (!item.children) {
                      return (
                        <li key={item.label} className="border-b border-ink-100">
                          <Link
                            href={item.href}
                            onClick={closeAll}
                            className="flex items-center justify-between py-4 font-display text-lg font-semibold text-ink-900"
                          >
                            {item.label}
                            <ArrowRight className="h-4 w-4 text-ink-300" aria-hidden="true" />
                          </Link>
                        </li>
                      );
                    }
                    return (
                      <li key={item.label} className="border-b border-ink-100">
                        <button
                          type="button"
                          onClick={() => setMobileSection(expanded ? null : item.label)}
                          aria-expanded={expanded}
                          className="flex w-full items-center justify-between py-4 font-display text-lg font-semibold text-ink-900"
                        >
                          {item.label}
                          <ChevronDown
                            className={cn(
                              'h-[1.1rem] w-[1.1rem] text-ink-400 transition-transform duration-300',
                              expanded && 'rotate-180',
                            )}
                            aria-hidden="true"
                          />
                        </button>
                        <AnimatePresence initial={false}>
                          {expanded && (
                            <motion.ul
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                              className="overflow-hidden"
                            >
                              {item.children.map((child) => (
                                <li key={child.label}>
                                  <Link
                                    href={child.href}
                                    onClick={closeAll}
                                    className="flex items-start gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-ink-50"
                                  >
                                    {child.icon && (
                                      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                                        <child.icon className="h-4 w-4" aria-hidden="true" />
                                      </span>
                                    )}
                                    <span>
                                      <span className="block text-[0.95rem] font-semibold text-ink-800">
                                        {child.label}
                                      </span>
                                      {child.description && (
                                        <span className="block text-sm text-ink-400">{child.description}</span>
                                      )}
                                    </span>
                                  </Link>
                                </li>
                              ))}
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-6 flex flex-col gap-3">
                  <Button href="/quote" size="lg" fullWidth onClick={closeAll}>
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button href="/contact" size="lg" variant="secondary" fullWidth onClick={closeAll}>
                    Sign In
                  </Button>
                </div>

                <a
                  href={`tel:${SITE.phone.replace(/[^+\d]/g, '')}`}
                  className="mt-6 flex items-center gap-2 text-sm font-medium text-ink-500"
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {SITE.phone}
                </a>
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

interface DesktopNavItemProps {
  item: NavItem;
  scrolled: boolean;
  open: boolean;
  reduced: boolean;
  onOpen: () => void;
  onToggle: () => void;
  onClose: () => void;
}

function DesktopNavItem({ item, scrolled, open, reduced, onOpen, onToggle, onClose }: DesktopNavItemProps) {
  const linkClasses = cn(
    'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[0.95rem] font-medium transition-colors duration-300',
    scrolled ? 'text-ink-600 hover:bg-ink-50 hover:text-ink-900' : 'text-white/85 hover:bg-white/10 hover:text-white',
    open && (scrolled ? 'bg-ink-50 text-ink-900' : 'bg-white/10 text-white'),
  );

  if (!item.children) {
    return (
      <li>
        <Link href={item.href} className={linkClasses} onClick={onClose}>
          {item.label}
        </Link>
      </li>
    );
  }

  return (
    <li className="relative" onMouseEnter={onOpen}>
      <button
        type="button"
        className={linkClasses}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={onToggle}
        onFocus={onOpen}
      >
        {item.label}
        <ChevronDown
          className={cn('h-3.5 w-3.5 transition-transform duration-300', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.99 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-[calc(100%+14px)] z-50 w-[min(44rem,80vw)] -translate-x-1/2"
          >
            <div className="overflow-hidden rounded-3xl border border-ink-100 bg-white/95 p-2.5 shadow-lift backdrop-blur-xl">
              <div className={cn('grid gap-1', item.featured ? 'md:grid-cols-[1.35fr_1fr]' : 'md:grid-cols-2')}>
                <ul className={cn('grid gap-1', item.featured ? 'md:grid-cols-1' : 'md:grid-cols-2 md:col-span-2')}>
                  {item.children.map((child) => (
                    <li key={child.label}>
                      <Link
                        href={child.href}
                        onClick={onClose}
                        className="group/link flex items-start gap-3 rounded-2xl p-3 transition-colors duration-200 hover:bg-ink-50"
                      >
                        {child.icon && (
                          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors duration-200 group-hover/link:bg-brand-600 group-hover/link:text-white">
                            <child.icon className="h-[1.05rem] w-[1.05rem]" aria-hidden="true" />
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="flex items-center gap-1 text-[0.95rem] font-semibold text-ink-900">
                            {child.label}
                            <ArrowRight
                              className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all duration-200 group-hover/link:translate-x-0 group-hover/link:opacity-100"
                              aria-hidden="true"
                            />
                          </span>
                          {child.description && (
                            <span className="mt-0.5 block text-sm leading-snug text-ink-400">
                              {child.description}
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>

                {item.featured && (
                  <div className="relative overflow-hidden rounded-2xl bg-ink-900 p-5 text-white">
                    <div
                      className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-brand-500/40 blur-2xl"
                      aria-hidden="true"
                    />
                    <p className="font-display text-lg font-semibold leading-snug">{item.featured.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-ink-200">{item.featured.body}</p>
                    <Link
                      href={item.featured.href}
                      onClick={onClose}
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-300 transition-colors hover:text-white"
                    >
                      {item.featured.cta}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
