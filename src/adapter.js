import parseUri from './lib/parseUri';
import logoUrl from './assets/images/VIE_Logo_RC.svg';
import Adapter from './lib/Adapter';
import defaultPrefix from './config/prefix';

const version = process.env.APP_VERSION;
const appUrl = `${process.env.HOSTING_URL}/app.html`;

let currentScipt = document.currentScript;
if (!currentScipt) {
  currentScipt = document.querySelector('script[src*="adapter.js"]');
}
const {
  appKey,
  appSecret,
  appServer,
  redirectUri,
  proxyUri,
  stylesUri,
  notification,
  disableCall,
  disableMessages,
  disableConferenceInvite,
  disableGlip,
  disableConferenceCall,
  authMode,
  prefix,
} = parseUri((currentScipt && currentScipt.src) || '');

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
  appSecret,
  appServer,
  redirectUri,
  proxyUri,
  stylesUri,
  disableCall,
  disableMessages,
  disableConferenceInvite,
  disableGlip,
  disableConferenceCall,
  authMode,
  prefix,
  _t: Date.now(),
})}`;

function init() {
  if (window.RCAdapter) {
    return;
  }
  window.RCAdapter = new Adapter({
    logoUrl,
    appUrl: appUri,
    version,
    prefix: prefix || defaultPrefix,
    enableNotification: !!notification,
  });
}

if (document.readyState === 'complete') {
  init();
} else {
  window.addEventListener('load', init);
}
