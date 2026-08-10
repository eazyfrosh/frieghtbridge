'use client';

import { motion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';
import { fadeUp, motionSafe, stagger, viewportOnce } from '@/lib/motion';
import { useReducedMotion } from '@/lib/use-reduced-motion';

/**
 * Tags a reveal can render as. Kept as a static map so the motion component
 * identity is stable across renders (calling `motion(tag)` inline would remount
 * the subtree on every render).
 */
const MOTION_TAGS = {
  div: motion.div,
  section: motion.section,
  span: motion.span,
  li: motion.li,
  ul: motion.ul,
  p: motion.p,
  h2: motion.h2,
  h3: motion.h3,
  article: motion.article,
  header: motion.header,
} as const;

export type RevealTag = keyof typeof MOTION_TAGS;

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Seconds to wait before the element animates in. */
  delay?: number;
  as?: RevealTag;
  variants?: Variants;
}

/**
 * Scroll-triggered entrance wrapper. Animates once, and collapses to a no-op
 * when the visitor prefers reduced motion.
 */
export function Reveal({ children, className, delay = 0, as = 'div', variants = fadeUp }: RevealProps) {
  const reduced = useReducedMotion();
  const Component = MOTION_TAGS[as];

  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={motionSafe(reduced, variants)}
      transition={reduced ? undefined : { delay }}
    >
      {children}
    </Component>
  );
}

interface StaggerProps {
  children: ReactNode;
  className?: string;
  gap?: number;
  delay?: number;
  as?: RevealTag;
}

/** Parent wrapper that staggers any `RevealItem` children beneath it. */
export function StaggerGroup({ children, className, gap = 0.09, delay = 0, as = 'div' }: StaggerProps) {
  const reduced = useReducedMotion();
  const Component = MOTION_TAGS[as];

  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={reduced ? undefined : stagger(gap, delay)}
    >
      {children}
    </Component>
  );
}

interface ItemProps {
  children: ReactNode;
  className?: string;
  as?: RevealTag;
  variants?: Variants;
}

export function RevealItem({ children, className, as = 'div', variants = fadeUp }: ItemProps) {
  const reduced = useReducedMotion();
  const Component = MOTION_TAGS[as];

  return (
    <Component className={className} variants={motionSafe(reduced, variants)}>
      {children}
    </Component>
  );
}
