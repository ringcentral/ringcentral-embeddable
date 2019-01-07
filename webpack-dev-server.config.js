const webpack = require('webpack');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const packageConfig = require('./package');
const getBaseConfig = require('./getWebpackBaseConfig');

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
const version = packageConfig.version;

const config = getBaseConfig();
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
    },
  }),
];
config.devtool = 'eval-source-map';
config.mode = 'development';
module.exports = config;

