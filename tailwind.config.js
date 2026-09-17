const baseConfig = require('./src/tailwind.base.config');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [baseConfig()],
  content: [
    './src/app.html',
    './src/*.{tsx,ts}',
    './src/app/**/*.{tsx,ts}',
    './src/ringcx/**/*.{tsx,ts}',
    './packages/jsonschema-spring-page/src/**/*.{mdx,tsx,ts}',
    './packages/jsonschema-spring-page/.storybook/**/*.{css,js,ts,tsx}',
    './node_modules/@ringcentral-integration/**/*.{js,ts,jsx,tsx}',
    './node_modules/@ringcentral/spring-ui/**/*.{js,ts,jsx,tsx}',
  ],
};
