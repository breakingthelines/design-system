'use client';

import { motion } from 'framer-motion';

export interface BrokenLinesIconProps {
  /** Whether the icon is in "open" (X) state */
  open?: boolean;
  /** Size of the SVG viewbox. Defaults to 20. */
  size?: number;
  /** Additional CSS classes */
  className?: string;
}

const lineTransition = { type: 'spring' as const, stiffness: 300, damping: 22 };

/**
 * Animated hamburger icon with staggered "broken lines" that morph into an X.
 * A play on the "Breaking The Lines" brand name.
 *
 * The three lines are offset horizontally — top and bottom start at x=2,
 * middle starts at x=6 — creating the "broken" effect.
 */
function BrokenLinesIcon({ open = false, size = 20, className }: BrokenLinesIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      className={className}
      style={{ overflow: 'visible' }}
    >
      {/* Top line */}
      <motion.line
        x1="2"
        x2="14"
        y1="5.5"
        y2="5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        animate={
          open
            ? { x1: 4, x2: 16, y1: 4, y2: 16, opacity: 1 }
            : { x1: 2, x2: 14, y1: 5.5, y2: 5.5, opacity: 1 }
        }
        transition={lineTransition}
      />
      {/* Middle line — offset right, fades out on open */}
      <motion.line
        x1="6"
        x2="18"
        y1="10"
        y2="10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        animate={
          open ? { opacity: 0, x1: 10, x2: 10 } : { opacity: 1, x1: 6, x2: 18 }
        }
        transition={lineTransition}
      />
      {/* Bottom line */}
      <motion.line
        x1="2"
        x2="14"
        y1="14.5"
        y2="14.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        animate={
          open
            ? { x1: 4, x2: 16, y1: 16, y2: 4, opacity: 1 }
            : { x1: 2, x2: 14, y1: 14.5, y2: 14.5, opacity: 1 }
        }
        transition={lineTransition}
      />
    </svg>
  );
}

export { BrokenLinesIcon };
