'use client';

import { useReducedMotion as useFramerReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * Hydration-safe wrapper around Framer Motion's `useReducedMotion`.
 *
 * The server cannot know a visitor's motion preference, so the raw hook
 * returns `null` during SSR and the real value on the client. Any component
 * that varies its rendered output on that — picking different variants, a
 * different `initial`, or a different element entirely — emits markup on the
 * server that does not match the client and trips a hydration error, forcing
 * React to throw away and re-render the subtree.
 *
 * Reporting `false` until after mount keeps the first client render identical
 * to the server's. The real preference applies from the first effect onward,
 * which lands before any scroll-triggered animation can run.
 */
export function useReducedMotion(): boolean {
  const preference = useFramerReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return mounted ? Boolean(preference) : false;
}
