const path = require('path');
const baseConfig = require('../../../next/tailwind.base.config');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [baseConfig()],
  content: [
    path.join(__dirname, '../src/**/*.{mdx,tsx,ts}'),
    path.join(__dirname, './**/*.{css,js,ts,tsx}'),
  ],
  springui: {
    components: {
      full: false,
    },
  },
};
