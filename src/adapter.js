import url from 'url';

// eslint-disable-next-line
import logoUrl from '!url-loader!brand-logo-path/logo.svg';
// eslint-disable-next-line
import iconUrl from '!url-loader!brand-logo-path/icon.svg';

import parseUri from './lib/parseUri';
import Adapter from './lib/Adapter';

const defaultPrefix = process.env.PREFIX;
// TODO: fix: polyfill NodeList forEach
if (typeof NodeList !== 'undefined' && NodeList.prototype && !NodeList.prototype.forEach) {
  NodeList.prototype.forEach = Array.prototype.forEach;
}

const version = process.env.APP_VERSION;

let currentScript = document.currentScript;
if (!currentScript) {
  currentScript = document.querySelector('script[src*="adapter.js"]');
}

const appUrl =  process.env.HOSTING_URL ?
 `${process.env.HOSTING_URL}/app.html` :
  url.resolve(currentScript.src, './app.html');

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
  disableConferenceCall,
  disableMeeting,
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
  defaultCallWith,
  enableFromNumberSetting,
  disconnectInactiveWebphone,
  disableInactiveTabCallEvent,
  disableLoginPopup,
  zIndex,
} = parseUri((currentScript && currentScript.src) || '');

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
  appServer,
  appVersion,
  redirectUri,
  proxyUri,
  stylesUri,
  disableCall,
  disableMessages,
  disableReadText,
  disableConferenceInvite,
  disableGlip,
  disableConferenceCall,
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
  defaultCallWith,
  enableFromNumberSetting,
  disconnectInactiveWebphone,
  disableInactiveTabCallEvent,
  disableLoginPopup,
  fromAdapter: 1,
  _t: Date.now(),
})}`;

function init() {
  if (window.RCAdapter) {
    return;
  }
  window.RCAdapter = new Adapter({
    logoUrl,
    iconUrl,
    appUrl: appUri,
    version,
    prefix: prefix || defaultPrefix,
    enableNotification: !!notification,
    newAdapterUI: !!newAdapterUI,
    zIndex: zIndex ? Number.parseInt(zIndex, 10) : 999,
  });
}

if (document.readyState === 'complete') {
  init();
} else {
  window.addEventListener('load', init);
}
