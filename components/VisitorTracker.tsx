'use client';

import { useEffect } from 'react';
import { ignoredVisitorPage, VISITOR_TTL } from '@/lib/visitor';

const STORAGE_KEY = 'fb-visitor-session';
let attemptedUntil = 0;

export function VisitorTracker() {
  useEffect(() => {
    const page = window.location.pathname;
    let referrer = '';
    try { referrer = document.referrer ? new URL(document.referrer).origin : ''; } catch { /* unknown source */ }
    if (ignoredVisitorPage(page) || navigator.webdriver) return;
    function track() {
      try {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (attemptedUntil > now) return;
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        if (stored && typeof stored.expiresAt === 'number' && stored.expiresAt > now && stored.expiresAt <= now + VISITOR_TTL) return;
      } catch { /* Private mode or blocked storage: server cookie remains a fallback. */ }
      const visitorId = crypto.randomUUID();
      attemptedUntil = now + VISITOR_TTL;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ visitorId, expiresAt: attemptedUntil })); } catch { /* optional */ }
      // Fire and forget from the visitor's perspective; the server awaits the email.
      // A failed attempt stays suppressed for the session to avoid retry storms.
      void fetch('/api/visitor', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin', keepalive: true,
        body: JSON.stringify({ visitorId, page, referrer }),
      }).catch(() => {});
      } catch { /* Optional analytics must never affect the page, even in restricted browsers. */ }
    }
    // Run after first paint, without blocking navigation or rendering.
    const timer = window.setTimeout(track, 2000);
    document.addEventListener('visibilitychange', track);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', track);
    };
  }, []);
  return null;
}
