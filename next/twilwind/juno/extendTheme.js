const paletteSource = require('@ringcentral/juno/foundation/theme/assets/palette.light.json');
const typography = require('@ringcentral/juno/foundation/theme/assets/typography.json');
const {
  getCssVariablesFromObject,
} = require('../utils/getCssVariablesFromObject');
const { getFontSizesFromObject } = require('../utils/getFontSizesFromObject');

// omit type from palette
// eslint-disable-next-line no-unused-vars
const { type, ...palette } = paletteSource;

const prefix = 'j-';
/** @type {import('tailwindcss').Config['theme']} */
module.exports = (development) => ({
  colors: {
    ...getCssVariablesFromObject({
      palette,
      prefix,
      development,
    }),
  },
  fontSize: {
    ...getFontSizesFromObject({ typography, prefix }),
  },
});
