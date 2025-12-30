import { defineMain } from '@storybook/react-vite/node'

export default defineMain({
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-themes',
  ],
  staticDirs: [{ from: '.', to: '/storybook' }],
  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },
})
