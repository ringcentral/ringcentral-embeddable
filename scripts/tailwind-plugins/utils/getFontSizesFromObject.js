function getFontSizesFromObject({ typography, prefix = '' } = {}) {
  return Object.entries(typography).reduce(
    (acc, [key, { fontSize, ...rest }]) => {
      acc[`${prefix}${key}`] = [fontSize, rest];
      return acc;
    },
    {},
  );
}

exports.getFontSizesFromObject = getFontSizesFromObject;
