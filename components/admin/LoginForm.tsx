'use client';

import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { clientAuth } from '@/lib/firebase/client';

/** Only same-origin admin paths are honoured, so `?next=` cannot bounce elsewhere. */
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith('/admin') || raw.startsWith('//')) return '/admin';
  return raw;
}

/**
 * Firebase error codes are useful to us and useless — or worse, informative to
 * an attacker — to the visitor. Everything that means "those details are
 * wrong" collapses into one message so valid emails cannot be enumerated.
 */
function messageFor(code: string): string {
  switch (code) {
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a few minutes and try again.';
    case 'auth/user-disabled':
      return 'That account has been disabled.';
    case 'auth/network-request-failed':
      return 'Could not reach Firebase. Check your connection and try again.';
    default:
      return 'Those credentials were not recognised.';
  }
}

/**
 * Turn a failed exchange into something an operator can act on.
 *
 * Every branch of the route replies with JSON, so a response *without* a JSON
 * body did not come from the route at all — the function crashed before it ran,
 * or never deployed. Hosts announce that in the body (Vercel puts a code like
 * FUNCTION_INVOCATION_FAILED in its error page), and surfacing it is the
 * difference between a fixable report and "sign-in failed, try again".
 */
async function failureMessage(response: Response): Promise<string> {
  const text = await response.text().catch(() => '');

  try {
    const body = JSON.parse(text) as { error?: string };
    if (body.error) return body.error;
  } catch {
    // Not JSON — fall through and describe what actually came back.
  }

  const hostCode = text.match(/[A-Z][A-Z_]{10,}/)?.[0];
  if (hostCode) {
    return `The sign-in endpoint failed to run (${response.status} ${hostCode}). This is a deployment fault, not a wrong password — open /api/admin/health.`;
  }

  return `Sign-in endpoint returned ${response.status} with no error body. Open /api/admin/health to see how this deployment is configured.`;
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

    const auth = clientAuth();
    if (!auth) {
      setError('Firebase is not configured on this deployment.');
      setPending(false);
      return;
    }

    try {
      // Imported here rather than at module scope so the Firebase Auth chunk
      // is fetched when someone actually signs in, not on every page load.
      const { signInWithEmailAndPassword, signOut } = await import('firebase/auth');

      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await credential.user.getIdToken();

      const response = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      // The browser-side Firebase session is not what grants access — the
      // httpOnly cookie is. Drop it either way so a failed exchange does not
      // leave a half-signed-in client behind.
      await signOut(auth).catch(() => {});

      if (!response.ok) {
        setError(await failureMessage(response));
        setPending(false);
        return;
      }

      router.refresh();
      router.push(safeNext(params.get('next')));
    } catch (caught) {
      const code = typeof caught === 'object' && caught && 'code' in caught ? String(caught.code) : '';
      setError(messageFor(code));
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
