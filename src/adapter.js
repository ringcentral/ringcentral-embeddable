import parseUri from './lib/parseUri';
import logoUrl from './assets/images/VIE_Logo_RC.svg';
import Adapter from './modules/Adapter';
import brand from './config/brand';

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
  _t: Date.now(),
})}`;

function init() {
  if (window.RCAdapter) {
    return;
  }
  window.RCAdapter = new Adapter({
    prefix: 'rc-integration',
    logoUrl,
    appUrl: appUri,
    brand,
    version,
  });
  setTimeout(() => {
    window.RCAdapter.init({
      size: { width: 300, height: 500 },
      minimized: true,
      closed: false,
      position: { translateX: 700, translateY: 20, minTranslateX: 0 }
    });
  }, 2000);
}

if (document.readyState === 'complete') {
  init();
} else {
  window.addEventListener('load', init);
}
