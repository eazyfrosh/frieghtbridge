import { NextResponse } from 'next/server';
import { adminEmails, clientConfig, isAuthConfigured, serviceAccountRaw } from '@/lib/firebase/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Deployment self-check for the admin stack.
 *
 * `npm run doctor` inspects a local checkout, which is no help when the thing
 * that is broken is a hosted deployment — its env, its build, its bundling.
 * This reports the same chain from inside the running server.
 *
 * Nothing here is imported statically from the Admin SDK, and that is the
 * whole point. If loading `firebase-admin` is what is broken, a static import
 * would take this route down with it and answer the question with the same
 * blank HTML 500 that prompted the question. Everything Firebase-shaped is
 * loaded inside a `try` and reported as a message instead.
 *
 * Reports shapes, never values: booleans, lengths and the commit that is
 * actually live. No key material, no email addresses, nothing an attacker
 * gains from beyond "this deployment is misconfigured", which a 503 already
 * tells them. Safe to delete once sign-in is working.
 */
export async function GET() {
  const report: Record<string, unknown> = {
    // Which commit is serving this request. If it is not the newest SHA on the
    // branch, the deployment is stale — a host's "redeploy" rebuilds the commit
    // that deployment was created from, not the latest one.
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? '(not on Vercel)',
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? '(unknown)',
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    node: process.version,
    // Whether this runtime lets CommonJS `require()` an ES module. Vercel's
    // has it off while a plain Node install of the same version has it on,
    // which is the whole reason `firebase-admin` failed there and nowhere
    // else. Worth reporting so the difference is never guessed at again.
    requireEsm: process.features.require_module ?? false,
  };

  try {
    const client = clientConfig();
    const rawKey = serviceAccountRaw();

    report.clientConfig = {
      present: Boolean(client),
      projectId: client?.projectId ?? null,
    };

    report.serviceAccount = {
      present: Boolean(rawKey),
      length: rawKey?.length ?? 0,
      looksBase64: rawKey ? !rawKey.trim().startsWith('{') : false,
    };

    report.adminEmails = { count: adminEmails().length };
    report.authConfigured = isAuthConfigured();
  } catch (error) {
    report.configError = error instanceof Error ? error.message : String(error);
  }

  // Step one: can the package be loaded at all? On a serverless host this is a
  // genuine failure mode, separate from having bad credentials — the build
  // succeeds and the function throws on first import.
  let sdkLoads = false;
  let loadError: string | null = null;
  try {
    await import('firebase-admin/app');
    await import('firebase-admin/auth');
    sdkLoads = true;
  } catch (error) {
    loadError = error instanceof Error ? error.message : String(error);
  }

  // Step two: given it loads, does it start with the credentials present?
  let starts = false;
  let startError: string | null = null;
  if (sdkLoads) {
    try {
      const { adminAuth, adminConfigError } = await import('@/lib/firebase/admin');
      starts = adminAuth() !== null;
      startError = adminConfigError();
    } catch (error) {
      startError = error instanceof Error ? error.message : String(error);
    }
  }

  report.adminSdk = { loads: sdkLoads, loadError, starts, startError };

  return NextResponse.json(report);
}
