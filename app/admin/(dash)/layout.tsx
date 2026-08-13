import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

export const metadata: Metadata = {
  title: { default: 'Operations', template: '%s | FreightBridge Ops' },
  robots: { index: false, follow: false },
};

/**
 * Middleware already blocks unauthenticated requests to /admin. This second
 * check is not redundant: it is what guarantees the page cannot render without
 * a verified session if the matcher is ever changed or a route is added
 * outside it. Defence in depth, and it is also where the email comes from.
 */
export default async function AdminDashLayout({ children }: { children: ReactNode }) {
  const session = await verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) redirect('/admin/login');

  return <AdminShell email={session.email}>{children}</AdminShell>;
}
