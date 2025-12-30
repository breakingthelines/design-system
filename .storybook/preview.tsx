import addonDocs from "@storybook/addon-docs";
import { definePreview } from '@storybook/react-vite'
import { withThemeByClassName } from '@storybook/addon-themes'
import addonA11y from '@storybook/addon-a11y'
import btlTheme from './btl-theme'
import '#/styles/globals.css'

export default definePreview({
  addons: [addonA11y(), addonDocs()],
  parameters: {
    layout: 'centered',
    docs: {
      theme: btlTheme,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
  },
  decorators: [
    withThemeByClassName({
      themes: {
        light: '',
        dark: 'dark',
      },
      defaultTheme: 'dark',
    }),
  ],
})
