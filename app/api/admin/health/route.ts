import { NextResponse } from 'next/server';
import { adminAuth, adminConfigError } from '@/lib/firebase/admin';
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
 * Reports shapes, never values: booleans, lengths and the commit that is
 * actually live. No key material, no email addresses, nothing an attacker
 * gains from beyond "this deployment is misconfigured", which a 503 already
 * tells them. Safe to delete once sign-in is working.
 */
export async function GET() {
  const client = clientConfig();
  const rawKey = serviceAccountRaw();

  // Whether the Admin SDK can actually start is the question that matters, and
  // the only way to answer it honestly is to try.
  let adminStarts = false;
  try {
    adminStarts = adminAuth() !== null;
  } catch {
    adminStarts = false;
  }

  return NextResponse.json({
    // Which commit is serving this request. If it is not the newest SHA on the
    // branch, the deployment is stale — Vercel's "Redeploy" rebuilds the commit
    // that deployment was created from, not the latest one.
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? '(not on Vercel)',
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? '(unknown)',
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,

    clientConfig: {
      present: Boolean(client),
      projectId: client?.projectId ?? null,
    },

    serviceAccount: {
      present: Boolean(rawKey),
      length: rawKey?.length ?? 0,
      looksBase64: rawKey ? !rawKey.trim().startsWith('{') : false,
    },

    adminSdk: {
      starts: adminStarts,
      error: adminConfigError(),
    },

    adminEmails: {
      count: adminEmails().length,
    },

    authConfigured: isAuthConfigured(),
  });
}
