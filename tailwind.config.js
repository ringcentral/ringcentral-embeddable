const baseConfig = require('./next/tailwind.base.config');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [baseConfig()],
  content: [
    './next/app.html',
    './next/*.{tsx,ts}',
    './next/app/**/*.{tsx,ts}',
    './packages/jsonschema-spring-page/src/**/*.{mdx,tsx,ts}',
    './packages/jsonschema-spring-page/.storybook/**/*.{css,js,ts,tsx}',
    './node_modules/@ringcentral-integration/**/*.{js,ts,jsx,tsx}',
    './node_modules/@ringcentral/spring-ui/**/*.{js,ts,jsx,tsx}',
  ],
};
