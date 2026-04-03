import path from 'path';
import type { WebpackConfigOptions } from '@ringcentral-integration/next-builder';
import { DefinePlugin, type RuleSetRule } from 'webpack';
import { getBaseWebpackConfig, merge } from './next/lib/webpack/builder.webpack';
import type { AppConfig } from './next/config';

const DEFAULT_PROD_HOSTING_URL =
  'https://ringcentral.github.io/ringcentral-embeddable';
const DEFAULT_RECORDING_LINK =
  'https://ringcentral.github.io/ringcentral-media-reader/';
const DEFAULT_NOISE_REDUCTION_SDK_URL =
  'https://apps.ringcentral.com/integration/ringcentral-embeddable/noise-reduction/1.0.13.1';

const readEnv = (...names: string[]) => {
  for (const name of names) {
    const value = process.env[name];
    if (typeof value !== 'undefined' && value !== '') {
      return value;
    }
  }
  return undefined;
};

const toDefineValue = (value: unknown) =>
  value === undefined ? 'undefined' : JSON.stringify(value);

const getAdapterName = (options: WebpackConfigOptions<AppConfig>) =>
  options.projectConfig.projectConfig.pages.find(
    ({ main }) => path.parse(main).name === 'adapter',
  )?.filename || 'adapter.js';

const getHostingUrl = (options: WebpackConfigOptions<AppConfig>) => {
  if (process.env.LOCAL_EXTENSION_MODE) {
    return null;
  }

  return (
    readEnv('HOSTING_URL') ||
    (options.devServer
      ? `http://localhost:${options.projectConfig.devServerPort}`
      : DEFAULT_PROD_HOSTING_URL)
  );
};

const getNoiseReductionSdkUrl = (options: WebpackConfigOptions<AppConfig>) => {
  if (process.env.LOCAL_EXTENSION_MODE || options.devServer) {
    return '/noise-reduction';
  }

  return (
    readEnv('NOISE_REDUCTION_SDK_URL') || DEFAULT_NOISE_REDUCTION_SDK_URL
  );
};

const getCustomRules = (): RuleSetRule[] => [
  // Fix scss syntax error in widgets: `and(max-width` → `and (max-width`
  {
    test: /\.scss$/,
    enforce: 'pre',
    use: {
      loader: 'string-replace-loader',
      options: {
        search: /and\(max-width/g,
        replace: 'and (max-width',
      },
    },
  },
  {
    test: /\.worklet\.js$/,
    type: 'asset/resource',
    generator: {
      filename: 'worklets/[name][ext]'
    },
  },
];

export const getWebpackConfig = (options: WebpackConfigOptions<AppConfig>) => {
  const baseWebpackConfig = getBaseWebpackConfig(options);
  const { projectConfig } = options;
  const { appConfig } = projectConfig;
  const brandCode = appConfig.brandConfig.code;
  const releaseVersion =
    appConfig.version.releaseVersion || appConfig.version.appVersion || '';
  const buildHash = readEnv('BUILD_HASH');
  const appVersion =
    readEnv('APP_VERSION') ||
    (buildHash ? `${releaseVersion} (${buildHash})` : releaseVersion);
  const runtimeAppConfig = {
    prefix: appConfig.prefix || '',
    brandConfig: appConfig.brandConfig,
    version: {
      buildHash: buildHash || appConfig.version.buildHash || '',
      releaseVersion,
      appVersion,
    },
  };
  const legacyApiConfig = {
    appKey: readEnv('API_KEY', 'RINGCENTRAL_CLIENT_ID'),
    appSecret: readEnv('API_SECRET', 'RINGCENTRAL_CLIENT_SECRET'),
    server: readEnv('API_SERVER', 'RINGCENTRAL_SERVER'),
  };

  return merge(baseWebpackConfig, {
    module: {
      rules: getCustomRules(),
    },
    plugins: [
      new DefinePlugin({
        'process.env.APP_CONFIG': toDefineValue(runtimeAppConfig),
        'process.env.HOSTING_URL': toDefineValue(getHostingUrl(options)),
        'process.env.APP_VERSION': toDefineValue(appVersion),
        'process.env.API_CONFIG': toDefineValue(legacyApiConfig),
        'process.env.PREFIX': toDefineValue(appConfig.prefix || ''),
        'process.env.BRAND': toDefineValue(brandCode || ''),
        'process.env.BRAND_CONFIGS': toDefineValue({
          [brandCode]: appConfig.brandConfig,
        }),
        'process.env.REDIRECT_URI': toDefineValue(readEnv('REDIRECT_URI')),
        'process.env.PROXY_URI': toDefineValue(readEnv('PROXY_URI')),
        'process.env.ERROR_REPORT_KEY': toDefineValue(
          readEnv('ERROR_REPORT_KEY'),
        ),
        'process.env.RECORDING_LINK': toDefineValue(
          readEnv('RECORDING_LINK') || DEFAULT_RECORDING_LINK,
        ),
        'process.env.ADAPTER_NAME': toDefineValue(getAdapterName(options)),
        'process.env.MIXPANEL_KEY': toDefineValue(readEnv('MIXPANEL_KEY')),
        'process.env.ANALYTICS_SECRET_KEY': toDefineValue(
          readEnv('ANALYTICS_SECRET_KEY'),
        ),
        'process.env.NOISE_REDUCTION_SDK_URL': toDefineValue(
          getNoiseReductionSdkUrl(options),
        ),
      }),
    ],
    resolve: {
      alias: {
        // Brand logo path alias for dynamic brand theming
        'brand-logo-path': projectConfig.themePath,
        // Fix @ringcentral/juno path resolution issue
        // The package exports maps ./* to ./es6/*, so es6/ prefix in imports causes double path
        '@ringcentral/juno/es6': path.resolve(
          __dirname,
          './node_modules/@ringcentral/juno/es6',
        ),
        // Same fix for juno-icon
        '@ringcentral/juno-icon/es6': path.resolve(
          __dirname,
          './node_modules/@ringcentral/juno-icon/es6',
        ),
        'ringcentral-web-phone/lib/audioHelper$': path.resolve(
          __dirname,
          './next/app/services/WebphoneV2/AudioHelper.ts',
        ),
      },
    },
  });
};
