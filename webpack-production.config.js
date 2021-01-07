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
// const MiniCssExtractPlugin = require('mini-css-extract-plugin');

require('dotenv').config();

const { version } = require('./package');
const getBaseConfig = require('./getWebpackBaseConfig');

const defaultBrand = process.env.BRAND || 'rc';

const { getBrandConfig, brandConfigs, supportedBrands } = require('./getBrandConfig');

const releaseDir = process.env.RELEASE_DIR || 'release';
let buildPath = path.resolve(__dirname, releaseDir);
if (process.env.BRAND) {
  buildPath = path.resolve(buildPath, process.env.BRAND);
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

function getWebpackConfig({ brand, env = {} }) {
  const { prefix, brandFolder } = getBrandConfig(brand);
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
        BRAND: JSON.stringify(brand),
        BRAND_CONFIGS: JSON.stringify(brandConfigs),
        ERROR_REPORT_KEY: JSON.stringify(errorReportKey),
        RECORDING_LINK: JSON.stringify(recordingLink),
        ...env,
      },
    }),
  ];
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
  return config;
}

function getAppWebpackConfig({ brand }) {
  const config = getWebpackConfig({ brand, env: { ADAPTER_NAME: JSON.stringify('adapter.js') } });
  config.plugins = [
    ...config.plugins,
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/assets', to: 'assets' },
        { from: 'src/app.html', to: 'app.html' },
        { from: 'src/index.html', to: 'index.html' },
        { from: 'src/proxy.html', to: 'proxy.html' },
        { from: 'src/redirect.html', to: 'redirect.html' },
      ]
    }),
    // new MiniCssExtractPlugin({
    //   filename: '[name].css',
    // }),
  ];
  // config.module.rules.forEach((rule) => {
  //   if (!rule.use) {
  //     return;
  //   }
  //   const styleIndex = rule.use.indexOf('style-loader');
  //   if ( styleIndex > -1) {
  //     rule.use[styleIndex] = MiniCssExtractPlugin.loader;
  //   }
  // });
  config.entry = {
    app: ['@babel/polyfill', './src/app.js'],
    proxy: './src/proxy.js',
    redirect: './src/redirect.js',
  };
  return config;
}

function getAdapterWebpackConfig({ brand, adapterName }) {
  const config = getWebpackConfig({
    brand,
    env: {
      ADAPTER_NAME: JSON.stringify(`${adapterName}.js`),
    },
  });
  config.entry = {
    [adapterName]: './src/adapter.js',
  };
  return config;
}

const configs = [getAppWebpackConfig({ brand: defaultBrand })];

supportedBrands.forEach((brand) => {
  if (brand === defaultBrand) {
    const mainAdapterConfig = getAdapterWebpackConfig({
      brand,
      adapterName: 'adapter',
    });
    configs.push(mainAdapterConfig);
    if (!localExtensionMode) {
      const config = getAdapterWebpackConfig({
        brand,
        adapterName: 'adapter.min',
      });
      configs.push(config);
    }
    return;
  }
  const config = getAdapterWebpackConfig({
    brand,
    adapterName: `adapter.${brand}`,
  });
  configs.push(config);
});

module.exports = configs;
