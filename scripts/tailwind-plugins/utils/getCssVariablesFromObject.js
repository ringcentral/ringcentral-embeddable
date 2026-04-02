// https://github.com/saadeghi/daisyui/blob/57ac2cdea5d6ec9c857df38c93b5fd0424f27ab7/src/theming/index.js

const getCssVariablesFromObject = ({
  palette,
  prefix = '',
  variablePrefix = prefix,
  supportOpacity = true,
  development = false,
} = {}) => {
  function getValue(color, variableName) {
    // when in vscode mode, return the color for better view color in development
    if (development) return color;

    if (supportOpacity) {
      return color.includes('rgba') || color === 'transparent'
        ? `var(--${variableName})`
        : `var(--${variableName}-fallback,oklch(var(--${variableName})/<alpha-value>))`;
    }

    return `var(--${variableName})`;
  }

  const cssVariable = Object.entries(palette).reduce((acc, [key, value]) => {
    if (typeof value === 'object') {
      Object.entries(value).forEach(([nestedKey, nestedValue]) => {
        const variableName = `${variablePrefix}${key}-${nestedKey}`;

        acc[`${prefix}${key}-${nestedKey}`] = getValue(
          nestedValue,
          variableName,
        );
      });
    } else {
      const variableName = `${variablePrefix}${key}`;
      acc[`${prefix}${key}`] = getValue(value, variableName);
    }
    return acc;
  }, {});
  return cssVariable;
};

exports.getCssVariablesFromObject = getCssVariablesFromObject;
