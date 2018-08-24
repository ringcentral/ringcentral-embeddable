const webpack = require('webpack');
const fs = require('fs');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const packageConfig = require('./package');
const getBaseConfig = require('./getWebpackBaseConfig');

const buildPath = path.resolve(__dirname, 'release');
const apiConfigFile = path.resolve(__dirname, 'api.json');
let apiConfig;
if (fs.existsSync(apiConfigFile)) {
  apiConfig = JSON.parse(fs.readFileSync(apiConfigFile));
} else {
  apiConfig = {
    appKey: process.env.API_KEY,
    appSecret: process.env.API_SECRET,
    server: process.env.API_SERVER,
  };
}
const version = process.env.VERSION || packageConfig.version;
const hostingUrl = process.env.HOSTING_URL || 'https://ringcentral.github.io/ringcentral-embeddable';
const redirectUri = process.env.REDIRECT_URI || 'https://ringcentral.github.io/ringcentral-embeddable/redirect.html';
const proxyUri = process.env.PROXY_URI || 'https://ringcentral.github.io/ringcentral-embeddable/proxy.html';

const config = getBaseConfig();
config.output = {
  path: buildPath,
  filename: '[name].js',
};
config.plugins = [
  new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: false,
    },
    output: {
      comments: false,
    },
    exclude: /[Aa]dapter/
  }),
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify('production'),
      API_CONFIG: JSON.stringify(apiConfig),
      APP_VERSION: JSON.stringify(version),
      HOSTING_URL: JSON.stringify(hostingUrl),
      REDIRECT_URI: JSON.stringify(redirectUri),
      PROXY_URI: JSON.stringify(proxyUri),
    },
  }),
  new CopyWebpackPlugin([
    { from: 'src/assets', to: 'assets' },
    { from: 'src/app.html', to: 'app.html' },
    { from: 'src/index.html', to: 'index.html' },
    { from: 'src/proxy.html', to: 'proxy.html' },
    { from: 'src/redirect.html', to: 'redirect.html' },
  ]),
];

module.exports = config;
