const extendTheme = require('./extendTheme');
const plugin = require('tailwindcss/plugin');

module.exports = plugin.withOptions(
  function () {
    //
  },
  function (options = {}) {
    return {
      theme: {
        extend: extendTheme(options.development),
      },
    };
  },
);
