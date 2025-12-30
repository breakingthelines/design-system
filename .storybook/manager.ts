import { addons } from 'storybook/manager-api'
import btlTheme from './btl-theme'

addons.setConfig({
  theme: btlTheme,
  enableShortcuts: true,
  showToolbar: true,
  sidebar: {
    showRoots: true,
  },
  // Disable onboarding and announcements
  disableWhatsNewNotifications: true,
})
