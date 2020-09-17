require('@babel/register')({
  extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs'],
  ignore: [/node_modules/],
  rootMode: 'upward',
});

const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

require('dotenv').config();

const { version } = require('./package');
const getBaseConfig = require('./getWebpackBaseConfig');

const brand = process.env.BRAND || 'rc';

const getBrandConfig = require('./getBrandConfig');

const { prefix, brandConfig, brandFolder } = getBrandConfig(brand);

const releaseDir = process.env.RELEASE_DIR || 'release';
let buildPath = path.resolve(__dirname, releaseDir);
if (process.env.BRAND) {
  buildPath = path.resolve(buildPath, brand);
}

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

let hostingUrl = process.env.HOSTING_URL || 'https://ringcentral.github.io/ringcentral-embeddable';
let redirectUri = process.env.REDIRECT_URI;
let proxyUri = process.env.PROXY_URI;

const localExtensionMode = !!process.env.LOCAL_EXTENSION_MODE;
if (localExtensionMode) {
  hostingUrl = null;
}

const errorReportKey = process.env.ERROR_REPORT_KEY;
const recordingLink = process.env.RECORDING_LINK || 'https://ringcentral.github.io/ringcentral-media-reader/';

const config = getBaseConfig({ themeFolder: brandFolder });
config.output = {
  path: buildPath,
  filename: '[name].js',
};
config.plugins = [
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify('production'),
      API_CONFIG: JSON.stringify(apiConfig),
      APP_VERSION: JSON.stringify(version),
      HOSTING_URL: JSON.stringify(hostingUrl),
      REDIRECT_URI: JSON.stringify(redirectUri),
      PROXY_URI: JSON.stringify(proxyUri),
      PREFIX: JSON.stringify(prefix),
      BRAND_CONFIG: JSON.stringify(brandConfig),
      ERROR_REPORT_KEY: JSON.stringify(errorReportKey),
      RECORDING_LINK: JSON.stringify(recordingLink),
    },
  }),
  new CopyWebpackPlugin({
    patterns: [
      { from: 'src/assets', to: 'assets' },
      { from: 'src/app.html', to: 'app.html' },
      { from: 'src/index.html', to: 'index.html' },
      { from: 'src/proxy.html', to: 'proxy.html' },
      { from: 'src/redirect.html', to: 'redirect.html' },
    ]
  }),
];
if (!localExtensionMode) {
  config.entry['adapter.min'] = './src/adapter.js';
}

config.optimization = {
  minimize: true,
  minimizer: [
    new TerserPlugin({
      terserOptions: {
        compress: {
          warnings: false,
        },
        mangle: localExtensionMode ? false : true,
        output: {
          comments: false,
        },
      },
      exclude: /adapter\.js$/,
    }),
  ]
};
config.mode = 'production';
config.resolve = {
  ...config.resolve,
  alias: {
    'brand-logo-path': brandFolder,
  },
};
module.exports = config;
