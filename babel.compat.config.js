const baseConfig = require('@ringcentral-integration/babel-settings/reactant-babel.config');

const PLUGIN_NAME_MAP = {
  '@babel/plugin-proposal-class-properties':
    '@babel/plugin-transform-class-properties',
  '@babel/plugin-proposal-export-namespace-from':
    '@babel/plugin-transform-export-namespace-from',
  '@babel/plugin-proposal-nullish-coalescing-operator':
    '@babel/plugin-transform-nullish-coalescing-operator',
  '@babel/plugin-proposal-object-rest-spread':
    '@babel/plugin-transform-object-rest-spread',
  '@babel/plugin-proposal-optional-chaining':
    '@babel/plugin-transform-optional-chaining',
};

function normalizePlugin(plugin) {
  if (Array.isArray(plugin)) {
    const [pluginName, ...rest] = plugin;
    const normalizedPluginName = PLUGIN_NAME_MAP[pluginName];
    if (normalizedPluginName) {
      return [normalizedPluginName, ...rest];
    }
    return plugin;
  }

  if (PLUGIN_NAME_MAP[plugin]) {
    return PLUGIN_NAME_MAP[plugin];
  }

  return plugin;
}

module.exports = function compatBabelConfig(api, options) {
  const config = baseConfig(api, options);

  return {
    ...config,
    plugins: (config.plugins || []).map(normalizePlugin),
  };
};
