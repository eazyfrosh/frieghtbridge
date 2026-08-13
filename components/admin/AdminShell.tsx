'use client';

import { LayoutDashboard, LogOut, Menu, PackagePlus, Truck, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { LogoMark } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/shipments', label: 'Shipments', icon: Truck, exact: false },
  { href: '/admin/book', label: 'Book shipment', icon: PackagePlus, exact: false },
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
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
    router.refresh();
    router.push('/admin/login');
  }

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-[68px] items-center gap-2.5 border-b border-ink-800 px-5">
        <LogoMark />
        <span className="font-display text-[1.02rem] font-semibold tracking-[-0.02em] text-white">
          FreightBridge
        </span>
        <span className="rounded-md bg-ink-800 px-1.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-ink-300">
          Ops
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
                    active ? 'bg-brand-500 text-ink-950' : 'text-ink-300 hover:bg-ink-800 hover:text-white',
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

      <div className="border-t border-ink-800 p-3">
        <p className="truncate px-2 pb-2 text-xs text-ink-500" title={email}>
          {email}
        </p>
        <button
          type="button"
          onClick={signOut}
          disabled={signingOut}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[0.94rem] font-medium text-ink-300 transition-colors duration-200 hover:bg-ink-800 hover:text-white disabled:opacity-60"
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
      <aside className="fixed inset-y-0 left-0 hidden w-[248px] bg-ink-950 lg:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 h-full w-full cursor-default bg-ink-950/60"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[248px] bg-ink-950">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-800 hover:text-white"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-40 flex h-[68px] items-center gap-3 border-b border-ink-200 bg-white px-5 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-ink-200 text-ink-700"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="font-display text-[1rem] font-semibold text-ink-900">FreightBridge Ops</span>
        </header>

        <main className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
