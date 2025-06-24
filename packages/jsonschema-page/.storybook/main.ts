import type { StorybookConfig } from '@storybook/react-webpack5';

import { join, dirname } from "path"

/**
* This function is used to resolve the absolute path of a package.
* It is needed in projects that use Yarn PnP or are set up within a monorepo.
*/
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')))
}
const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    getAbsolutePath('@storybook/addon-webpack5-compiler-swc'),
    getAbsolutePath('@storybook/addon-docs'),
  ],
  "framework": {
    "name": getAbsolutePath('@storybook/react-webpack5'),
    "options": {}
  },
  webpackFinal: async (config: any) => {
    // Customize chunk naming to avoid problematic characters for GitHub Pages
    if (config.output) {
      // Set a simple, clean chunk filename pattern
      config.output.chunkFilename = '[name]-[contenthash].js';
    }

    // Customize optimization to generate cleaner chunk names
    if (config.optimization) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          stories: {
            test: /[\\/]src[\\/].*\.stories\./,
            name: 'stories',
            chunks: 'all',
          },
          docs: {
            test: /[\\/]src[\\/].*\.mdx/,
            name: 'docs',
            chunks: 'all',
          },
          default: {
            minChunks: 2,
            name: 'common',
            chunks: 'all',
          }
        }
      };
    }

    return config;
  }
};
export default config;