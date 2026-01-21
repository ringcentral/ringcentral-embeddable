import url from 'url';

import Adapter from './lib/Adapter';
import parseUri from './lib/parseUri';

const defaultPrefix = process.env.PREFIX;
// TODO: fix: polyfill NodeList forEach
if (typeof NodeList !== 'undefined' && NodeList.prototype && !NodeList.prototype.forEach) {
  NodeList.prototype.forEach = Array.prototype.forEach;
}

const version = process.env.APP_VERSION;

let currentScript = document.currentScript;
const adapterName = process.env.ADAPTER_NAME;
if (!currentScript) {
  currentScript = document.querySelector(`script[src*="${adapterName}"]`);
}

function getBrandFromAdapterName() {
  const name = adapterName.split('.')[1];
  if (name === 'js' || name === 'min') {
    return;
  }
  return name;
}

function getDefaultAppUrl() {
  if (process.env.HOSTING_URL) {
    return `${process.env.HOSTING_URL}/app.html`;
  }
  if (currentScript) {
    return url.resolve(currentScript.src, './app.html');
  }
  return null;
}

let paramsUri = (currentScript && currentScript.src) || '';
const fromPopup = window.__ON_RC_POPUP_WINDOW;
if (fromPopup) {
  paramsUri = window.location.href;
}

function obj2uri(obj) {
  if (!obj) {
    return '';
  }
  const urlParams = [];
  Object.keys(obj).forEach((key) => {
    if (obj[key]) {
      urlParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`);
    }
  });
  return urlParams.join('&');
}

function init({
  appUrl = getDefaultAppUrl(),
  options = parseUri(paramsUri),
} = {}) {
  if (window.RCAdapter) {
    return;
  }
  if (!appUrl) {
    return;
  }
  const {
    appKey,
    clientId,
    appSecret,
    clientSecret,
    appServer,
    appVersion,
    redirectUri,
    proxyUri,
    stylesUri,
    notification,
    disableCall,
    disableMessages,
    disableReadText,
    disableConferenceInvite,
    disableGlip,
    disableMeeting,
    disableMinimize,
    disableContacts,
    disableCallHistory,
    authProxy,
    prefix,
    userAgent,
    newAdapterUI,
    enableAnalytics,
    enableErrorReport,
    errorReportToken,
    errorReportSampleRate,
    errorReportProjectId,
    authorizationCode,
    authorizationCodeVerifier,
    jwt,
    externalAuthId,
    defaultCallWith,
    enableFromNumberSetting,
    showMyLocationNumbers,
    enableSmsSettingEvent,
    disconnectInactiveWebphone,
    multipleTabsSupport,
    disableInactiveTabCallEvent,
    disableLoginPopup,
    enableWebRTCPlanB,
    zIndex,
    discovery,
    discoverAppServer,
    enablePopup,
    popupPageUri,
    enableRingtoneSettings,
    disableNoiseReduction,
    showSignUpButton,
    defaultDirection,
    defaultAutoLogCallEnabled,
    defaultAutoLogMessageEnabled,
    enableSMSTemplate,
    enableSmartNote,
    enableAudioInitPrompt,
    enableLoadMoreCalls,
    mainTab,
    enableSharedMessages,
    enableSideWidget,
    enableVoicemailDrop,
    enableTypingTimeTracking,
  } = options;
  const appUri = `${appUrl}?${obj2uri({
    appKey,
    clientId,
    appSecret,
    clientSecret,
    brand: getBrandFromAdapterName(),
    appServer,
    discovery,
    discoverAppServer,
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
    prefix,
    userAgent,
    enableAnalytics,
    enableErrorReport,
    errorReportToken,
    errorReportSampleRate,
    errorReportProjectId,
    authorizationCode,
    authorizationCodeVerifier,
    jwt,
    externalAuthId,
    defaultCallWith,
    enableFromNumberSetting,
    showMyLocationNumbers,
    enableSmsSettingEvent,
    disconnectInactiveWebphone,
    multipleTabsSupport,
    disableInactiveTabCallEvent,
    disableLoginPopup,
    enableWebRTCPlanB,
    fromAdapter: 1,
    fromPopup,
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
    enableVoicemailDrop,
    mainTab,
    enableTypingTimeTracking,
    _t: Date.now(),
  })}`;
  window.RCAdapter = new Adapter({
    appUrl: appUri,
    version,
    prefix: prefix || defaultPrefix,
    enableNotification: !!notification,
    newAdapterUI: !!newAdapterUI,
    zIndex: zIndex ? Number.parseInt(zIndex, 10) : 999,
    fromPopup: !!fromPopup,
    disableMinimize,
    enablePopup,
    popupPageUri,
    defaultDirection,
  });
}

if (!window.RC_EMBEDDABLE_ADAPTER_MANUAL_INIT) {
  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init);
  }
}

window.RCAdapterInit = init;
window.RCAdapterDispose = () => {
  if (!window.RCAdapter) {
    return;
  }
  window.RCAdapter.dispose();
  window.RCAdapter = null;
};
