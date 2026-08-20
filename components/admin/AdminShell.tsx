'use client';

import { LayoutDashboard, LogOut, Mail, Menu, MessageCircle, PackagePlus, Truck, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogoMark } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/shipments', label: 'Shipments', icon: Truck, exact: false },
  { href: '/admin/chat', label: 'Live chat', icon: MessageCircle, exact: false },
  { href: '/admin/book', label: 'Book shipment', icon: PackagePlus, exact: false },
  { href: '/admin/templates', label: 'Email templates', icon: Mail, exact: false },
];

interface AdminShellProps {
  email: string;
  children: ReactNode;
}

export function AdminShell({ email, children }: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Close the drawer whenever the route changes underneath it.
  useEffect(() => setOpen(false), [pathname]);

  async function signOut() {
    setSigningOut(true);
    // DELETE revokes the account's refresh tokens server-side as well as
    // clearing the cookie, so a copied session cookie stops working too.
    const response = await fetch('/api/admin/session', { method: 'DELETE' }).catch(() => null);

    if (!response?.ok) {
      // Never strand the operator looking signed in when they are not sure.
      // A hard reload re-runs the server-side session check either way.
      window.location.href = '/admin/login';
      return;
    }

    router.refresh();
    router.push('/admin/login');
  }

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const sidebar = (
    <div className="flex h-full flex-col">
      {/* Stacked rather than inline: the name and an "Ops" chip side by side no
          longer fit a 248px rail, and truncating the company name is worse than
          putting the qualifier on its own line. */}
      <div className="flex h-[68px] items-center gap-2.5 border-b border-night-800 px-5">
        <LogoMark />
        <span className="min-w-0">
          {/* 0.85rem, not 0.98: at the larger size the name overflowed the
              162px left after the mark and the rail's padding, and truncated
              to "FreightBridge Logi…". */}
          <span className="block truncate font-display text-[0.85rem] font-semibold leading-tight tracking-[-0.03em] text-white">
            FreightBridge Logistics
          </span>
          <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-400">
            Operations
          </span>
        </span>
      </div>

      <nav aria-label="Admin" className="flex-1 px-3 py-4">
        <ul className="flex flex-col gap-1">
          {NAV.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[0.94rem] font-medium transition-colors duration-200',
                    active ? 'bg-brand-500 text-night-950' : 'text-ink-300 hover:bg-night-800 hover:text-white',
                  )}
                >
                  <item.icon className="h-[1.1rem] w-[1.1rem]" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-night-800 p-3">
        <div className="flex items-center justify-between gap-2 px-2 pb-3">
          <span className="text-xs font-medium text-ink-400">Theme</span>
          {/* The rail is dark in both themes, so the control needs its own
              light-on-dark treatment rather than the page one. */}
          <ThemeToggle className="border-night-800" />
        </div>
        <p className="truncate px-2 pb-2 text-xs text-ink-500" title={email}>
          {email}
        </p>
        <button
          type="button"
          onClick={signOut}
          disabled={signingOut}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[0.94rem] font-medium text-ink-300 transition-colors duration-200 hover:bg-night-800 hover:text-white disabled:opacity-60"
        >
          <LogOut className="h-[1.1rem] w-[1.1rem]" aria-hidden="true" />
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-[248px] bg-night-950 lg:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 h-full w-full cursor-default bg-night-950/60"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[248px] bg-night-950">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 hover:bg-night-800 hover:text-white"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-40 flex h-[68px] items-center gap-3 border-b border-ink-200 bg-surface px-5 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-ink-200 text-ink-700"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="truncate font-display text-[1rem] font-semibold text-ink-900">
            FreightBridge Logistics
          </span>
        </header>

        <main className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
