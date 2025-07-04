import 'setimmediate';
import './lib/TabFreezePrevention';
import './lib/patchGetUserMedia';
import './lib/patchOpenWindow';

import React from 'react';
import ReactDOM from 'react-dom';

import { createStore } from 'redux';
import url from 'url';

import App from './containers/App';
import parseUri from './lib/parseUri';
import { createPhone } from './modules/Phone';

const defaultPrefix = process.env.PREFIX;
const defaultApiConfig = process.env.API_CONFIG;

const currentUri = window.location.href;
const pathParams = parseUri(currentUri);
const clientIdFromParams = pathParams.clientId || pathParams.appKey;
const clientSecretFromParams = pathParams.clientSecret || pathParams.appSecret;
const authProxy = pathParams.authProxy;
const enableDiscovery = !!pathParams.discovery;

function getAppServer() {
  if (
    pathParams.appServer &&
    pathParams.appServer.indexOf('https://') === 0 &&
    pathParams.appServer.indexOf('?') === -1 &&
    pathParams.appServer.indexOf('javascript') === -1
  ) {
    return pathParams.appServer;
  }
  return defaultApiConfig.server;
}
const apiConfig = {
  clientId: clientIdFromParams || defaultApiConfig.appKey,
  clientSecret: (clientIdFromParams ? clientSecretFromParams : defaultApiConfig.appSecret),
  server: getAppServer(),
};

function getDiscoveryServer() {
  const discoveryServer = pathParams.discoverAppServer || apiConfig.server;
  if ([
    'https://platform.ringcentral.com',
    'https://platform.devtest.ringcentral.com',
    'https://discovery.ringcentral.biz',
    'https://discovery.ringcentral.com',
    'https://platform.ringcentral.biz',
  ].indexOf(discoveryServer) > -1) {
    return discoveryServer;
  }
  return defaultApiConfig.server;
}
if (enableDiscovery) {
  apiConfig.enableDiscovery = enableDiscovery;
  apiConfig.discoveryServer = getDiscoveryServer();
}
if (!authProxy && pathParams.appKey) {
  console.warn('appKey is deprecated, please change to clientId. https://ringcentral.github.io/ringcentral-embeddable/docs/config/client-id/');
}
let isUsingDefaultClientId = false;
if (
  !authProxy &&
  apiConfig.clientId &&
  apiConfig.clientId === defaultApiConfig.appKey &&
  (
    window.location.hostname === 'ringcentral.github.io' ||
    window.location.hostname === 'apps.ringcentral.com'
  )
) {
  isUsingDefaultClientId = true;
  console.warn('Default RingCentral client id is deprecated, it is required to setup your own RingCentral Client Id, Please stop using it soon before it is completely removed. Please follow here to setup your own RingCentral app client id: https://ringcentral.github.io/ringcentral-embeddable/docs/app-registration/');
}
if (!authProxy && !apiConfig.clientId) {
  console.error('From v1.0.2, It is required to setup your own RingCentral Client Id. Please follow here to setup your own RingCentral app client id: https://ringcentral.github.io/ringcentral-embeddable/docs/app-registration/');
  // don't throw error in PR tests
  if (window.location.hostname !== 'localhost') {
    throw new Error('RingCentral App Client Id is required.');
  }
}

const appVersion = process.env.APP_VERSION;
const externalAppVersion = pathParams.appVersion || appVersion;

const {
  stylesUri,
  userAgent,
  enableAnalytics,
  authorizationCode,
  authorizationCodeVerifier,
  jwt,
  externalAuthId,
  defaultCallWith,
  enableFromNumberSetting,
  showMyLocationNumbers,
  enableSmsSettingEvent,
  disconnectInactiveWebphone,
  disableInactiveTabCallEvent,
  disableLoginPopup,
  multipleTabsSupport,
  enableWebRTCPlanB,
  brand,
  enableRingtoneSettings,
  disableNoiseReduction,
  showSignUpButton,
  defaultAutoLogCallEnabled,
  defaultAutoLogMessageEnabled,
  enableSMSTemplate,
  enableSmartNote,
  enableSideWidget,
  enableAudioInitPrompt,
  enableSharedMessages,
  enableLoadMoreCalls,
  mainTab,
} = pathParams;

const defaultBrand = brand || process.env.BRAND;
const brandConfig = process.env.BRAND_CONFIGS[defaultBrand];

if (process.env.NODE_ENV === 'production') {
  const styleName = 'app.css';
  const style = document.querySelector(`link[href="${styleName}"]`);
  if (!style) {
    const link = document.createElement("link");
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.href = styleName;
    document.head.appendChild(link);
  }
}

const redirectUri = pathParams.redirectUri || process.env.REDIRECT_URI;
const proxyUri = pathParams.proxyUri || process.env.PROXY_URI;
const disableCall = typeof pathParams.disableCall !== 'undefined';
const disableMessages = typeof pathParams.disableMessages !== 'undefined';
const disableReadText = typeof pathParams.disableReadText !== 'undefined';
const disableConferenceInvite = typeof pathParams.disableConferenceInvite === 'undefined' || pathParams.disableConferenceInvite === 'true';
const disableGlip = typeof pathParams.disableGlip === 'undefined' || pathParams.disableGlip === 'true';
const disableMeeting = typeof pathParams.disableMeeting !== 'undefined';
const disableContacts = typeof pathParams.disableContacts !== 'undefined';
const disableCallHistory = typeof pathParams.disableCallHistory !== 'undefined';

const prefix = pathParams.prefix || defaultPrefix;
const fromAdapter = !!pathParams.fromAdapter;
const fromPopup = !!pathParams.fromPopup;

const recordingLink = process.env.RECORDING_LINK;
const isExtensionLocalMode = window.location.protocol === 'chrome-extension:';

const phone = createPhone({
  apiConfig,
  brandConfig,
  prefix,
  appVersion,
  redirectUri,
  proxyUri,
  stylesUri,
  disableCall,
  disableMessages,
  disableReadText,
  disableConferenceInvite,
  disableGlip,
  disableMeeting,
  disableContacts,
  disableCallHistory,
  authProxy,
  userAgent,
  enableAnalytics,
  recordingLink,
  authorizationCode,
  jwt,
  authorizationCodeVerifier,
  defaultCallWith,
  disableInactiveTabCallEvent: !!disableInactiveTabCallEvent,
  enableFromNumberSetting: !!enableFromNumberSetting,
  showMyLocationNumbers: !!showMyLocationNumbers,
  enableSmsSettingEvent: !!enableSmsSettingEvent,
  disconnectInactiveWebphone: !!disconnectInactiveWebphone,
  disableLoginPopup: !!disableLoginPopup,
  multipleTabsSupport: !!multipleTabsSupport || fromPopup,
  enableWebRTCPlanB,
  forceCurrentWebphoneActive: mainTab === 'true' || (typeof mainTab === 'undefined' && fromPopup),
  fromPopup,
  enableRingtoneSettings,
  disableNoiseReduction: isExtensionLocalMode ? disableNoiseReduction !== 'false' : !!disableNoiseReduction, // default to disable noise reduction at extension local mode
  brandBaseUrl: process.env.HOSTING_URL ? process.env.HOSTING_URL : url.resolve(window.location.href, './'),
  showSignUpButton,
  defaultAutoLogCallEnabled,
  defaultAutoLogMessageEnabled,
  isUsingDefaultClientId,
  enableSMSTemplate,
  enableSmartNote,
  // enableSideWidget,
  enableAudioInitPrompt,
  enableSharedMessages,
  enableLoadMoreCalls,
  isMainTab: mainTab === 'true',
  autoMainTab: typeof mainTab === 'undefined',
  externalAuthId,
});

const store = createStore(phone.reducer);

phone.setStore(store);

window.phone = phone;

ReactDOM.render(
  <App
    phone={phone}
    showCallBadge={!fromAdapter}
    appVersion={externalAppVersion}
    fromPopup={fromPopup}
  />,
  document.querySelector('div#viewport'),
);
