export * from './colors';
export * from './typography';
export * from './spacing';
export * from './motion';

import { colors } from './colors';
import { fontFamily, fontSize, fontWeight, lineHeight } from './typography';
import { spacing, radius } from './spacing';
import { motion } from './motion';

export const tokens = {
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  spacing,
  radius,
  motion,
} as const;
