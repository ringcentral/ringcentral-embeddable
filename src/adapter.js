import logoUrl from './assets/images/VIE_Logo_RC.svg';
import Adapter from './modules/Adapter';
import hostingUrl from './config/hostingUrl';
import brand from './config/brand';
import version from './config/version';

const appUrl = `${hostingUrl}/app.html`;

function init() {
  if (window.RCAdapter) {
    return;
  }
  window.RCAdapter = new Adapter({
    prefix: 'rc-integration',
    logoUrl,
    appUrl,
    brand,
    version,
  });
  setTimeout(() => {
    window.RCAdapter.init({
      size: { width: 300, height: 500 },
      minimized: false,
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
