import { createSharedApp } from '@ringcentral-integration/next-core';
import { getAppConfig } from './app/getAppConfig';
import { parseUri } from './lib/Adapter/parseUri';

export interface StaticAppConfig {
  prefix: string;
  brandConfig: {
    appName: string;
    defaultLocale: string;
    code: string;
  };
  version?: {
    appVersion?: string;
  };
}

export interface RuntimeSdkConfig {
  clientId?: string;
  clientSecret?: string;
  server?: string;
  discoveryServer?: string;
  enableDiscovery?: boolean;
  appKey?: string;
  appSecret?: string;
  apiKey?: string;
  apiSecret?: string;
  apiServer?: string;
}

interface UrlParams {
  clientId?: string;
  clientSecret?: string;
  appServer?: string;
  prefix?: string;
  disableLoginPopup?: boolean;
  jwt?: string;
  jwtOwnerId?: string;
  redirectUri?: string;
  fromPopup?: boolean;
}

function parseBooleanParam(value: string | undefined): boolean {
  return value === '1' || value === 'true';
}

type NormalizedRuntimeSdkConfig = {
  clientId?: string;
  clientSecret?: string;
  server?: string;
  discoveryServer?: string;
  enableDiscovery?: boolean;
};

function firstDefined<T>(...values: (T | undefined)[]) {
  return values.find((value) => typeof value !== 'undefined');
}

function normalizeSdkConfig(
  config?: RuntimeSdkConfig,
): NormalizedRuntimeSdkConfig {
  if (!config) {
    return {};
  }

  const clientId = firstDefined(config.clientId, config.appKey, config.apiKey);
  const clientSecret = firstDefined(
    config.clientSecret,
    config.appSecret,
    config.apiSecret,
  );
  const server = firstDefined(config.server, config.apiServer);

  return {
    ...(clientId && { clientId }),
    ...(clientSecret && { clientSecret }),
    ...(server && { server }),
    ...(config.discoveryServer && {
      discoveryServer: config.discoveryServer,
    }),
    ...(typeof config.enableDiscovery !== 'undefined' && {
      enableDiscovery: config.enableDiscovery,
    }),
  };
}

function readUrlParams(): UrlParams {
  const href =
    typeof window !== 'undefined'
      ? window.location.href
      : typeof self !== 'undefined'
        ? self.location.href
        : '';
  const params = parseUri(href);
  return {
    clientId: params.clientId || params.appKey || undefined,
    clientSecret: params.clientSecret || params.appSecret || undefined,
    appServer: params.appServer || undefined,
    prefix: params.prefix || undefined,
    disableLoginPopup: parseBooleanParam(params.disableLoginPopup),
    jwt: params.jwt || undefined,
    jwtOwnerId: params.jwtOwnerId || undefined,
    redirectUri: params.redirectUri || undefined,
    fromPopup: parseBooleanParam(params.fromPopup),
  };
}

/**
 * Create the Engage Voice Embeddable application
 */
export const createApp = async (
  options?: Parameters<typeof createSharedApp>[0]['share'],
  additionalModules: Parameters<typeof createSharedApp>[0]['modules'] = [],
) => {
  const config = process.env.APP_CONFIG as StaticAppConfig;
  const { prefix, brandConfig, version } = config;

  const urlParams =
    typeof window !== 'undefined' || typeof self !== 'undefined'
      ? readUrlParams()
      : ({} as UrlParams);
  const mergedSdkConfig = {
    ...normalizeSdkConfig(process.env.API_CONFIG as RuntimeSdkConfig),
    ...(urlParams.clientId && { clientId: urlParams.clientId }),
    ...(urlParams.clientSecret && { clientSecret: urlParams.clientSecret }),
    ...(urlParams.appServer && { server: urlParams.appServer }),
  } as Required<Pick<NormalizedRuntimeSdkConfig, 'clientId' | 'server'>> &
    NormalizedRuntimeSdkConfig;
  const redirectUri = urlParams.redirectUri || process.env.REDIRECT_URI;
  const analyticsKey = process.env.MIXPANEL_KEY || '';

  const appVersion = process.env.APP_VERSION || version?.appVersion || '';

  const appConfig = getAppConfig({
    appVersion,
    prefix: urlParams.prefix || prefix,
    brandConfig,
    sdkConfig: mergedSdkConfig,
    modules: additionalModules,
    share: options ?? {
      name: 'rc-embeddable',
      type: 'Base',
    },
    analyticsKey,
    disableLoginPopup: urlParams.disableLoginPopup,
    redirectUri,
    jwt: urlParams.jwt,
    jwtOwnerId: urlParams.jwtOwnerId,
    fromPopup: urlParams.fromPopup,
  });

  const app = await createSharedApp(appConfig);

  return app;
};

export default createApp;
