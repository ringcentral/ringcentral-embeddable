import url from 'url';

import parseUri from './lib/parseUri';
import Adapter from './lib/Adapter';

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

const appUrl =  process.env.HOSTING_URL ?
 `${process.env.HOSTING_URL}/app.html` :
  url.resolve(currentScript.src, './app.html');

let paramsUri = (currentScript && currentScript.src) || '';
const fromPopup = window.__ON_RC_POPUP_WINDOW;
if (fromPopup) {
  paramsUri = window.location.href;
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
  authProxy,
  prefix,
  userAgent,
  newAdapterUI,
  analyticsKey,
  enableErrorReport,
  errorReportToken,
  errorReportSampleRate,
  errorReportProjectId,
  authorizationCode,
  authorizationCodeVerifier,
  defaultCallWith,
  enableFromNumberSetting,
  showMyLocationNumbers,
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
} = parseUri(paramsUri);

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
  authProxy,
  prefix,
  userAgent,
  analyticsKey,
  enableErrorReport,
  errorReportToken,
  errorReportSampleRate,
  errorReportProjectId,
  authorizationCode,
  authorizationCodeVerifier,
  defaultCallWith,
  enableFromNumberSetting,
  showMyLocationNumbers,
  disconnectInactiveWebphone,
  multipleTabsSupport,
  disableInactiveTabCallEvent,
  disableLoginPopup,
  enableWebRTCPlanB,
  fromAdapter: 1,
  fromPopup,
  enableRingtoneSettings,
  _t: Date.now(),
})}`;

function init() {
  if (window.RCAdapter) {
    return;
  }
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
  });
}

if (document.readyState === 'complete') {
  init();
} else {
  window.addEventListener('load', init);
}
