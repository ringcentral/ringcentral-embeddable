module.exports = (api) => {
  const isTest = api.env('test');
  if (isTest) {
    return {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 'current',
            },
          },
        ],
      ],
    };
  }
  return {
    presets: [
      ['@babel/preset-env', { useBuiltIns: 'usage', modules: 'auto', corejs: 3 }],
      '@babel/preset-react',
      ['@babel/preset-typescript', {
        isTSX: true,
        allExtensions: true
      }]
    ],
    plugins: [
      '@babel/plugin-proposal-export-default-from',
      '@babel/plugin-proposal-function-bind',
      '@babel/plugin-transform-optional-chaining',
      '@babel/plugin-transform-nullish-coalescing-operator',
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      ['@babel/plugin-transform-class-properties', { loose: true }],
      'const-enum',
    ],
    sourceMaps: true
  };
};
