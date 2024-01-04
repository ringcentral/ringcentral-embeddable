// require('@babel/register')({
//   extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs'],
//   ignore: [/node_modules/],
//   rootMode: 'upward',
// });

const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const envFile = process.env.ON_TEST ? '.env.test' : '.env';
require('dotenv').config({
  path: path.resolve(__dirname, envFile),
});

const { version } = require('./package');
const getBaseConfig = require('./getWebpackBaseConfig');

const defaultBrand = process.env.BRAND || 'rc';

const { getBrandConfig, brandConfigs } = require('./getBrandConfig');

const buildPath = path.resolve(__dirname, 'src');
const dynamicThemePath = path.resolve(__dirname, 'getBrandConfig');

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

function getWebpackConfig({ prefix, brand, styleLoader, themeFolder = null }) {
  const config = getBaseConfig({ themeFolder: themeFolder, styleLoader });
  config.devServer = {
    static: buildPath,
    hot: true,
    port: 8080,
  };
  config.output = {
    path: buildPath,
    filename: '[name].js',
  };
  config.plugins = [
    ...config.plugins,
    // @ts-ignore
    new webpack.NoEmitOnErrorsPlugin(),
    // @ts-ignore
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('development'),
        API_CONFIG: JSON.stringify(apiConfig),
        APP_VERSION: JSON.stringify(version),
        HOSTING_URL: JSON.stringify('http://localhost:8080'),
        PREFIX: JSON.stringify(prefix),
        BRAND: JSON.stringify(brand),
        BRAND_CONFIGS: JSON.stringify(brandConfigs),
        ERROR_REPORT_KEY: JSON.stringify(errorReportKey),
        RECORDING_LINK: JSON.stringify('https://ringcentral.github.io/ringcentral-media-reader/'),
        ADAPTER_NAME: JSON.stringify('adapter.js'),
        MIXPANEL_KEY: JSON.stringify(process.env.MIXPANEL_KEY),
        ANALYTICS_SECRET_KEY: JSON.stringify(process.env.ANALYTICS_SECRET_KEY),
        NOISE_REDUCTION_SDK_URL: JSON.stringify('/noise-reduction'),
      },
    }),
  ];
  config.devtool = 'eval-source-map';
  config.mode = 'development';
  if (process.env.CI) {
    config.watchOptions = {
      ignored: /node_modules/,
    };
  }
  return config;
}

function getAppWebpackConfig({ brand }) {
  const { prefix } = getBrandConfig(brand);
  const config = getWebpackConfig({
    prefix,
    brand,
    styleLoader: 'style-loader',
    themeFolder: dynamicThemePath,
  });
  config.entry = {
    app: './src/app.js',
    proxy: './src/proxy.js',
    redirect: './src/redirect.js',
  };
  return config;
}

function getAdapterWebpackConfig({ brand }) {
  const { prefix, brandFolder } = getBrandConfig(brand);
  const config = getWebpackConfig({
    prefix,
    brand,
    styleLoader: 'style-loader',
    themeFolder: brandFolder,
  });
  config.entry = {
    'adapter': './src/adapter.js',
  };
  delete config.devServer;
  return config;
}

module.exports = [
  getAppWebpackConfig({ brand: defaultBrand }),
  getAdapterWebpackConfig({ brand: defaultBrand })
];
