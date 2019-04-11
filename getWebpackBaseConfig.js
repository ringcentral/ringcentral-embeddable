const autoprefixer = require('autoprefixer');
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
module.exports = function getBaseConfig({ themeFolder } = {}) {
  const sassLoaderIncludePaths = ['src', 'node_modules'];
  if (themeFolder) {
    sassLoaderIncludePaths.push(themeFolder);
  }
  return {
    entry: {
      app: ['@babel/polyfill', './src/app.js'],
      adapter: './src/adapter.js',
      proxy: './src/proxy.js',
      redirect: './src/redirect.js',
    },
    module: {
      rules: [
        {
          test: /\.js$/,
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
          // TODO: there are some es6 codes in web phone sdk.
          //       Need to remove it in web phone sdk before released
          test: /ringcentral-web-phone.js$/,
          use: 'babel-loader',
        },
        {
          test: /\.md$/,
          use: 'raw-loader',
        },
        {
          test: /\.css$/,
          use: [
            'style-loader',
            'css-loader',
          ],
        },
        {
          test: /\.woff|\.woff2|.eot|\.ttf/,
          use: 'url-loader?limit=15000&publicPath=./&name=fonts/[name]_[hash].[ext]',
        },
        {
          test: /\.svg/,
          exclude: /font/,
          use: [
            'babel-loader',
            {
              loader: 'react-svg-loader',
              options: {
                jsx: true
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
            'style-loader',
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
                plugins: function () {
                  return [
                    autoprefixer
                  ];
                }
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
