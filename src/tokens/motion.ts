// Motion token system for BTL Design System
// Philosophy: "Figma-level" motion - functional with occasional delight

export const motion = {
  // ─────────────────────────────────────────────────
  // DURATION (in milliseconds for JS, exported as CSS vars too)
  // ─────────────────────────────────────────────────
  duration: {
    instant: 50, // Press feedback
    micro: 100, // Hover states, small changes
    swift: 150, // Quick transitions, block insert
    standard: 200, // Standard interactions
    entrance: 200, // Elements entering
    exit: 150, // Elements leaving (faster than entrance)
    emphasis: 300, // Drawing attention
  },

  // ─────────────────────────────────────────────────
  // EASING (CSS cubic-bezier values)
  // ─────────────────────────────────────────────────
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    entrance: 'cubic-bezier(0, 0, 0.2, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
    overshoot: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    snappy: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  },

  // ─────────────────────────────────────────────────
  // SPRING CONFIGS (for Framer Motion)
  // ─────────────────────────────────────────────────
  spring: {
    snappy: { type: 'spring' as const, stiffness: 400, damping: 30, mass: 1 },
    gentle: { type: 'spring' as const, stiffness: 200, damping: 20, mass: 1 },
    pop: { type: 'spring' as const, stiffness: 300, damping: 20, mass: 1 },
    shift: { type: 'spring' as const, stiffness: 250, damping: 25, mass: 1 },
  },

  // ─────────────────────────────────────────────────
  // COMPONENT-SPECIFIC PRESETS (for Framer Motion)
  // ─────────────────────────────────────────────────
  presets: {
    avatar: {
      hover: { y: -3, scale: 1.08 },
      tap: { scale: 0.95 },
      initial: { y: 0, scale: 1 },
    },
    avatarEnter: {
      initial: { opacity: 0, scale: 0.8, x: 20 },
      animate: { opacity: 1, scale: 1, x: 0 },
    },
    avatarExit: {
      exit: { opacity: 0, scale: 0.8 },
    },
    iconButton: {
      hover: { scale: 1.05 },
      tap: { scale: 0.92 },
    },
    userPill: {
      hover: { y: -2, scale: 1.02 },
      tap: { scale: 0.98 },
    },
    tooltip: {
      initial: { opacity: 0, y: 4, scale: 0.96 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: 2, scale: 0.98 },
    },
    dropdown: {
      initial: { opacity: 0, y: -8, scale: 0.96 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: -4, scale: 0.98 },
    },
  },
} as const;

// Type exports
export type MotionDuration = keyof typeof motion.duration;
export type MotionEasing = keyof typeof motion.easing;
export type MotionSpring = keyof typeof motion.spring;
export type MotionPreset = keyof typeof motion.presets;

// CSS custom properties string for injection
export const motionCSSVars = `
  --motion-duration-instant: 50ms;
  --motion-duration-micro: 100ms;
  --motion-duration-swift: 150ms;
  --motion-duration-standard: 200ms;
  --motion-duration-entrance: 200ms;
  --motion-duration-exit: 150ms;
  --motion-duration-emphasis: 300ms;

  --motion-ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --motion-ease-entrance: cubic-bezier(0, 0, 0.2, 1);
  --motion-ease-exit: cubic-bezier(0.4, 0, 1, 1);
  --motion-ease-overshoot: cubic-bezier(0.34, 1.56, 0.64, 1);
  --motion-ease-snappy: cubic-bezier(0.25, 0.1, 0.25, 1);
`;
