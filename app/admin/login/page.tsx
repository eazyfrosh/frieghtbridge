import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { LoginForm } from '@/components/admin/LoginForm';
import { LogoMark } from '@/components/ui/Logo';

export const metadata: Metadata = {
  title: 'Admin sign-in',
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-950 px-5 py-16">
      <div className="w-full max-w-[26rem]">
        <div className="flex items-center gap-2.5">
          <LogoMark />
          <span>
            <span className="block font-display text-[1.1rem] font-semibold leading-tight tracking-[-0.03em] text-white">
              FreightBridge Logistics
            </span>
            <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ink-400">
              Operations
            </span>
          </span>
        </div>

        <h1 className="mt-8 font-display text-3xl font-semibold tracking-[-0.03em] text-white">Sign in</h1>
        <p className="mt-2 text-[0.95rem] text-ink-400">
          This area is for FreightBridge Logistics staff. Customer tracking is on the public site.
        </p>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>

        <p className="mt-8 text-center text-xs text-ink-500">
          <Link
            href="/"
            className="underline decoration-ink-600 underline-offset-4 transition-colors hover:text-ink-300"
          >
            Back to freightbridge.com
          </Link>
        </p>
      </div>
    </main>
  );
}
