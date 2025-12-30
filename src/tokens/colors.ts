export const colors = {
  // Backgrounds
  black: '#0d0d0d',
  grey: {
    100: '#1f1f1f',  // Card/button backgrounds
    200: '#1a1a1a',  // Slightly lighter
    300: '#2b2b2b',  // Borders
  },

  // Brand
  red: {
    100: '#eb0000',  // Borders, accents
    300: '#bf0000',  // Primary button fill
    500: '#990000',  // Hover state (derived)
  },

  // Accent (Editor badge)
  cyan: {
    100: 'rgba(0, 235, 235, 0.2)',  // Badge background
    500: '#00ebeb',                  // Solid accent
  },

  // Text
  white: '#ffffff',
  muted: 'rgba(255, 255, 255, 0.5)',

  // Surfaces
  overlay: 'rgba(255, 255, 255, 0.1)',  // Glass effects
  imagePlaceholder: 'rgba(217, 217, 217, 0.1)',
} as const;

export type Colors = typeof colors;