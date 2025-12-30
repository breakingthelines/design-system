export const fontFamily = {
  display: '"Le Monde Journal Std", Georgia, serif', // Headlines
  body: '"Helvetica Neue", Helvetica, Arial, sans-serif', // UI text
  mono: '"JetBrains Mono", monospace', // Code (if needed)
} as const;

export const fontSize = {
  xs: '10px', // Badge text
  sm: '14px', // Body, buttons
  base: '18px', // Logo text
  lg: '20px', // Section headings
  xl: '32px', // Page titles
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  bold: 700,
} as const;

export const lineHeight = {
  tight: '18px',
  normal: '24px',
} as const;

export type Typography = {
  fontFamily: typeof fontFamily;
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
  lineHeight: typeof lineHeight;
};
