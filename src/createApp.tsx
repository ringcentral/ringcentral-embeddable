import { createSharedApp } from '@ringcentral-integration/next-core';
import { getAppConfig } from './app/getAppConfig';
import { parseUri } from './lib/Adapter/parseUri';
import { resolveRuntimeSdkConfig } from './lib/resolveRuntimeSdkConfig';

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
  discovery?: boolean;
  discoverAppServer?: string;
  usedDeprecatedAppKey?: boolean;
  prefix?: string;
  authorizationCode?: string;
  authorizationCodeVerifier?: string;
  authProxy?: boolean;
  disableLoginPopup?: boolean;
  externalAuthId?: string;
  jwt?: string;
  proxyUri?: string;
  redirectUri?: string;
  fromPopup?: boolean;
  mainTab?: boolean;
  enableSideWidget?: boolean;
  showSignUpButton?: boolean;
  enableRingCX?: boolean;
  evServer?: string;
  enableAgentScript?: boolean;
  enableAudioInitPrompt?: boolean;
  hideCallNote?: boolean;
  enableVoicemailDrop?: boolean;
  disableNoiseReduction?: boolean;
  enableSmartNote?: boolean;
  enableAnalytics?: boolean;
  userAgent?: string;
  defaultAutoLogCallEnabled?: boolean;
  defaultAutoLogMessageEnabled?: boolean;
  disableInactiveTabCallEvent?: boolean;
  enableFromNumberSetting?: boolean;
  enableRingoutCallerId?: boolean;
  enableSmsSettingEvent?: boolean;
  enableTypingTimeTracking?: boolean;
  showMyLocationNumbers?: boolean;
}

function parseBooleanParam(value: string | undefined): boolean {
  return value === '1' || value === 'true';
}

function parseOptionalBooleanParam(
  value: string | undefined,
): boolean | undefined {
  if (typeof value === 'undefined') {
    return undefined;
  }
  return parseBooleanParam(value);
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
    discovery: Boolean(params.discovery),
    discoverAppServer: params.discoverAppServer || undefined,
    usedDeprecatedAppKey: Boolean(!params.clientId && params.appKey),
    prefix: params.prefix || undefined,
    authorizationCode: params.authorizationCode || undefined,
    authorizationCodeVerifier: params.authorizationCodeVerifier || undefined,
    authProxy: Boolean(params.authProxy),
    disableLoginPopup: Boolean(params.disableLoginPopup),
    externalAuthId: params.externalAuthId || undefined,
    jwt: params.jwt || undefined,
    proxyUri: params.proxyUri || undefined,
    redirectUri: params.redirectUri || undefined,
    fromPopup: parseBooleanParam(params.fromPopup),
    mainTab: parseOptionalBooleanParam(params.mainTab),
    enableSideWidget: parseBooleanParam(params.enableSideWidget),
    showSignUpButton: parseBooleanParam(params.showSignUpButton),
    enableRingCX: parseBooleanParam(params.enableRingCX),
    evServer: params.evServer || undefined,
    enableAgentScript: parseBooleanParam(params.enableAgentScript),
    enableAudioInitPrompt: parseBooleanParam(params.enableAudioInitPrompt),
    hideCallNote: parseBooleanParam(params.hideCallNote),
    enableVoicemailDrop: parseBooleanParam(params.enableVoicemailDrop),
    disableNoiseReduction: parseBooleanParam(params.disableNoiseReduction),
    enableSmartNote: parseBooleanParam(params.enableSmartNote),
    enableAnalytics: Boolean(params.enableAnalytics),
    userAgent: params.userAgent || undefined,
    defaultAutoLogCallEnabled: parseBooleanParam(
      params.defaultAutoLogCallEnabled,
    ),
    defaultAutoLogMessageEnabled: parseBooleanParam(
      params.defaultAutoLogMessageEnabled,
    ),
    disableInactiveTabCallEvent: parseBooleanParam(
      params.disableInactiveTabCallEvent,
    ),
    enableFromNumberSetting: parseBooleanParam(params.enableFromNumberSetting),
    enableRingoutCallerId: parseBooleanParam(params.enableRingoutCallerId),
    enableSmsSettingEvent: parseBooleanParam(params.enableSmsSettingEvent),
    enableTypingTimeTracking: parseBooleanParam(
      params.enableTypingTimeTracking,
    ),
    showMyLocationNumbers: parseBooleanParam(params.showMyLocationNumbers),
  };
}

/**
 * Create the Engage Voice Embeddable application
 */
export const createApp = async (
  options?: Parameters<typeof createSharedApp>[0]['share'],
  additionalModules: Parameters<typeof createSharedApp>[0]['modules'] = [],
) => {
  const config = process.env.APP_CONFIG as unknown as StaticAppConfig;
  const { prefix, brandConfig, version } = config;

  const urlParams =
    typeof window !== 'undefined' || typeof self !== 'undefined'
      ? readUrlParams()
      : ({} as UrlParams);
  const mergedSdkConfig = resolveRuntimeSdkConfig(
    process.env.API_CONFIG as RuntimeSdkConfig,
    urlParams,
  ) as Required<Pick<RuntimeSdkConfig, 'clientId' | 'server'>> &
    RuntimeSdkConfig;

  if (!urlParams.authProxy && urlParams.usedDeprecatedAppKey) {
    console.warn(
      'appKey is deprecated, please change to clientId. https://ringcentral.github.io/ringcentral-embeddable/docs/config/client-id/',
    );
  }
  if (!urlParams.authProxy && !mergedSdkConfig.clientId) {
    console.error(
      'RingCentral App Client Id is required. https://ringcentral.github.io/ringcentral-embeddable/docs/app-registration/',
    );
    const hostname =
      typeof window !== 'undefined'
        ? window.location.hostname
        : typeof self !== 'undefined'
          ? self.location.hostname
          : '';
    if (hostname !== 'localhost') {
      throw new Error('RingCentral App Client Id is required.');
    }
  }

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
    authorizationCode: urlParams.authorizationCode,
    authorizationCodeVerifier: urlParams.authorizationCodeVerifier,
    authProxy: urlParams.authProxy,
    disableLoginPopup: urlParams.disableLoginPopup,
    externalAuthId: urlParams.externalAuthId,
    redirectUri,
    jwt: urlParams.jwt,
    proxyUri: urlParams.proxyUri,
    fromPopup: urlParams.fromPopup,
    mainTab: urlParams.mainTab,
    enableSideWidget: urlParams.enableSideWidget,
    showSignUpButton: urlParams.showSignUpButton,
    enableRingCX: urlParams.enableRingCX,
    evServer: urlParams.evServer,
    enableAgentScript: urlParams.enableAgentScript,
    enableAudioInitPrompt: urlParams.enableAudioInitPrompt,
    hideCallNote: urlParams.hideCallNote,
    enableVoicemailDrop: urlParams.enableVoicemailDrop,
    disableNoiseReduction: urlParams.disableNoiseReduction,
    enableSmartNote: urlParams.enableSmartNote,
    enableAnalytics: urlParams.enableAnalytics,
    userAgent: urlParams.userAgent,
    defaultAutoLogCallEnabled: urlParams.defaultAutoLogCallEnabled,
    defaultAutoLogMessageEnabled: urlParams.defaultAutoLogMessageEnabled,
    disableInactiveTabCallEvent: urlParams.disableInactiveTabCallEvent,
    enableFromNumberSetting: urlParams.enableFromNumberSetting,
    enableRingoutCallerId: urlParams.enableRingoutCallerId,
    enableSmsSettingEvent: urlParams.enableSmsSettingEvent,
    enableTypingTimeTracking: urlParams.enableTypingTimeTracking,
    showMyLocationNumbers: urlParams.showMyLocationNumbers,
  });

  const app = await createSharedApp(appConfig);

  return app;
};

export default createApp;
