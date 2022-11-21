const path = require('path');
const autoprefixer = require('autoprefixer');
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
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
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
      new webpack.NormalModuleReplacementPlugin(
        /@ringcentral-integration\/commons\/lib\/Tabbie.js/,
        path.resolve(__dirname, './vendors/commons/lib/Tabbie.js'), // TODO: update with new widget lib to fix this
      ),
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
          test: /\.md$/,
          use: 'raw-loader',
        },
        {
          test: /\.css$/,
          use: [
            styleLoader,
            'css-loader',
          ],
        },
        {
          test: /\.woff|\.woff2|.eot|\.ttf/,
          use: {
            loader: 'url-loader',
            options: {
              limit: 15000,
              name: 'fonts/[name]_[hash].[ext]',
              // TODO: it should be upgrade css-loader and update config
              esModule: false,
            },
          },
        },
        {
          test: /\.svg/,
          exclude: /font/,
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
          test: /\.png|\.jpg|\.gif|fonts(\/|\\).*\.svg/,
          use: 'url-loader?limit=20000&name=images/[name]_[hash].[ext]',
        },
        {
          test: /\.ogg$/,
          use: 'file-loader?publicPath=./&name=audio/[name]_[hash].[ext]',
        },
        {
          test: /\.sass|\.scss/,
          use: [
            styleLoader,
            {
              loader: 'css-loader',
              options: {
                localIdentName: '[folder]_[local]',
                modules: true,
              }
            },
            {
              loader: 'postcss-loader',
              options: {
                plugins() {
                  return [autoprefixer];
                },
              },
            },
            {
              loader: 'sass-loader',
              options: {
                outputStyle: 'expanded',
                includePaths: sassLoaderIncludePaths,
              },
            }
          ],
        },
      ],
    }
  };
};
