require('@babel/register')({
  extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs'],
  ignore: [/node_modules/],
  rootMode: 'upward',
});

const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
require('dotenv').config();

const { version } = require('./package');
const getBaseConfig = require('./getWebpackBaseConfig');

const brand = process.env.BRAND || 'rc';

const getBrandConfig = require('./getBrandConfig');

const { prefix, brandConfig, brandFolder } = getBrandConfig(brand);

const buildPath = path.resolve(__dirname, 'src');

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

const errorReportKey = process.env.ERROR_REPORT_KEY;

const config = getBaseConfig({ themeFolder: brandFolder });
config.devServer = {
  contentBase: buildPath,
  hot: true,
  inline: true,
  port: 8080,
};
config.output = {
  path: buildPath,
  filename: '[name].js',
};
config.plugins = [
  new webpack.HotModuleReplacementPlugin(),
  new webpack.NoEmitOnErrorsPlugin(),
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify('development'),
      API_CONFIG: JSON.stringify(apiConfig),
      APP_VERSION: JSON.stringify(version),
      HOSTING_URL: JSON.stringify('http://localhost:8080'),
      PREFIX: JSON.stringify(prefix),
      BRAND_CONFIG: JSON.stringify(brandConfig),
      ERROR_REPORT_KEY: JSON.stringify(errorReportKey),
      RECORDING_LINK: JSON.stringify('https://ringcentral.github.io/ringcentral-media-reader/'),
    },
  }),
];
config.devtool = 'eval-source-map';
config.mode = 'development';
config.resolve = {
  alias: {
    'brand-logo-path': brandFolder,
  },
};
module.exports = config;
