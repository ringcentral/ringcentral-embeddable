/* eslint-disable no-console */
require('dotenv').config();
import { getProjectConfig } from '@ringcentral-integration/next-builder';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import path from 'path';
import type { AppConfig } from './next/config';
import { getWebpackConfig } from './webpack-next.config';

export async function devServer() {
  const projectConfig = getProjectConfig<AppConfig>();
  projectConfig.themePath = path.resolve(__dirname, 'next');
  const webpackConfig = getWebpackConfig({
    projectConfig,
    devServer: true,
    templateParameters: {},
  });
  const compiler = webpack({
    ...webpackConfig,
    stats: {
      warnings: true,
      chunks: false,
      colors: true,
    },
  });
  const server = new WebpackDevServer(
    {
      hot: false,
      client: {
        overlay: {
          errors: true,
          warnings: true,
          runtimeErrors: false,
        },
      },
      devMiddleware: {
        publicPath: '/',
      },
      port: projectConfig.devServerPort,
      static: path.resolve(__dirname, 'next'),
    },
    compiler,
  );
  await server.start();
  console.log(`server listening to ${projectConfig.devServerPort}...`);
}

export async function build() {
  const projectConfig = getProjectConfig<AppConfig>();
  projectConfig.themePath = path.resolve(__dirname, 'next');
  const webpackConfig = getWebpackConfig({
    projectConfig,
    templateParameters: {},
  });
  await new Promise((resolve, reject) => {
    webpack(webpackConfig, (err, stats) => {
      if (err || stats!.hasErrors()) {
        reject(
          err || new Error(JSON.stringify(stats!.toJson().errors, null, 2)),
        );
        return;
      }
      resolve(true);
    });
  });
}
