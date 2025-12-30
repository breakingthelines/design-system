export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
} as const;

export const radius = {
  none: '0px',
  sm: '2px',    // Buttons, inputs (Lyra sharp style)
  md: '12px',   // Cards, containers
  full: '16px', // Pills, badges
  round: '9999px', // Avatars
} as const;

export type Spacing = typeof spacing;
export type Radius = typeof radius;