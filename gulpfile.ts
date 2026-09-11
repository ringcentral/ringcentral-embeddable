/* eslint-disable no-console */
require('dotenv').config();
import fs from 'fs';
import path from 'path';
import {
  getProjectConfig,
  type ProjectConfig,
} from '@ringcentral-integration/next-builder';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import type { AppConfig } from './src/config';
import { getWebpackConfig } from './webpack.config';

const SOURCE_PATH = path.resolve(__dirname, 'src');
const EXTENSION_BUILD_PATH = path.resolve(__dirname, 'extension');
const NOISE_REDUCTION_PATH = path.resolve(SOURCE_PATH, 'noise-reduction');
const REQUIRED_NOISE_REDUCTION_FILES = [
  'krispsdk.es5.js',
  'worker.es5.js',
  'worklet.es5.js',
  'models/model_8.kw',
  'models/model_16.kw',
] as const;

const assertNoiseReductionAssets = (): void => {
  const missingFiles = REQUIRED_NOISE_REDUCTION_FILES.filter(
    (filePath) => !fs.existsSync(path.resolve(NOISE_REDUCTION_PATH, filePath)),
  );
  if (missingFiles.length === 0) {
    return;
  }
  throw new Error(
    `Missing extension noise-reduction assets: ${missingFiles.join(', ')}`,
  );
};

const getConfiguredProject = (): ProjectConfig<AppConfig> => {
  const projectConfig = getProjectConfig<AppConfig>();
  projectConfig.themePath = SOURCE_PATH;
  return projectConfig;
};

const runBuild = async (
  projectConfig: ProjectConfig<AppConfig>,
  outputPath?: string,
): Promise<void> => {
  const webpackConfig = getWebpackConfig({
    projectConfig,
    templateParameters: {},
    outputPath,
  });
  await new Promise<void>((resolve, reject) => {
    webpack(webpackConfig, (error, stats) => {
      if (error || stats?.hasErrors()) {
        reject(
          error || new Error(JSON.stringify(stats?.toJson().errors, null, 2)),
        );
        return;
      }
      resolve();
    });
  });
};

export async function devServer(): Promise<void> {
  const projectConfig = getConfiguredProject();
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
      headers: {
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
      port: projectConfig.devServerPort,
      static: SOURCE_PATH,
    },
    compiler,
  );
  await server.start();
  console.log(`server listening to ${projectConfig.devServerPort}...`);
}

export async function build(): Promise<void> {
  await runBuild(getConfiguredProject());
}

export async function buildExtension(): Promise<void> {
  assertNoiseReductionAssets();
  const projectConfig = getConfiguredProject();
  projectConfig.runtimeEnvironment = 'extension';
  projectConfig.assetsEntries = [
    ...(projectConfig.assetsEntries ?? []),
    {
      from: NOISE_REDUCTION_PATH,
      to: 'noise-reduction',
    },
  ];
  await runBuild(projectConfig, EXTENSION_BUILD_PATH);
}
