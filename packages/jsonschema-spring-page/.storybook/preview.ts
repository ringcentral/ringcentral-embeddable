import React from 'react';
import type { Preview } from '@storybook/react-webpack5';
import { suiLight, ThemeProvider } from '@ringcentral/spring-theme';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@ringcentral/spring-ui/index.css';
import './preview.css';

const preview: Preview = {
  decorators: [
    (Story) =>
      React.createElement(
        ThemeProvider,
        { theme: suiLight },
        React.createElement(Story),
      ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
