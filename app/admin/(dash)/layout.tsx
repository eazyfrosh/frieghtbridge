import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { getSession } from '@/lib/session';

// Admin output is per-operator and per-session. Never prerender or cache it.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { default: 'Operations', template: '%s | FreightBridge Ops' },
  robots: { index: false, follow: false },
};

/**
 * The authoritative auth check for the whole admin tree.
 *
 * Middleware can only see whether a cookie exists — the Firebase Admin SDK
 * does not run on the Edge runtime — so this is where the session cookie is
 * actually verified against Firebase, revocation included.
 */
export default async function AdminDashLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/admin/login');

  return <AdminShell email={session.email}>{children}</AdminShell>;
}
