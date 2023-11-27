import classnames from 'classnames';
import url from 'url';
import popWindow from '@ringcentral-integration/widgets/lib/popWindow';
import AdapterCore from '@ringcentral-integration/widgets/lib/AdapterCore';
import { isSafari } from '@ringcentral-integration/utils';

import parseUri from '../parseUri';
import messageTypes from './messageTypes';
import requestWithPostMessage from '../requestWithPostMessage';

import styles from './styles.scss';
import Notification from '../notification';

// eslint-disable-next-line
import popupIconUrl from '!url-loader!../../assets/images/popup.svg';
import feedbackIconUrl from '!url-loader!../../assets/images/feedback.svg';
import { type } from 'os';

function checkValidImageUri(uri) {
  return (
    uri && (
      uri.indexOf('https://') === 0 ||
      uri.indexOf('http://') === 0 ||
      uri.indexOf('chrome-extension://') === 0 ||
      uri.indexOf('data:image') === 0
    )
  );
}
class Adapter extends AdapterCore {
  constructor({
    logoUrl,
    appUrl,
    iconUrl,
    prefix = 'rc-widget',
    version,
    appWidth = 300,
    appHeight = 500,
    zIndex = 999,
    enableNotification = false,
    newAdapterUI = false,
    fromPopup = false,
    enablePopup = false,
    disableMinimize = false,
    popupPageUri,
    defaultDirection = 'right',
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
      defaultDirection,
    });
    this._messageTypes = messageTypes;
    this._zIndex = zIndex;
    this._appWidth = appWidth;
    this._appHeight = appHeight;
    this._fromPopup = fromPopup;
    this._enablePopup = enablePopup;
    this._popupPageUri = popupPageUri;
    this._disableMinimize = disableMinimize;
    this._showFeedbackAtHead = false;
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
    if (logoUrl) {
      this._setLogoUrl(logoUrl);
    }
    if (iconUrl) {
      this._setIconUrl(iconUrl);
    }
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
    this._otherDeviceCallsLength = 0;

    this._showDockUI = newAdapterUI;

    this._webphoneActive = false;
    window.addEventListener('beforeunload', (e) => {
      if (this._webphoneActive && this._webphoneCalls.length > 0) {
        e.preventDefault;
        const message = 'Calls are active on this tab. Are you sure to leave?'
        e.returnValue = message;
        return message;
      }
    });
  }

  _onMessage(data) {
    if (data) {
      switch (data.type) {
        case 'rc-call-ring-notify':
          console.log('ring call:');
          console.log(data.call);
          this.setMinimized(false);
          this._updateWebphoneCalls(data.call);
          if (this._notification) {
            this._notification.notify({
              title: 'New Call',
              text: `Incoming Call from ${data.call.fromUserName || data.call.from}`,
              onClick() {
                window.focus();
              },
              icon: this._iconEl && this._iconEl.src,
            });
          }
          break;
        case 'rc-call-init-notify':
          console.log('init call:');
          console.log(data.call);
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
        case 'rc-call-hold-notify':
          console.log('hold call:');
          console.log(data.call);
          this._updateWebphoneCalls(data.call);
          break;
        case 'rc-call-resume-notify':
          console.log('resume call:');
          console.log(data.call);
          this._updateWebphoneCalls(data.call);
          break;
        case 'rc-call-mute-notify':
          // get call on call muted or unmuted event
          console.log('call muted changed:');
          console.log(data.call);
          break;
        case 'rc-webphone-active-notify':
          this._webphoneActive = data.currentActive;
          break;
        case 'rc-webphone-connection-status-notify':
          console.log('rc-webphone-connection-status-notify: ', data.connectionStatus);
          break;
        case 'rc-webphone-sessions-sync':
          console.log(data.calls); 
          break;
        case 'rc-login-status-notify':
          console.log('rc-login-status-notify:', data.loggedIn, data.loginNumber, data.contractedCountryCode);
          break;
        case 'rc-calling-settings-notify':
          console.log('rc-calling-settings-notify:', data.callWith, data.callingMode);
          break;
        case 'rc-region-settings-notify':
          console.log('rc-region-settings-notify:', data.countryCode, data.areaCode);
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
        case 'rc-callLogger-auto-log-notify':
          console.log('rc-callLogger-auto-log-notify:', data.autoLog);
          break;
        case 'rc-dialer-status-notify':
          console.log('rc-dialer-status-notify:', data.ready);
          break;
        case 'rc-meeting-status-notify':
          console.log('rc-meeting-status-notify:', data.ready, data.permission);
          break;
        case 'rc-brand-assets-notify':
          if (data.logoUri) {
            this._setLogoUrl(data.logoUri);
          }
          if (data.iconUri) {
            this._setIconUrl(data.iconUri);
          }
          break;
        default:
          super._onMessage(data);
          break;
      }
    }
  }

  _getContentDOM(sanboxAttributeValue, allowAttributeValue) {
    let sandboxAttributes = sanboxAttributeValue;
    if (isSafari()) {
      sandboxAttributes = sandboxAttributes.replace(' allow-downloads', '');
    }
    return `
      <header class="${this._styles.header}" draggable="false">
        <div class="${this._styles.presence} ${this._styles.NoPresence}">
          <div class="${this._styles.presenceBar}">
          </div>
        </div>
        <div class="${this._styles.iconContainer}">
          <img class="${this._styles.icon}" draggable="false"></img>
        </div>
        <div class="${this._styles.buttons}">
          <div class="${this._styles.button} ${this._styles.feedback}">
            <div class="${this._styles.feedbackIcon}" title="Feedback">
              <img src="${feedbackIconUrl}" draggable="false" />
            </div>
          </div>
          <div class="${this._styles.button} ${this._styles.popup}">
            <div class="${this._styles.popupIcon}">
              <img src="${popupIconUrl}" draggable="false" />
            </div>
          </div>
          <div class="${this._styles.button} ${this._styles.toggle}" data-sign="adapterToggle">
            <div class="${this._styles.minimizeIcon}">
              <div class="${this._styles.minimizeIconBar}"></div>
            </div>
          </div>
        </div>
        <img class="${this._styles.logo}" draggable="false"></img>
        <div class="${this._styles.duration}"></div>
        <div class="${this._styles.ringingCalls}"></div>
        <div class="${this._styles.onHoldCalls}"></div>
        <div class="${this._styles.currentCallBtn}"></div>
        <div class="${this._styles.viewCallsBtn}"></div>
      </header>
      <div class="${this._styles.dropdownPresence}">
        <div class="${this._styles.line}">
          <a class="${this._styles.presenceItem}" data-presence="available">
            <div class="${this._styles.presence} ${this._styles.statusIcon} ${this._styles.Available}">
            </div>
            <span>${this._strings.availableBtn}</span>
          </a>
          <a class="${this._styles.presenceItem}" data-presence="busy">
            <div class="${this._styles.presence} ${this._styles.statusIcon} ${this._styles.Busy}">
            </div>
            <span>${this._strings.busyBtn}</span>
          </a>
          <a class="${this._styles.presenceItem}" data-presence="doNotAcceptAnyCalls">
            <div class="${this._styles.presence} ${this._styles.statusIcon} ${this._styles.DoNotAcceptAnyCalls}">
              <div class="${this._styles.presenceBar}"></div>
            </div>
            <span>${this._strings.doNotAcceptAnyCallsBtn}</span>
          </a>
          <a class="${this._styles.presenceItem}" data-presence="offline">
            <div class="${this._styles.presence} ${this._styles.statusIcon} ${this._styles.Offline}">
            </div>
            <span>${this._strings.offlineBtn}</span>
          </a>
        </div>
      </div>
      <div class="${this._styles.frameContainer}">
        <iframe class="${this._styles.contentFrame}" sandbox="${sandboxAttributes}" allow="${allowAttributeValue}" >
        </iframe>
      </div>`;
  }

  _beforeRender() {
    this._iconEl = this._root.querySelector(
      `.${this._styles.icon}`
    );
    this._popupEl = this._root.querySelector(
      `.${this._styles.popup}`
    );
    this._iconEl.addEventListener('dragstart', () => false);
    this._iconContainerEl = this._root.querySelector(
      `.${this._styles.iconContainer}`
    );
    this._popupEl.addEventListener('click', (evt) => {
      evt.stopPropagation();
      this.popupWindow();
    });
  }

  _renderMainClass() {
    this._container.setAttribute('class', classnames(
      this._styles.root,
      this._styles[this._defaultDirection],
      this._closed && this._styles.closed,
      this._minimized && this._styles.minimized,
      this._dragging && this._styles.dragging,
      this._hover && this._styles.hover,
      this._loading && this._styles.loading,
      this._showDockUI && this._styles.dock,
      this._showDockUI && this._minimized && (this._hoverHeader || this._dragging) && this._styles.expandable,
      this._showDockUI && (!(this._userStatus || this._dndStatus)) && this._styles.noPresence,
      this._enablePopup && this._styles.showPopup,
      this._disableMinimize && this._styles.hideToggleButton,
      this._showFeedbackAtHead && this._styles.showFeedback,
    ));
    this._headerEl.setAttribute('class', classnames(
      this._styles.header,
      this._minimized && this._styles.minimized,
      this._ringing && this._styles.ringing,
      (
        this._showDockUI && this._minimized &&
        (this._hoverHeader || this._dragging) &&
        this._styles.iconTrans
      )
    ));
    this._iconContainerEl.setAttribute('class', classnames(
      this._styles.iconContainer,
      (!(this._userStatus || this._dndStatus)) && this._styles.noPresence,
      (!this._showDockUI) && this._styles.hidden,
    ));
  }

  renderAdapterSize() {
    super.renderAdapterSize();
    if (this._fromPopup) {
      this._contentFrameContainerEl.style.width = '100%';
      this._contentFrameContainerEl.style.height = 'calc(100% - 36px)';
      this._contentFrameEl.style.width = '100%';
      this._contentFrameEl.style.height = '100%';
    }
  }

  renderPosition() {
    if (this._fromPopup) {
      return;
    }
    const factor = this._calculateFactor();
    if (this._minimized) {
      if (this._showDockUI) {
        this._container.setAttribute(
          'style',
          `transform: translate(0px, ${this._minTranslateY}px)!important; z-index: ${this._zIndex};`,
        );
      } else {
        this._container.setAttribute(
          'style',
          `transform: translate( ${this._minTranslateX * factor}px, ${-this._padding}px)!important;`
        );
      }
    } else {
      this._container.setAttribute(
        'style',
        `transform: translate(${this._translateX * factor}px, ${this._translateY}px)!important; z-index: ${this._zIndex};`,
      );
    }
  }

  _syncPosition() {
    if (this._fromPopup) {
      return;
    }
    super._syncPosition();
  }

  _onHeaderClicked() {
    if (!this._minimized) return;
    this.toggleMinimized();
  }

  _setAppUrl(appUrl) {
    this._appUrl = appUrl;
    const { protocol, host } = url.parse(appUrl, false);
    this._appOrigin = `${protocol}//${host}`;
    if (appUrl) {
      this.contentFrameEl.src = appUrl;
      this.contentFrameEl.id = `${this._prefix}-adapter-frame`;
    }
  }

  _setIconUrl(iconUrl) {
    if (!checkValidImageUri(iconUrl)) {
      return;
    }
    this._iconEl.src = iconUrl;
  }

  _setLogoUrl(logoUri) {
    if (!checkValidImageUri(logoUri)) {
      return;
    }
    super._setLogoUrl(logoUri);
  }

  async popupWindow() {
    if (!this._popupWindowPromise) {
      this._popupWindowPromise = this._popupWindow();
    }
    try {
      await this._popupWindowPromise;
    } catch (e) {
      console.error(e);
    }
    this._popupWindowPromise = null;
  }

  async _popupWindow() {
    const isWindowPoppedUp = await this.isWindowPoppedUp({ alert: true });
    if (isWindowPoppedUp) {
      if (this._popupedWindow && this._popupedWindow.focus) {
        this._popupedWindow.focus();
      }
      return;
    }
    let popupUri = this._appUrl.replace('app.html', 'popup.html');
    if (this._popupPageUri) {
      popupUri = `${this._popupPageUri}?${popupUri.split('?')[1]}`; 
    }
    this._popupedWindow = popWindow(popupUri, 'RCPopupWindow', 300, 535);
    this.setMinimized(true);
  }

  isWindowPoppedUp({ alert = false } = {}) {
    return this._requestWithPostMessage('/check-popup-window', { alert });
  }

  _onPushAdapterState(options) {
    if (!this._fromPopup) {
      return super._onPushAdapterState(options);
    }
    return super._onPushAdapterState({
      ...options,
      minimized: false,
    });
  }

  _postMessage(data) {
    if (this._contentFrameEl.contentWindow) {
      this._contentFrameEl.contentWindow.postMessage(data, this._appOrigin);
    }
  }

  _requestWithPostMessage(path, body) {
    return requestWithPostMessage(
      path,
      body,
      5000,
      this._contentFrameEl.contentWindow,
      'rc-adapter-message'
    );
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

  clickToSMS(phoneNumber, text, conversation) {
    this.setMinimized(false);
    this._postMessage({
      type: 'rc-adapter-new-sms',
      phoneNumber,
      text,
      conversation,
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

  updateCallingSetting({ callWith, myLocation, ringoutPrompt, fromNumber }) {
    this._postMessage({
      type: 'rc-calling-settings-update',
      callWith,
      myLocation,
      ringoutPrompt,
      fromNumber,
    });
  }

  navigateTo(path) {
    this._postMessage({
      type: 'rc-adapter-navigate-to',
      path,
    });
  }

  scheduleMeeting(meetingInfo) {
    return this._requestWithPostMessage('/schedule-meeting', meetingInfo);
  }

  _updateWidgetCurrentPath(path) {
    this._widgetCurrentPath = path;
    this._updateCallBarStatus();
  }

  _updateWebphoneCalls(webphoneCall) {
    const cleanCalls = this._webphoneCalls.filter(c => c.id !== webphoneCall.id);
    // When call is ended
    if (webphoneCall.endTime) {
      if (webphoneCall.id === this._currentWebhoneCallId && cleanCalls.length > 0) {
        const currentCall = cleanCalls.find(c => c.callStatus !== 'webphone-session-connecting');
        this._currentStartTime = (currentCall && currentCall.startTime) || 0;
        this._currentWebhoneCallId = currentCall && currentCall.id;
      }
      if (cleanCalls.length === 0) {
        this._currentStartTime = 0;
        this._currentWebhoneCallId = null;
      }
      this._webphoneCalls = cleanCalls;
    } else {
      if (webphoneCall.callStatus !== 'webphone-session-setup') {
        this._webphoneCalls = [webphoneCall].concat(cleanCalls);
      }
      if (webphoneCall.callStatus === 'webphone-session-connected') {
        this._currentWebhoneCallId = webphoneCall.id;
        this._currentStartTime = webphoneCall.startTime;
      }
    }
    this._updateCallBarStatus();
  }

  _updateCallBarStatus() {
    const activeCalls = this._webphoneCalls.filter(
      c => c.callStatus !== 'webphone-session-connecting' || c.direction === 'Inbound'
    );
    this._hasActiveCalls = activeCalls.length > 0;
    const ringingCalls = this._webphoneCalls.filter(
      c => c.callStatus === 'webphone-session-connecting' && c.direction === 'Inbound'
    );
    this._ringingCallsLength = ringingCalls.length;
    const holdedCalls = this._webphoneCalls.filter(
      c => c.callStatus === 'webphone-session-onHold'
    );
    this._onHoldCallsLength = holdedCalls.length;
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

  _renderOnHoldCalls() {
    if (!this._onHoldCallsLength || !this._strings) {
      return;
    }
    let onHoldCallsInfo = this._strings.onHoldCallsInfo || '';
    onHoldCallsInfo = onHoldCallsInfo.replace('0', String(this._onHoldCallsLength));
    this._onHoldCallsEl.innerHTML = onHoldCallsInfo;
    this._onHoldCallsEl.title = onHoldCallsInfo;
  }

  _renderCallsBar() {
    super._renderCallsBar();
    if (this._minimized) {
      return;
    }
    this._currentCallEl.setAttribute('class', classnames(
      this._styles.currentCallBtn,
      this.showCurrentCallBtn && this._styles.visible,
      (!this.centerDuration) && this.moveOutCurrentCallBtn && this._styles.moveOut,
      (!this.centerDuration) && this.moveInCurrentCallBtn && this._styles.moveIn,
    ));
  }

  showFeedback({
    onFeedback
  }) {
    if (typeof onFeedback !== 'function') {
      throw new Error('onFeedback function is required.');
    }
    this._showFeedbackAtHead = true;
    this._renderMainClass();
    this._feedbackEl = this._root.querySelector(
      `.${this._styles.feedback}`
    );
    this._feedbackEl.addEventListener('click', (evt) => {
      evt.stopPropagation();
      onFeedback();
    });
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
