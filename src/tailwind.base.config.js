const path = require('path');
const plugin = require('tailwindcss/plugin');
const springPlugin = require('@ringcentral/spring-theme/tailwind');
const junoPlugin = require('../scripts/tailwind-plugins/juno/index.js');

// when we want add some global classes, we can add here
// https://transform.tools/css-to-js
const globalClasses = plugin(({ matchUtilities, theme, addBase }) => {
  addBase([
    {
      // TODO: spring-ui primary-text miss the full width, which will make the truncate not work
      '.sui-menu-item-text-primary-text': {
        width: '100%',
      },
    },
  ]);
  // for support grid auto-fit and auto-fill
  // https://github.com/tailwindlabs/tailwindcss/discussions/5541
  matchUtilities(
    {
      'auto-fill': (value) => ({
        gridTemplateColumns: `repeat(auto-fill, minmax(min(${value}, 100%), 1fr))`,
      }),
      'auto-fit': (value) => ({
        gridTemplateColumns: `repeat(auto-fit, minmax(min(${value}, 100%), 1fr))`,
      }),
    },
    {
      values: theme('width', {}),
    },
  );
});

const commonInclude =
  process.env.NODE_ENV === 'production'
    ? [
        path.join(__dirname, '../node_modules/@ringcentral-integration/**/*.{tsx,ts,jsx,js}'),
        path.join(__dirname, '../node_modules/@ringcentral/**/*.{tsx,ts,jsx,js}'),
      ]
    : /**å
       * in non production mode, we only watch one file in order to speed up the build process
       * !BUT, this will cause arbitrary values be broken, if you need that, please add the
       * arbitrary value into some file that you need in target project
       *
       * https://tailwindcss.com/docs/adding-custom-styles#using-arbitrary-values
       */

      [
        path.join(__dirname, '../scripts/tailwind-plugins/tailwind-all.md'),
        path.join(__dirname, '../scripts/tailwind-plugins/juno-tailwind-all.md'),
      ];

module.exports = ({ development = false, common = true } = {}) => {
  /** @type {import('tailwindcss').Config} */
  return {
    content: [
      // always include the spring-ui related components
      path.join(__dirname, '../node_modules/@ringcentral/spring-ui/**/*.js'),
      // only use real file in production mode, for better speed with
      ...(common ? commonInclude : []),
    ],
    theme: {
      extend: {
        fontFamily: {
          // we override the default font family here, when have use juno form in html that will be juno first, if not will be spring
          sans: [
            // juno default
            'Lato',
            // spring default
            'Inter',
            'Helvetica',
            'Arial',
            // fallback
            'sans-serif',
          ],
        },
      },
    },
    plugins: [
      globalClasses,
      springPlugin({
        development,
        // not override all default tailwind utils, prefix with `-sui-`
        override: false,
      }),
      junoPlugin({ development }),
    ],
  };
};
