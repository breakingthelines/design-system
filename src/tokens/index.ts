export * from './colors';
export * from './typography';
export * from './spacing';

import { colors } from './colors';
import { fontFamily, fontSize, fontWeight, lineHeight } from './typography';
import { spacing, radius } from './spacing';

export const tokens = {
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  spacing,
  radius,
} as const;