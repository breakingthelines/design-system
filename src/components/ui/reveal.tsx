'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { motion as motionTokens } from '#/tokens/motion';

/* ─────────────────────────────────────────────────────────────────────────────
 * Reveal — single-element fade + Y entrance animation.
 * ───────────────────────────────────────────────────────────────────────────── */

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
}

function Reveal({ children, className, delay = 0, y = 8, duration }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: duration ?? motionTokens.duration.entrance / 1000,
        ease: [0, 0, 0.2, 1], // motionTokens.easing.entrance
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * RevealGroup — staggered list container.
 *
 * Children using RevealItem get orchestrated entrance timing.
 * ───────────────────────────────────────────────────────────────────────────── */

interface RevealGroupProps {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
}

function RevealGroup({ children, className, stagger = 0.05, delay = 0.1 }: RevealGroupProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: stagger,
            delayChildren: delay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * RevealItem — child of RevealGroup, uses named variants.
 * ───────────────────────────────────────────────────────────────────────────── */

interface RevealItemProps {
  children: React.ReactNode;
  className?: string;
  y?: number;
}

function RevealItem({ children, className, y = 12 }: RevealItemProps) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.3,
            ease: [0, 0, 0.2, 1], // motionTokens.easing.entrance
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * LoadingTransition — skeleton→content crossfade.
 *
 * Skeleton fades out fast (150ms), content fades in (200ms).
 * Asymmetric timing keeps it feeling snappy.
 * ───────────────────────────────────────────────────────────────────────────── */

interface LoadingTransitionProps {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function LoadingTransition({ isLoading, skeleton, children, className }: LoadingTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="skeleton"
          className={className}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: [0.4, 0, 1, 1] }}
        >
          {skeleton}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          className={className}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { Reveal, RevealGroup, RevealItem, LoadingTransition };
export type { RevealProps, RevealGroupProps, RevealItemProps, LoadingTransitionProps };
