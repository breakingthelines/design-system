export const colors = {
  // Backgrounds
  black: '#0d0d0d',
  grey: {
    100: '#1f1f1f', // Card/button backgrounds
    200: '#1a1a1a', // Slightly lighter
    300: '#2b2b2b', // Borders
  },

  // Brand
  red: {
    100: '#eb0000', // Borders, accents
    300: '#bf0000', // Primary button fill
    500: '#990000', // Hover state (derived)
  },

  // Accent (Editor badge)
  cyan: {
    100: 'rgba(0, 235, 235, 0.2)', // Badge background
    500: '#00ebeb', // Solid accent
  },

  // Text
  white: '#ffffff',
  muted: 'rgba(255, 255, 255, 0.5)',

  // Surfaces
  overlay: 'rgba(255, 255, 255, 0.1)', // Glass effects
  imagePlaceholder: 'rgba(217, 217, 217, 0.1)',
} as const;

export type Colors = typeof colors;

// ─────────────────────────────────────────────────
// CURSOR COLORS - For collaboration features
// Assigned per user to avoid collisions
// ─────────────────────────────────────────────────
export const cursorPalette = [
  { name: 'coral', hex: '#E57373' },
  { name: 'sky', hex: '#64B5F6' },
  { name: 'mint', hex: '#81C784' },
  { name: 'gold', hex: '#FFD54F' },
  { name: 'violet', hex: '#BA68C8' },
  { name: 'teal', hex: '#4DB6AC' },
  { name: 'peach', hex: '#FF8A65' },
  { name: 'lavender', hex: '#9575CD' },
] as const;

export type CursorColor = (typeof cursorPalette)[number]['name'];

/**
 * Get a cursor color deterministically from a user ID
 * Tries to avoid collisions with existing colors in view
 */
export function getCursorColor(userId: string, existingColors: Set<string> = new Set()): string {
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  let index = hash % cursorPalette.length;

  // Avoid collisions with existing users in view
  let attempts = 0;
  while (existingColors.has(cursorPalette[index].hex) && attempts < cursorPalette.length) {
    index = (index + 1) % cursorPalette.length;
    attempts++;
  }

  return cursorPalette[index].hex;
}

// ─────────────────────────────────────────────────
// ROLE COLORS - Semantic colors for squad roles
// ─────────────────────────────────────────────────
export const roleColors = {
  captain: { bg: 'rgba(235, 0, 0, 0.2)', text: '#FCA5A5' }, // red-300
  editor: { bg: 'rgba(0, 235, 235, 0.2)', text: '#00EBEB' }, // cyan-500
  viewer: { bg: 'rgba(255, 255, 255, 0.1)', text: 'rgba(255, 255, 255, 0.7)' },
  default: { bg: 'rgba(255, 255, 255, 0.1)', text: '#FFFFFF' },
} as const;

export type RoleType = keyof typeof roleColors;
