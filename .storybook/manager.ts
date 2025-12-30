import { addons } from 'storybook/manager-api';
import btlTheme from './btl-theme';

addons.setConfig({
  theme: btlTheme,
  sidebar: {
    showRoots: true,
  },
});
