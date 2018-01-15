import classnames from 'classnames';
import AdapterCore from 'ringcentral-widgets/lib/AdapterCore';
import messageTypes from './messageTypes';

import styles from './styles.scss';

class Adapter extends AdapterCore {
  constructor({
    logoUrl,
    appUrl,
    prefix = 'rc-widget',
    version,
    appWidth = 300,
    appHeight = 500,
    zIndex = 999,
  } = {}) {
    const container = document.createElement('div');
    container.id = prefix;
    container.setAttribute('class', classnames(styles.root, styles.loading));
    container.draggable = false;
    super({
      prefix,
      container,
      styles,
      messageTypes,
      defaultDirection: 'right',
    });
    this._messageTypes = messageTypes;
    this._zIndex = zIndex;
    this._appWidth = appWidth;
    this._appHeight = appHeight;
    this._generateContentDOM();
    this.styleEl = Array.from(document.querySelectorAll('style'))
      .find(el => el.innerHTML.indexOf('https://{{rc-styles}}') > -1);
    if (this.styleEl) {
      this._root.appendChild(this.styleEl.cloneNode(true));
    }
    this._setAppUrl(appUrl);
    this._setLogoUrl(logoUrl);

    this._version = version;
    window.addEventListener('message', (e) => {
      const data = e.data;
      this._onMessage(data);
    });

    const phoneCallTags = window.document.querySelectorAll('a[href^="tel:"]');
    for (let i = 0; i < phoneCallTags.length; ++i) {
      const phoneTag = phoneCallTags[i];
      phoneTag.addEventListener('click', () => {
        const hrefStr = phoneTag.getAttribute('href');
        const phoneNumber = hrefStr.replace(/[^\d+*-]/g, '');
        this.clickToCall(phoneNumber, true);
      });
    }
    const phoneSMSTags = window.document.querySelectorAll('a[href^="sms:"]');
    for (let i = 0; i < phoneSMSTags.length; ++i) {
      const phoneTag = phoneSMSTags[i];
      phoneTag.addEventListener('click', () => {
        const hrefStr = phoneTag.getAttribute('href');
        const phoneNumber = hrefStr.replace(/[^\d+*-]/g, '');
        this.clickToSMS(phoneNumber);
      });
    }
  }

  _onMessage(data) {
    if (data) {
      switch (data.type) {
        case 'rc-call-ring-notify':
          console.log('ring call:');
          console.log(data.call);
          this.setMinimized(false);
          break;
        case 'rc-call-start-notify':
          console.log('start call:');
          console.log(data.call);
          break;
        case 'rc-call-end-notify':
          console.log('end call:');
          console.log(data.call);
          break;
        case 'rc-login-status-notify':
          console.log('rc-login-status-notify:', data.loggedIn);
          break;
        default:
          super._onMessage(data);
          break;
      }
    }
  }

  _setAppUrl(appUrl) {
    this._appUrl = appUrl;
    if (appUrl) {
      this.contentFrameEl.src = appUrl;
      this.contentFrameEl.id = `${this._prefix}-adapter-frame`;
    }
  }

  _postMessage(data) {
    if (this._contentFrameEl.contentWindow) {
      this._contentFrameEl.contentWindow.postMessage(data, '*');
    }
  }

  setRinging(ringing) {
    this._ringing = !!ringing;
    this._renderMainClass();
  }

  gotoPresence() {
    this._postMessage({
      type: 'rc-adapter-goto-presence',
      version: this._version,
    });
  }

  setEnvironment() {
    this._postMessage({
      type: 'rc-adapter-set-environment',
    });
  }

  clickToSMS(phoneNumber) {
    this.setMinimized(false);
    this._postMessage({
      type: 'rc-adapter-new-sms',
      phoneNumber,
    });
  }

  clickToCall(phoneNumber, toCall = false) {
    this.setMinimized(false);
    this._postMessage({
      type: 'rc-adapter-new-call',
      phoneNumber,
      toCall,
    });
  }

  controlCall(action, id) {
    this._postMessage({
      type: 'rc-adapter-control-call',
      callAction: action,
      callId: id,
    });
  }
}

export default Adapter;
