'use client';

import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';

/** Only same-origin paths are honoured, so `?next=` cannot bounce elsewhere. */
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith('/admin') || raw.startsWith('//')) return '/admin';
  return raw;
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? 'Sign-in failed. Try again.');
        setPending(false);
        return;
      }

      // The session cookie is httpOnly, so the server has to re-render for the
      // new state to take effect — `refresh` before `push` avoids landing on a
      // cached signed-out shell.
      router.refresh();
      router.push(safeNext(params.get('next')));
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-ink-300">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1.5 h-12 w-full rounded-xl border border-ink-700 bg-ink-900 px-4 text-[0.95rem] text-white placeholder:text-ink-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          placeholder="ops@freightbridge.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-ink-300">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1.5 h-12 w-full rounded-xl border border-ink-700 bg-ink-900 px-4 text-[0.95rem] text-white placeholder:text-ink-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          placeholder="••••••••••••"
        />
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-rose-500/10 px-3.5 py-3 text-sm text-rose-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="group mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 text-[0.98rem] font-semibold text-ink-950 transition-all duration-300 ease-premium hover:bg-brand-400 disabled:cursor-progress disabled:opacity-70"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Signing in…
          </>
        ) : (
          <>
            Sign in
            <ArrowRight
              className="h-[1.05rem] w-[1.05rem] transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </>
        )}
      </button>
    </form>
  );
}
