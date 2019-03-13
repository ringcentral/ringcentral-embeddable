module.exports = (api) => {
  console.log(api.env('test'));
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
      ['@babel/preset-env', { useBuiltIns: 'usage', forceAllTransforms: true }],
      '@babel/preset-react'
    ],
    plugins: [
      '@babel/plugin-transform-runtime',
      // '@babel/plugin-proposal-export-default-from',
      '@babel/plugin-proposal-function-bind',
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      ['@babel/plugin-proposal-class-properties', { loose: true }]
    ],
    sourceMaps: true
  };
};
