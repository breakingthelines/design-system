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
  // TIER 3: CEREMONY (per ADR-013 — theatrical, the 1%)
  //
  // Reserved for genuine moments: the onboarding magazine
  // page-curl and the Issue #1 reveal. These can exceed the
  // everyday-UI limits (300-800ms). Everything else stays
  // Tier 1/2. Keep this set small on purpose.
  // ─────────────────────────────────────────────────
  ceremony: {
    // Staggered text/element reveal (e.g. a spread settling in
    // after a turn, or the Issue #1 standfirst arriving). The
    // values mirror ADR-013's reveal tokens.
    reveal: {
      stagger: 30, // ms between successive elements/characters
      duration: 400, // total reveal envelope
      delay: 80, // lead-in before the first element appears
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)', // expo-out — soft, decisive landing
    },

    // The paper page-curl turn (hero flips: reveal + opening an
    // issue). Single-quad fragment-shader curl driven by uProgress
    // 0→1. Duration sits in the theatrical band; the easing front-
    // loads the peel then eases the lay-down so paper "settles".
    pageCurl: {
      duration: 620, // a deliberate, felt turn (300-800ms band)
      easing: 'cubic-bezier(0.33, 0.0, 0.15, 1)', // quick lift, gentle settle
      radius: 0.18, // cylinder radius in normalised page units
      shadowStrength: 0.55, // 0..1 — depth of the curl's cast shadow
    },

    // The rigid rotateY turn used for fast multi-page skimming.
    // Cheaper, snappier — closer to a real page being flicked.
    pageSkim: {
      duration: 320,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },

    // Spring shapes (tension/friction/mass) describing the *feel* of each turn.
    // The page-flip engine animates by duration (`flippingTime`), so these are
    // retained as descriptive design tokens for any spring-driven ceremony work
    // (and historical parity): `turn` is the hero curl; `skim` the rigid flick;
    // `snap` the release-momentum settle; `coverOpen` the heaviest — the Issue #1
    // reveal swinging a near-180° magazine *cover* open on its spine (low
    // tension, heavy mass for a deliberate arc that lands without overshoot).
    spring: {
      turn: { tension: 210, friction: 28, mass: 1 },
      skim: { tension: 320, friction: 30, mass: 0.9 },
      snap: { tension: 260, friction: 24, mass: 0.8 },
      coverOpen: { tension: 120, friction: 30, mass: 1.8 },
    },
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
    contentCard: {
      hover: { y: -8, scale: 1.02 },
      tap: { scale: 0.98 },
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
    },
    heroCard: {
      hover: { scale: 1.008 },
      imageHover: { scale: 1.05 },
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
    },
    engagementAction: {
      hover: { scale: 1.15 },
      tap: { scale: 0.85 },
    },
  },
} as const;

// Type exports
export type MotionDuration = keyof typeof motion.duration;
export type MotionEasing = keyof typeof motion.easing;
export type MotionSpring = keyof typeof motion.spring;
export type MotionPreset = keyof typeof motion.presets;
export type MotionCeremony = keyof typeof motion.ceremony;
export type MotionCeremonySpring = keyof typeof motion.ceremony.spring;

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

  /* Tier 3: ceremony (page-flip + reveal) */
  --motion-duration-reveal: 400ms;
  --motion-duration-page-curl: 620ms;
  --motion-duration-page-skim: 320ms;
  --motion-ease-reveal: cubic-bezier(0.22, 1, 0.36, 1);
  --motion-ease-page-curl: cubic-bezier(0.33, 0, 0.15, 1);
  --motion-ease-page-skim: cubic-bezier(0.4, 0, 0.2, 1);
`;
