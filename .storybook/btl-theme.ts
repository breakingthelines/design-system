import { create } from 'storybook/theming'
import { colors } from '#/tokens/colors.ts'
import { fontFamily } from '#/tokens/typography.ts'
import { radius } from '#/tokens/spacing.ts'

export default create({
  base: 'dark',

  // Brand
  brandTitle: 'Breaking The Lines',
  brandUrl: 'https://breakingthelines.com',
  brandImage: '/storybook/btl-logo.svg',
  brandTarget: '_self',

  // Colors
  colorPrimary: colors.red[100],
  colorSecondary: colors.red[300],

  // UI
  appBg: colors.black,
  appContentBg: colors.black,
  appPreviewBg: colors.black,
  appBorderColor: colors.grey[300],
  appBorderRadius: parseInt(radius.sm),

  // Typography
  fontBase: fontFamily.body,
  fontCode: fontFamily.mono,

  // Text colors
  textColor: colors.white,
  textInverseColor: colors.black,

  // Toolbar
  barTextColor: colors.muted,
  barSelectedColor: colors.white,
  barHoverColor: colors.white,
  barBg: colors.grey[100],

  // Form colors
  inputBg: colors.grey[100],
  inputBorder: colors.grey[300],
  inputTextColor: colors.white,
  inputBorderRadius: parseInt(radius.sm),
})
