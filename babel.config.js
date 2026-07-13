const commonPlugins = [
  '@babel/plugin-proposal-export-default-from',
  '@babel/plugin-proposal-function-bind',
  '@babel/plugin-transform-optional-chaining',
  '@babel/plugin-transform-nullish-coalescing-operator',
  ['@babel/plugin-proposal-decorators', { legacy: true }],
  ['@babel/plugin-transform-class-properties', { loose: true }],
  'const-enum',
];

function transformImportMetaUrl({ types: t }) {
  return {
    visitor: {
      MemberExpression(path) {
        const { node } = path;
        if (
          t.isMetaProperty(node.object) &&
          node.object.meta.name === 'import' &&
          node.object.property.name === 'meta' &&
          t.isIdentifier(node.property, { name: 'url' })
        ) {
          path.replaceWith(t.stringLiteral('file://test'));
        }
      },
    },
  };
}

module.exports = (api) => {
  const isTest = api.env('test');
  const isBrowserCoverage = process.env.BROWSER_COVERAGE === 'true' && !isTest;
  return {
    presets: [
      isTest
        ? [
          '@babel/preset-env',
          {
            targets: {
              node: 'current',
            },
          },
        ]
        : ['@babel/preset-env', { useBuiltIns: 'usage', modules: 'auto', corejs: 3 }],
      '@babel/preset-react',
      ['@babel/preset-typescript', {
        isTSX: true,
        allExtensions: true
      }]
    ],
    plugins: [
      ...commonPlugins,
      ...(isTest ? [transformImportMetaUrl] : []),
      ...(isBrowserCoverage ? [[
        'babel-plugin-istanbul',
        {
          cwd: __dirname,
          include: [
            'src/**/*.{js,jsx,ts,tsx}',
          ],
          exclude: [
            'src/noise-reduction/**/*.es5.js',
            'src/worklets/**/*.worklet.js',
          ],
        },
      ]] : []),
    ],
    sourceMaps: !isTest
  };
};
