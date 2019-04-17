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
      ['@babel/preset-env', { useBuiltIns: 'entry', forceAllTransforms: true, modules: 
    'cjs' }],
      '@babel/preset-react',
      ['@babel/preset-typescript', {
        isTSX: true,
        allExtensions: true
      }]
    ],
    plugins: [
      '@babel/plugin-transform-runtime',
      '@babel/plugin-proposal-export-default-from',
      '@babel/plugin-proposal-function-bind',
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      ['@babel/plugin-proposal-class-properties', { loose: true }]
    ],
    sourceMaps: true
  };
};
