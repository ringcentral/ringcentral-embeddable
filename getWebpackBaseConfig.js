const webpack = require('webpack');
const supportedLocales = [
  'en-US',
  'en-GB',
  'en-CA',
  'en-AU',
  'fr-FR',
  'fr-CA',
  'de-DE',
  'it-IT',
  'es-ES',
  'es-419',
  'ja-JP',
  'pt-BR',
  'zh-CN',
  'zh-TW',
  'zh-HK',
];
module.exports = function getBaseConfig({ themeFolder = null, styleLoader = 'style-loader' } = {}) {
  const sassLoaderIncludePaths = ['src', 'node_modules'];
  if (themeFolder) {
    sassLoaderIncludePaths.push(themeFolder);
  }
  return {
    entry: {
      app: './src/app.js',
      adapter: './src/adapter.js',
      proxy: './src/proxy.js',
      redirect: './src/redirect.js',
    },
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      fallback: {
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        vm: require.resolve('vm-browserify'),
        process: require.resolve('process/browser'),
        buffer: require.resolve('buffer'),
        events: require.resolve('events'),
        path: require.resolve('path-browserify'),
        querystring: require.resolve('querystring-es3'),
        url: require.resolve('url'),
      },
    },
    plugins: [
      new webpack.ProvidePlugin({
        process: 'process/browser.js',
        Buffer: ['buffer', 'Buffer'],
      }),
    ],
    module: {
      rules: [
        {
          test: /\.(js|jsx|ts|tsx)$/,
          use: [
            {
              loader: 'babel-loader',
            },
            {
              loader: '@ringcentral-integration/locale-loader',
              options: {
                supportedLocales
              }
            },
          ],
          exclude: /node_modules/,
        },
        {
          test: /\.(js|jsx|ts|tsx)$/,
          use: [{
            loader: 'string-replace-loader', // remove unload event with pagehide
            options: {
              search: /window.addEventListener\('unload'/,
              replace: "window.addEventListener('pagehide'",
              flags: 'g',
            },
          }, {
            loader: 'string-replace-loader', // remove unload event with pagehide
            options: {
              search: /window.removeEventListener\('unload'/,
              replace: "window.removeEventListener('pagehide'",
              flags: 'g',
            },
          }]
        },
        {
          test: /\.md$/,
          type: 'asset/source',
        },
        {
          test: /\.css$/,
          use: [
            styleLoader,
            {
              loader: 'css-loader',
              options: {
                modules: {
                  localIdentName: '[folder]_[local]',
                  namedExport: false,
                  exportOnlyLocals: false,
                  exportLocalsConvention: 'as-is',
                },
              }
            }
          ],
        },
        {
          test: /\.woff|\.woff2|.eot|\.ttf/,
          type: 'asset',
          generator: {
            filename: 'fonts/[name]_[hash][ext]',
          },
          parser: {
            dataUrlCondition: {
              maxSize: 15 * 1024,
            },
          },
        },
        {
          test: /\.svg/,
          exclude: /font/,
          resourceQuery: { not: [/urlLoader/] },
          use: [
            'babel-loader',
            {
              loader: 'react-svg-loader',
              options: {
                jsx: true,
                svgo: {
                  plugins: [
                    {
                      removeViewBox: false,
                    },
                  ],
                }
              }
            }
          ]
        },
        {
          resourceQuery: /urlLoader/,
          type: 'asset/inline',
        },
        {
          test: /\.png|\.jpg|\.gif|fonts(\/|\\).*\.svg/,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 20 * 1024,
            },
          },
          generator: {
            filename: 'images/[name]_[hash][ext]',
          },
        },
        {
          test: /\.ogg|\.mp3|\.wav/,
          type: 'asset/resource',
          generator: {
            filename: 'audio/[name]_[hash][ext]',
          },
        },
        {
          test: /\.sass|\.scss/,
          use: [
            styleLoader,
            {
              loader: 'css-loader',
              options: {
                modules: {
                  localIdentName: '[folder]_[local]',
                  namedExport: false,
                  exportOnlyLocals: false,
                  exportLocalsConvention: 'as-is',
                },
              }
            },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    ['postcss-preset-env'],
                  ],
                },
              },
            },
            {
              loader: 'sass-loader',
              options: {
                sassOptions: {
                  style: 'expanded',
                  loadPaths: sassLoaderIncludePaths,
                },
              },
            }
          ],
        },
      ],
    }
  };
};
