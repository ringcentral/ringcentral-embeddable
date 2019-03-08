const autoprefixer = require('autoprefixer');

module.exports = function getBaseConfig() {
  return {
    entry: {
      app: ['babel-polyfill', './src/app.js'],
      adapter: './src/adapter.js',
      proxy: './src/proxy.js',
      redirect: './src/redirect.js',
    },
    module: {
      rules: [
        {
          // TODO: there are some es6 codes in web phone sdk. Need to remove it in web phone sdk before released
          test: /ringcentral-web-phone.js$/, 
          use: 'babel-loader',
        },
        {
          test: /\.js$/,
          use: 'babel-loader',
          exclude: /node_modules/,
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
          test: /\.svg/,
          exclude: /font|src(\/|\\)assets(\/|\\)images/,
          use: [
            'babel-loader',
            'react-svg-loader',
          ],
        },
        {
          test: /\.woff|\.woff2|.eot|\.ttf/,
          use: 'url-loader?limit=15000&publicPath=./&name=fonts/[name]_[hash].[ext]',
        },
        {
          test: /\.png|\.jpg|\.gif|\.svg/,
          exclude: /ringcentral-widgets(\/|\\)assets(\/|\\)images(\/|\\).+\.svg/,
          use: 'url-loader?limit=20000&publicPath=./&name=images/[name]_[hash].[ext]',
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
                includePaths: ['src', 'node_modules'],
              },
            }
          ],
        },
      ],
    }
  };
};
