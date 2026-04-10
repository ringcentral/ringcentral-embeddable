import Adapter from './lib/Adapter';
import { parseUri } from './lib/Adapter/parseUri';

declare const process: {
  env: Record<string, string | undefined>;
};

declare global {
  interface Window {
    RCAdapter?: Adapter | null;
    RCAdapterInit?: typeof init;
    RCAdapterDispose?: () => void;
    RC_EMBEDDABLE_ADAPTER_MANUAL_INIT?: boolean;
    __ON_RC_POPUP_WINDOW?: number | boolean;
  }
}

const defaultPrefix = process.env.PREFIX;

if (
  typeof NodeList !== 'undefined' &&
  NodeList.prototype &&
  !NodeList.prototype.forEach
) {
  (NodeList.prototype as any).forEach = Array.prototype.forEach;
}

const version = process.env.APP_VERSION;
const adapterName = process.env.ADAPTER_NAME;

let currentScript = document.currentScript as HTMLScriptElement | null;
if (!currentScript) {
  currentScript = document.querySelector(
    `script[src*="${adapterName}"]`,
  ) as HTMLScriptElement | null;
}

function getBrandFromAdapterName() {
  const name = adapterName.split('.')[1];
  if (name === 'js' || name === 'min') {
    return undefined;
  }
  return name;
}

function getDefaultAppUrl() {
  if (process.env.HOSTING_URL) {
    return `${process.env.HOSTING_URL}/app.html`;
  }
  if (currentScript?.src) {
    return new URL('./app.html', currentScript.src).toString();
  }
  return null;
}

function obj2uri(obj?: Record<string, unknown>) {
  if (!obj) {
    return '';
  }
  const urlParams: string[] = [];
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (value) {
      urlParams.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
      );
    }
  });
  return urlParams.join('&');
}

let paramsUri = currentScript?.src || '';
const fromPopup = window.__ON_RC_POPUP_WINDOW;
if (fromPopup) {
  paramsUri = window.location.href;
}

function init({
  appUrl = getDefaultAppUrl(),
  options = parseUri(paramsUri),
}: {
  appUrl?: string | null;
  options?: Record<string, string>;
} = {}) {
  if (window.RCAdapter || !appUrl) {
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
    window.addEventListener('load', () => init());
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
