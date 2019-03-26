import classnames from 'classnames';
import AdapterCore from 'ringcentral-widgets/lib/AdapterCore';
import parseUri from '../parseUri';
import messageTypes from './messageTypes';

import styles from './styles.scss';
import Notification from '../notification';

class Adapter extends AdapterCore {
  constructor({
    logoUrl,
    appUrl,
    prefix = 'rc-widget',
    version,
    appWidth = 300,
    appHeight = 500,
    zIndex = 999,
    enableNotification = false,
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
    this._strings = {};
    this._generateContentDOM();
    const styleList = document.querySelectorAll('style');
    for (let i = 0; i < styleList.length; ++i) {
      const styleEl = styleList[i];
      if (styleEl.innerHTML.indexOf('https://{{rc-styles}}') > -1) {
        this.styleEl = styleEl;
      }
    }
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

    document.addEventListener('click', (event) => {
      let target = event.target;
      if (!target) {
        return;
      }
      if (target && !target.href) {
        target = target.parentElement;
      }
      if (target && !target.href) {
        target = target.parentElement;
      }
      if (!target) {
        return;
      }
      if (target.matches('a[href^="sms:"]')) {
        event.preventDefault();
        const hrefStr = target.href;
        const pathStr = hrefStr.split('?')[0];
        const { text, body } = parseUri(hrefStr);
        const phoneNumber = pathStr.replace(/[^\d+*-]/g, '');
        this.clickToSMS(phoneNumber, body || text);
      } else if (target.matches('a[href^="tel:"]')) {
        event.preventDefault();
        const hrefStr = target.href;
        const phoneNumber = hrefStr.replace(/[^\d+*-]/g, '');
        this.clickToCall(phoneNumber, true);
      }
    }, false);

    if (enableNotification) {
      this._notification = new Notification();
    }
    this._widgetCurrentPath = '';
    this._webphoneCalls = [];
    this._currentStartTime = 0;
    this._ringingCallsLength = 0;
    this._onHoldCallsLength = 0;
    this._hasActiveCalls = false;
  }

  _onMessage(data) {
    if (data) {
      switch (data.type) {
        case 'rc-call-ring-notify':
          console.log('ring call:');
          console.log(data.call);
          this.setMinimized(false);
          if (this._notification) {
            this._notification.notify({
              title: 'New Call',
              text: `Incoming Call from ${data.call.fromUserName || data.call.from}`,
              onClick() {
                window.focus();
              }
            });
          }
          this._updateWebphoneCalls(data.call);
          break;
        case 'rc-call-start-notify':
          console.log('start call:');
          console.log(data.call);
          this._updateWebphoneCalls(data.call);
          break;
        case 'rc-call-end-notify':
          console.log('end call:');
          console.log(data.call);
          this._updateWebphoneCalls(data.call);
          break;
        case 'rc-login-status-notify':
          console.log('rc-login-status-notify:', data.loggedIn);
          break;
        case 'rc-active-call-notify':
          console.log('rc-active-call-notify:', data.call);
          break;
        case 'rc-ringout-call-notify':
          console.log('rc-ringout-call-notify:', data.call);
          break;
        case 'rc-inbound-message-notify':
          console.log('rc-inbound-message-notify:', data.message.id);
          break;
        case 'rc-message-updated-notify':
          console.log('rc-message-updated-notify:', data.message.id);
          break;
        case 'rc-route-changed-notify':
          this._updateWidgetCurrentPath(data.path);
          console.log('rc-route-changed-notify:', data.path);
          break;
        default:
          super._onMessage(data);
          break;
      }
    }
  }

  _onHeaderClicked() {
    //
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

  clickToSMS(phoneNumber, text) {
    this.setMinimized(false);
    this._postMessage({
      type: 'rc-adapter-new-sms',
      phoneNumber,
      text,
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

  logoutUser() {
    this._postMessage({
      type: 'rc-adapter-logout',
    });
  }

  // TODO: remove console.log in parent class
  _onPushLocale({
    locale,
    strings = {},
  }) {
    this._locale = locale;
    this._strings = strings;
    this._renderString();
  }

  _updateWidgetCurrentPath(path) {
    this._widgetCurrentPath = path;
    this._updateCallBarStatus();
  }

  _updateWebphoneCalls(webphoneCall) {
    const cleanCalls = this._webphoneCalls.filter(c => c.id !== webphoneCall.id);
    // When call is ended
    if (webphoneCall.endTime) {
      this._webphoneCalls = cleanCalls;
    } else {
      if (webphoneCall.callStatus === 'webphone-session-connected') {
        this._currentStartTime = webphoneCall.startTime;
      }
      this._webphoneCalls = [webphoneCall].concat(cleanCalls);
    }
    this._updateCallBarStatus();
  }

  _updateCallBarStatus() {
    this._hasActiveCalls = this._webphoneCalls.length > 0;
    const ringingCalls = this._webphoneCalls.filter(
      c => c.callStatus === 'webphone-session-connecting' && c.direction === 'Inbound'
    );
    this._ringingCallsLength = ringingCalls.length;
    this.renderCallsBar();
  }

  _renderRingingCalls() {
    if (!this._ringingCallsLength || !this._strings) {
      return;
    }
    let ringCallsStrings = this._strings.ringCallsInfo || '';
    ringCallsStrings = ringCallsStrings.replace('0', String(this._ringingCallsLength));
    this._ringingCallsEl.innerHTML = ringCallsStrings;
    this._ringingCallsEl.title = ringCallsStrings;
  }

  get showCurrentCallBtn() {
    return this._widgetCurrentPath.indexOf('/calls/active') === -1 && this.showDuration;
  }

  get showViewCallsBtn() {
    return this._widgetCurrentPath !== '/calls' && (this.showOnHoldCalls || this.showRingingCalls);
  }

  get centerDuration() {
    return this._widgetCurrentPath.indexOf('/calls/active') > -1;
  }

  get centerCallInfo() {
    return this._widgetCurrentPath === '/calls';
  }
}

export default Adapter;
