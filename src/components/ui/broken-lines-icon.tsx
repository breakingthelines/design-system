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

function BrokenLinesIcon({ open = false, size = 20, className }: BrokenLinesIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={{ overflow: 'visible' }}
    >
      {/* Top bar — left half */}
      <motion.line
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={false}
        animate={
          open
            ? { x1: 5, x2: 12, y1: 5, y2: 12, opacity: 1 }
            : { x1: 4, x2: 11, y1: 6, y2: 6, opacity: 1 }
        }
        transition={lineTransition}
      />
      {/* Top bar — right half */}
      <motion.line
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={false}
        animate={
          open
            ? { x1: 12, x2: 19, y1: 12, y2: 19, opacity: 1 }
            : { x1: 13, x2: 20, y1: 6, y2: 6, opacity: 1 }
        }
        transition={lineTransition}
      />
      {/* Middle bar — left half */}
      <motion.line
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={false}
        animate={
          open
            ? { x1: 4, x2: 11, y1: 12, y2: 12, opacity: 0 }
            : { x1: 4, x2: 11, y1: 12, y2: 12, opacity: 1 }
        }
        transition={lineTransition}
      />
      {/* Middle bar — right half */}
      <motion.line
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={false}
        animate={
          open
            ? { x1: 13, x2: 20, y1: 12, y2: 12, opacity: 0 }
            : { x1: 13, x2: 20, y1: 12, y2: 12, opacity: 1 }
        }
        transition={lineTransition}
      />
      {/* Bottom bar — left half */}
      <motion.line
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={false}
        animate={
          open
            ? { x1: 5, x2: 12, y1: 19, y2: 12, opacity: 1 }
            : { x1: 4, x2: 11, y1: 18, y2: 18, opacity: 1 }
        }
        transition={lineTransition}
      />
      {/* Bottom bar — right half */}
      <motion.line
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={false}
        animate={
          open
            ? { x1: 12, x2: 19, y1: 12, y2: 5, opacity: 1 }
            : { x1: 13, x2: 20, y1: 18, y2: 18, opacity: 1 }
        }
        transition={lineTransition}
      />
    </svg>
  );
}

export { BrokenLinesIcon };
