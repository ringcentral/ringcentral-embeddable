import type { StorybookConfig } from '@storybook/react-webpack5';

import { join, dirname } from "path"

const previewCssPath = join(__dirname, 'preview.css');

function isCssRule(rule: any): boolean {
  return rule?.test instanceof RegExp && rule.test.test('preview.css');
}

function excludePreviewCss(rule: any): any {
  if (Array.isArray(rule?.oneOf)) {
    return {
      ...rule,
      oneOf: rule.oneOf.map(excludePreviewCss),
    };
  }
  if (!isCssRule(rule)) {
    return rule;
  }
  return {
    ...rule,
    exclude: [rule.exclude, previewCssPath].filter(Boolean),
  };
}

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
    if (config.module) {
      config.module.rules = (config.module.rules || []).map(excludePreviewCss);
      config.module.rules.push({
        test: /preview\.css$/,
        include: previewCssPath,
        use: [
          require.resolve('style-loader'),
          {
            loader: require.resolve('css-loader'),
            options: {
              importLoaders: 1,
            },
          },
          {
            loader: require.resolve('postcss-loader'),
            options: {
              postcssOptions: {
                plugins: [
                  require('tailwindcss'),
                  require('autoprefixer'),
                ],
              },
            },
          },
        ],
      });
    }

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
