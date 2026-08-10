import type { Transition, Variants } from 'framer-motion';

/**
 * Shared motion vocabulary. Every animated component pulls its variants from
 * here so timing/easing stay consistent, and every one of them is gated by
 * `useReducedMotion` at the call site.
 */

export const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;

export const transition: Transition = {
  duration: 0.6,
  ease: EASE_PREMIUM,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { ...transition, duration: 0.7 } },
};

export const staticVariants: Variants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1 },
};

export function stagger(staggerChildren = 0.09, delayChildren = 0): Variants {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren, delayChildren },
    },
  };
}

/** Standard viewport config: animate once, a little before fully in view. */
export const viewportOnce = { once: true, margin: '-80px 0px -80px 0px' } as const;

/** Picks the real variants or a no-op set depending on the motion preference. */
export function motionSafe(reduced: boolean | null, variants: Variants): Variants {
  return reduced ? staticVariants : variants;
}
