import classnames from 'classnames';
import { presenceStatus } from '@ringcentral-integration/commons/enums/presenceStatus.enum';
import debounce from '@ringcentral-integration/commons/lib/debounce';
import ensureExist from '@ringcentral-integration/commons/lib/ensureExist';
import { formatDuration } from '@ringcentral-integration/commons/lib/formatDuration';
import { dndStatus } from '@ringcentral-integration/commons/modules/Presence';
import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';
import { isSafari } from '@ringcentral-integration/utils';

import popWindow from '../popWindow';
import { parseUri } from './parseUri';
import messageTypes from './messageTypes';
import requestWithPostMessage from '../requestWithPostMessage';

import styles from './styles.scss';
import Notification from '../notification';

import popupIconUrl from '../../assets/images/popup.svg?url';
import helpIconUrl from '../../assets/images/help.svg?url';

const SANDBOX_ATTRIBUTE_VALUE = [
  'allow-same-origin',
  'allow-scripts',
  'allow-forms',
  'allow-popups',
  'allow-downloads',
].join(' ');

const ALLOW_ATTRIBUTE_VALUE = ['microphone', 'autoplay'].join('; ');

const urlRegex =
  /(https:\/\/)?(?:www\.)?outlook\.office(?:365)?\.com\/(mail)\/(deeplink)/;
const clickEvent = urlRegex.test(location.href) ? 'mousedown' : 'click';

const ON_HOLD_CALLS = 0;
const RINGING_CALLS = 1;
const CURRENT_CALL = 2;
const OTHER_DEVICE_CALLS = 3;

const ROTATE_LENGTH = 4;
const ROTATE_INTERVAL = 5000;

function checkValidImageUri(uri: string): boolean {
  return (
    !!uri &&
    (uri.indexOf('https://') === 0 ||
      uri.indexOf('http://') === 0 ||
      uri.indexOf('chrome-extension://') === 0 ||
      uri.indexOf('data:image') === 0)
  );
}

function isCurrentCallPath(path: string): boolean {
  return typeof path === 'string' && path.indexOf('/calling') === 0;
}

function isViewCallsPath(path: string): boolean {
  return typeof path === 'string' && path.indexOf('/history') === 0;
}

class Adapter {
  currentState: number = -1;
  callInfoMap: Record<number, boolean> = {};
  lastState: number = -1;

  private _otherDeviceCallsLength: number = 0;
  private _onHoldCallsLength: number = 0;
  private _ringingCallsLength: number = 0;
  private _currentStartTime: number = 0;
  private _otherDeviceCallsEl!: HTMLElement;
  private _onHoldCallsEl!: HTMLElement;
  private _ringingCallsEl!: HTMLElement;
  private _durationEl!: HTMLElement;
  private _currentCallEl!: HTMLElement;
  private _viewCallsEl!: HTMLElement;
  private _scrollable: boolean = false;
  private _hoverBar: any;
  private _onAllCallsPath: any;
  private _onCurrentCallPath: any;

  _prefix: any;
  _messageTypes: any;
  _container: any;
  _root!: HTMLElement;
  _styles: any;
  _defaultDirection: string = 'right';
  _padding: number = 15;
  _minTranslateX: number = 0;
  _minTranslateY: number = 0;
  _translateX: number = 0;
  _translateY: number = 0;
  _appWidth: number = 300;
  _appHeight: number = 500;
  _dragStartPosition: any = null;
  _closed: boolean = true;
  _minimized: boolean = true;
  _dragging: boolean = false;
  _hover: boolean = false;
  _hoverHeader: boolean = false;
  _loading: boolean = true;
  _userStatus: any = null;
  _dndStatus: any = null;
  _telephonyStatus: any = null;
  _presenceOption: any = null;
  _headerEl?: HTMLElement;
  _logoEl: any;
  _contentFrameContainerEl: any;
  _toggleEl: any;
  _closeEl: any;
  _presenceEl: any;
  _presenceItemEls: any;
  _dropdownPresence: any;
  _contentFrameEl: any;
  _isClick: boolean = true;
  _resizeTimeout: any;
  _resizeTick: any;
  _messageTransport: any;
  _logoUrl: any;
  _appUrl: any;
  _ringing: any;
  _hasActiveCalls: boolean = false;
  _locale: any;
  _themeVariableString: string = '';
  rotateInterval: number = 0;
  durationInterval: number = 0;

  _zIndex: number;
  _fromPopup: boolean;
  _enablePopup: boolean;
  _popupPageUri: any;
  _disableMinimize: boolean;
  _showFeedbackAtHead: boolean;
  _strings: any;
  _theme: string;
  _showDockUI: boolean;
  _webphoneActive: boolean;
  _widgetCurrentPath: string;
  _webphoneCalls: any[];
  _currentWebhoneCallId: any;
  _notification: any;
  _version: any;
  _appOrigin: string = '';
  _popupWindowPromise: any;
  _popupedWindow: any;
  _feedbackEl: any;
  _iconEl: any;
  _popupEl: any;
  _iconContainerEl: any;
  styleEl: any;

  protected _beforeRender(): void {
    this._iconEl = this._root.querySelector(`.${this._styles.icon}`);
    this._popupEl = this._root.querySelector(`.${this._styles.popup}`);
    this._iconEl.addEventListener('dragstart', () => false);
    this._iconContainerEl = this._root.querySelector(
      `.${this._styles.iconContainer}`,
    );
    this._popupEl.addEventListener('click', (evt: MouseEvent) => {
      evt.stopPropagation();
      this.popupWindow();
    });
  }

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
  }: {
    logoUrl?: string;
    appUrl: string;
    iconUrl?: string;
    prefix?: string;
    version?: string;
    appWidth?: number;
    appHeight?: number;
    zIndex?: number;
    enableNotification?: boolean;
    newAdapterUI?: boolean;
    fromPopup?: boolean;
    enablePopup?: boolean;
    disableMinimize?: boolean;
    popupPageUri?: string;
    defaultDirection?: string;
  } = {} as any) {
    const container = document.createElement('div');
    container.id = prefix;
    container.setAttribute('class', classnames(styles.root, styles.loading));
    container.draggable = false;

    this._prefix = prefix;
    this._messageTypes = ObjectMap.prefixValues(messageTypes, prefix);
    this._container = ensureExist.call(this, container, 'container');
    this._root = container;
    this._styles = styles;
    this._defaultDirection = defaultDirection;
    this._padding = 15;
    this._minTranslateX = 0;
    this._minTranslateY = 0;
    this._translateX = 0;
    this._translateY = 0;
    this._appWidth = appWidth;
    this._appHeight = appHeight;
    this._dragStartPosition = null;
    this._closed = true;
    this._minimized = true;
    this._dragging = false;
    this._hover = false;
    this._hoverHeader = false;
    this._loading = true;
    this._userStatus = null;
    this._dndStatus = null;
    this._telephonyStatus = null;
    this._presenceOption = null;
    this._scrollable = false;
    this.currentState = -1;
    this._strings = {};

    this._messageTypes = messageTypes;
    this._zIndex = zIndex;
    this._fromPopup = fromPopup;
    this._enablePopup = enablePopup;
    this._popupPageUri = popupPageUri;
    this._disableMinimize = disableMinimize;
    this._showFeedbackAtHead = false;
    this._theme = 'light';
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
    window.addEventListener('message', (event) => {
      this._onMessage(event.data);
    });

    document.addEventListener(
      'click',
      (event) => {
        let target = event.target as HTMLElement | null;
        if (!target) {
          return;
        }
        if (target && !(target as HTMLAnchorElement).href) {
          target = target.parentElement;
        }
        if (target && !(target as HTMLAnchorElement).href) {
          target = target.parentElement;
        }
        if (!target) {
          return;
        }
        if (target.matches('a[href^="sms:"]')) {
          event.preventDefault();
          const hrefStr = (target as HTMLAnchorElement).href;
          const pathStr = hrefStr.split('?')[0];
          const { text, body } = parseUri(hrefStr);
          const phoneNumber = pathStr.replace(/[^\d+*-]/g, '');
          this.clickToSMS(phoneNumber, body || text);
        } else if (target.matches('a[href^="tel:"]')) {
          event.preventDefault();
          const hrefStr = (target as HTMLAnchorElement).href;
          const phoneNumber = hrefStr.replace(/[^\d+*-]/g, '');
          this.clickToCall(phoneNumber, true);
        }
      },
      false,
    );

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
    window.addEventListener('beforeunload', (event) => {
      if (this._webphoneActive && this._webphoneCalls.length > 0) {
        const message = 'Calls are active on this tab. Are you sure to leave?';
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
      return undefined;
    });
  }

  setThemeVariables(variableString: string): void {
    this._themeVariableString = variableString;
    if (this._headerEl) {
      this._headerEl.style.cssText = this._themeVariableString;
    }
  }

  _onMessage(data: any): void {
    if (data) {
      switch (data.type) {
        case 'rc-call-ring-notify':
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
        case 'rc-call-start-notify':
        case 'rc-call-end-notify':
        case 'rc-call-hold-notify':
        case 'rc-call-resume-notify':
          this._updateWebphoneCalls(data.call);
          break;
        case 'rc-call-mute-notify':
          console.log('call muted changed:', data.call);
          break;
        case 'rc-webphone-active-notify':
          this._webphoneActive = data.currentActive;
          break;
        case 'rc-webphone-connection-status-notify':
        case 'rc-webphone-sessions-sync':
        case 'rc-login-status-notify':
        case 'rc-calling-settings-notify':
        case 'rc-sms-settings-notify':
        case 'rc-region-settings-notify':
        case 'rc-active-call-notify':
        case 'rc-ringout-call-notify':
        case 'rc-inbound-message-notify':
        case 'rc-message-updated-notify':
        case 'rc-message-thread-notify':
        case 'rc-message-thread-entity-notify':
        case 'rc-callLogger-auto-log-notify':
        case 'rc-dialer-status-notify':
        case 'rc-meeting-status-notify':
        case 'rc-call-history-synced-notify':
          console.log(data.type, data);
          break;
        case 'rc-route-changed-notify':
          this._updateWidgetCurrentPath(data.path);
          break;
        case 'rc-brand-assets-notify':
          if (data.logoUri) {
            this._setLogoUrl(data.logoUri);
          }
          if (data.iconUri) {
            this._setIconUrl(data.iconUri);
          }
          break;
        case 'rc-adapter-theme-notify':
          this._setTheme(data.theme);
          break;
        case 'rc-adapter-set-popup-window-size':
          this._setPopupWindowSize(data.width, data.height);
          break;
        case 'rc-adapter-phone-number-format-settings-notify':
          console.log(
            'rc-adapter-phone-number-format-settings-notify:',
            data.formatType,
            data.template,
          );
          break;
        case this._messageTypes.syncClosed:
          this._onSyncClosed(data.closed);
          break;
        case this._messageTypes.syncMinimized:
          this._onSyncMinimized(data.minimized);
          break;
        case this._messageTypes.syncSize:
          this._onSyncSize(data.size);
          break;
        case this._messageTypes.syncPresence:
          this._onPushPresence(data);
          break;
        case this._messageTypes.pushAdapterState:
          this._onPushAdapterState(data);
          break;
        case this._messageTypes.pushLocale:
          this._onPushLocale(data);
          break;
        case this._messageTypes.pushRingState:
          this._onPushRingState(data);
          break;
        case this._messageTypes.pushCalls:
          this._onPushCallsInfo(data);
          break;
        case this._messageTypes.pushOnCurrentCallPath:
          this._onPushOnCurrentCallPath(data);
          break;
        case this._messageTypes.pushOnAllCallsPath:
          this._onPushOnAllCallsPath(data);
          break;
        default:
          break;
      }
    }
  }

  _getContentDOM(sanboxAttributeValue: string, allowAttributeValue: string): string {
    let sandboxAttributes = sanboxAttributeValue;
    if (isSafari()) {
      sandboxAttributes = sandboxAttributes.replace(' allow-downloads', '');
    }
    sandboxAttributes = `${sandboxAttributes} allow-popups-to-escape-sandbox`;
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
            <div class="${this._styles.feedbackIcon}" title="Help">
              <img src="${helpIconUrl}" draggable="false" />
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

  _generateContentDOM(): void {
    this._root.innerHTML = this._getContentDOM(
      SANDBOX_ATTRIBUTE_VALUE,
      ALLOW_ATTRIBUTE_VALUE,
    );
    this._headerEl = this._root.querySelector(`.${this._styles.header}`)!;
    if (this._themeVariableString) {
      this._headerEl.style.cssText = this._themeVariableString;
    }
    this._logoEl = this._root.querySelector(`.${this._styles.logo}`);
    this._logoEl.addEventListener('dragstart', () => false);

    this._contentFrameContainerEl = this._root.querySelector(
      `.${this._styles.frameContainer}`,
    );

    this._toggleEl = this._root.querySelector(`.${this._styles.toggle}`);
    this._toggleEl.addEventListener(clickEvent, (evt: any) => {
      evt.stopPropagation();
      this.toggleMinimized();
    });

    this._closeEl = this._root.querySelector(`.${this._styles.close}`);
    if (this._closeEl) {
      this._closeEl.addEventListener(clickEvent, () => {
        this.setClosed(true);
      });
    }

    this._presenceEl = this._root.querySelector(`.${this._styles.presence}`);
    this._presenceEl.addEventListener(clickEvent, (evt: any) => {
      evt.stopPropagation();
      this.togglePresenceDropdown();
    });

    this._presenceItemEls = this._root.querySelectorAll(
      `.${this._styles.presenceItem}`,
    );

    this._presenceItemEls.forEach((itemEl: any) => {
      const dataPresence = itemEl.getAttribute('data-presence');
      itemEl.addEventListener(clickEvent, (evt: any) => {
        evt.stopPropagation();
        this.togglePresenceDropdown();
        this._postMessage({
          type: this._messageTypes.presenceItemClicked,
          presenceType:
            (presenceStatus as any)[dataPresence] ||
            (dndStatus as any)[dataPresence],
        });
      });
    });

    this._dropdownPresence = this._root.querySelector(
      `.${this._styles.dropdownPresence}`,
    );
    if (this._dropdownPresence) {
      this._dropdownPresence.addEventListener(clickEvent, (evt: any) => {
        evt.stopPropagation();
        this.togglePresenceDropdown();
      });
    }

    this._contentFrameEl = this._root.querySelector(
      `.${this._styles.contentFrame}`,
    )!;

    this._durationEl = this._root.querySelector(`.${this._styles.duration}`)!;
    this._durationEl.addEventListener(clickEvent, (evt: Event) => {
      evt.stopPropagation();
      this._postMessage({
        type: this._messageTypes.navigateToCurrentCall,
      });
    });

    this._currentCallEl = this._root.querySelector(
      `.${this._styles.currentCallBtn}`,
    )!;
    this._currentCallEl.addEventListener(clickEvent, (evt: Event) => {
      evt.stopPropagation();
      this._postMessage({
        type: this._messageTypes.navigateToCurrentCall,
      });
    });

    this._viewCallsEl = this._root.querySelector(
      `.${this._styles.viewCallsBtn}`,
    )!;
    this._viewCallsEl.addEventListener(clickEvent, (evt: Event) => {
      evt.stopPropagation();
      this._postMessage({
        type: this._messageTypes.navigateToViewCalls,
      });
    });

    this._ringingCallsEl = this._root.querySelector(
      `.${this._styles.ringingCalls}`,
    )!;

    this._onHoldCallsEl = this._root.querySelector(
      `.${this._styles.onHoldCalls}`,
    )!;

    this._otherDeviceCallsEl = this._root.querySelector(
      `.${this._styles.otherDeviceCalls}`,
    )!;

    this._headerEl.addEventListener('mousedown', (evt: any) => {
      this._dragging = true;
      this._isClick = true;
      this._dragStartPosition = {
        x: evt.clientX,
        y: evt.clientY,
        translateX: this._translateX,
        translateY: this._translateY,
        minTranslateX: this._minTranslateX,
        minTranslateY: this._minTranslateY,
      };
      this._renderMainClass();
    });
    this._headerEl.addEventListener('mouseup', () => {
      this._dragging = false;
      this._renderMainClass();
    });
    window.addEventListener('mousemove', this._onWindowMouseMove);

    this._headerEl.addEventListener('mouseenter', () => {
      if (!this._minimized) {
        return;
      }
      if (this._currentStartTime > 0) {
        this._hoverBar = true;
        this._scrollable = false;
        this._renderCallsBar();
      }
      this._hoverHeader = true;
      this._renderMainClass();
    });
    this._headerEl.addEventListener('mouseleave', () => {
      this._hoverHeader = false;
      this._hoverBar = false;
      this._scrollable = false;
      this._renderCallsBar();
      this._renderMainClass();
    });

    this._isClick = true;
    this._headerEl.addEventListener(clickEvent, (evt: any) => {
      if (this._isClick) {
        this._onHeaderClicked();
      }
    });

    this._resizeTimeout = null;
    this._resizeTick = null;
    window.addEventListener('resize', this._onWindowResize);

    this._container.addEventListener('mouseenter', () => {
      this._hover = true;
      this._renderMainClass();
    });
    this._container.addEventListener('mouseleave', () => {
      this._hover = false;
      this._renderMainClass();
    });

    if (document.readyState === 'loading') {
      window.addEventListener('load', () => {
        document.body.appendChild(this._container);
      });
    } else {
      document.body.appendChild(this._container);
    }

    this._beforeRender();

    this._render();
  }

  _onWindowResize = (): void => {
    if (this._dragging) {
      return;
    }
    if (this._resizeTimeout) {
      clearTimeout(this._resizeTimeout);
    }
    this._resizeTimeout = setTimeout(
      () => this._renderRestrictedPosition(),
      100,
    );
    if (!this._resizeTick || Date.now() - this._resizeTick > 50) {
      this._resizeTick = Date.now();
      this._renderRestrictedPosition();
    }
  };

  _onWindowMouseMove = (evt: any): void => {
    if (this._dragging) {
      if (evt.buttons === 0) {
        this._dragging = false;
        this._renderMainClass();
        return;
      }
      const factor = this._calculateFactor();
      const delta = {
        x: evt.clientX - this._dragStartPosition.x,
        y: evt.clientY - this._dragStartPosition.y,
      };
      if (this._minimized) {
        this._minTranslateX =
          this._dragStartPosition.minTranslateX + delta.x * factor;
        this._minTranslateY = this._dragStartPosition.minTranslateY + delta.y;
      } else {
        this._translateX =
          this._dragStartPosition.translateX + delta.x * factor;
        this._translateY = this._dragStartPosition.translateY + delta.y;
      }
      if (delta.x !== 0 || delta.y !== 0) {
        this._isClick = false;
      }
      this._syncPosition();
      this._renderRestrictedPosition();
    }
  };

  togglePresenceDropdown(): void {
    if (this._dropdownPresence) {
      this._dropdownPresence.classList.toggle(`${this._styles.showDropdown}`);
      this.setMinimized(false);
    }
  }

  get messageTransport(): any {
    return this._messageTransport;
  }

  _postMessage(data: any): void {
    if (this._contentFrameEl.contentWindow) {
      this._contentFrameEl.contentWindow.postMessage(data, this._appOrigin);
    }
  }

  _setLogoUrl(logoUri: string): void {
    if (!checkValidImageUri(logoUri)) {
      return;
    }
    this._logoUrl = logoUri;
    this._logoEl.src = logoUri;
    this._logoEl.setAttribute(
      'class',
      classnames(
        this._styles.logo,
        this._logoUrl && this._logoUrl !== '' && this._styles.visible,
      ),
    );
  }

  _setAppUrl(appUrl: string): void {
    this._appUrl = appUrl;
    this._appOrigin = new URL(appUrl, window.location.href).origin;
    if (appUrl) {
      this.contentFrameEl.src = appUrl;
      this.contentFrameEl.id = `${this._prefix}-adapter-frame`;
    }
  }

  _onSyncMinimized(minimized: boolean): void {
    this._minimized = !!minimized;
    this._renderMainClass();
    this.renderAdapterSize();
    this._renderRestrictedPosition();
  }

  setMinimized(minimized: boolean): void {
    this._onSyncMinimized(minimized);
    this._postMessage({
      type: this._messageTypes.syncMinimized,
      minimized: this._minimized,
    });
    if (minimized && this._dropdownPresence) {
      this._dropdownPresence.classList.remove(`${this._styles.showDropdown}`);
    }
  }

  toggleMinimized(): void {
    this.setMinimized(!this._minimized);
  }

  _calculateMinMaxPosition(): { minimumX: number; minimumY: number; maximumX: number; maximumY: number } | undefined {
    if (!this._headerEl) return undefined;
    const maximumX =
      window.innerWidth -
      (this._minimized ? this._headerEl.clientWidth : this._appWidth) -
      2 * this._padding;
    const maximumY =
      window.innerHeight -
      (this._minimized
        ? this._headerEl.clientHeight
        : this._headerEl.clientHeight + this._appHeight) -
      this._padding;
    return {
      minimumX: this._padding,
      minimumY: this._padding,
      maximumX,
      maximumY,
    };
  }

  _onSyncClosed(closed: boolean): void {
    this._closed = !!closed;
    this._renderMainClass();
  }

  setClosed(closed: boolean): void {
    this._onSyncClosed(closed);
    this._postMessage({
      type: this._messageTypes.syncClosed,
      closed: this.closed,
    });
  }

  toggleClosed(): void {
    this.setClosed(!this.closed);
  }

  _onSyncSize({ width, height }: { width: number; height: number }): void {
    this._appWidth = width;
    this._appHeight = height;
    this._contentFrameEl.style.width = `${width}px`;
    this._contentFrameEl.style.height = `${height}px`;
    this.renderAdapterSize();
  }

  setSize(size: { width: number; height: number }): void {
    this._onSyncSize(size);
    this._postMessage({
      type: this._messageTypes.syncSize,
      size,
    });
  }

  _onPushRingState({ ringing }: any): void {
    this._ringing = ringing;
    this._render();
  }

  _onPushCallsInfo({
    ringingCallsLength,
    onHoldCallsLength,
    otherDeviceCallsLength,
    currentStartTime,
  }: any): void {
    this._currentStartTime = currentStartTime;
    this._ringingCallsLength = ringingCallsLength;
    this._onHoldCallsLength = onHoldCallsLength;
    this._otherDeviceCallsLength = otherDeviceCallsLength;
    this._hasActiveCalls =
      this._currentStartTime > 0 ||
      this._ringingCallsLength > 0 ||
      this._onHoldCallsLength > 0 ||
      this._otherDeviceCallsLength > 0;
    this.renderCallsBar();
  }

  _onPushOnCurrentCallPath({ onCurrentCallPath }: any): void {
    this._onCurrentCallPath = onCurrentCallPath;
    this._render();
  }

  _onPushOnAllCallsPath({ onAllCallsPath }: any): void {
    this._onAllCallsPath = onAllCallsPath;
    this._render();
  }

  _onPushPresence({
    dndStatus: dndStatusValue,
    userStatus,
    telephonyStatus,
    presenceOption,
  }: any): void {
    if (
      dndStatusValue !== this._dndStatus ||
      userStatus !== this._userStatus ||
      telephonyStatus !== this._telephonyStatus
    ) {
      this._dndStatus = dndStatusValue;
      this._userStatus = userStatus;
      this._telephonyStatus = telephonyStatus;
      this._presenceOption = presenceOption;
      this.renderPresence();
    }
  }

  _onPushLocale({ locale, strings = {} }: any): void {
    this._locale = locale;
    this._strings = strings;
    this._renderString();
  }

  _renderString(): void {
    this._renderCallBarBtn();
    this._renderRingingCalls();
    this._renderOnHoldCalls();
    this._renderOtherDevicesCalls();
    this._renderPresenceItem();
  }

  _debouncedPostMessage = debounce(this._postMessage, 100);

  _syncPosition(): void {
    if (this._fromPopup) {
      return;
    }
    this._debouncedPostMessage.call(this, {
      type: this._messageTypes.syncPosition,
      position: {
        translateX: this._translateX,
        translateY: this._translateY,
        minTranslateX: this._minTranslateX,
        minTranslateY: this._minTranslateY,
      },
    });
  }

  _onPushAdapterState(options: any): void {
    const resolved = this._fromPopup
      ? { ...options, minimized: false }
      : options;
    const {
      size: { width, height },
      minimized,
      closed,
      position: { translateX, translateY, minTranslateX, minTranslateY },
      dndStatus: dndStatusValue,
      userStatus,
      telephonyStatus,
    } = resolved;
    this._minimized = minimized;
    this._closed = closed;
    if (!this._dragging) {
      this._translateX = translateX;
      this._translateY = translateY;
      this._minTranslateX = minTranslateX;
      this._minTranslateY = minTranslateY;
    }
    this._appWidth = width;
    this._appHeight = height;
    this._dndStatus = dndStatusValue;
    this._userStatus = userStatus;
    this._telephonyStatus = telephonyStatus;
    this._loading = false;
    this._render();
  }

  _calculateFactor(): number {
    return this._defaultDirection === 'right' ? -1 : 1;
  }

  renderPosition(): void {
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
          `transform: translate(${this._minTranslateX * factor}px, ${-this._padding}px)!important;`,
        );
      }
    } else {
      this._container.setAttribute(
        'style',
        `transform: translate(${this._translateX * factor}px, ${this._translateY}px)!important; z-index: ${this._zIndex};`,
      );
    }
  }

  _renderRestrictedPosition(): void {
    const positions = this._calculateMinMaxPosition();
    if (!positions) return;
    const { minimumX, minimumY, maximumX, maximumY } = positions;

    if (this._minimized) {
      const newMinTranslateX = Math.max(
        Math.min(this._minTranslateX, maximumX),
        minimumX,
      );
      if (newMinTranslateX !== this._minTranslateX) {
        this._minTranslateX = newMinTranslateX;
      }
      const newMinTranslateY = Math.max(
        Math.min(this._minTranslateY, -minimumY),
        -maximumY,
      );
      if (newMinTranslateY !== this._minTranslateY) {
        this._minTranslateY = newMinTranslateY;
      }
    } else {
      const newTranslateX = Math.max(
        Math.min(this._translateX, maximumX),
        minimumX,
      );
      const newTranslateY = Math.max(
        Math.min(this._translateY, -minimumY),
        -maximumY,
      );
      if (
        this._translateX !== newTranslateX ||
        this._translateY !== newTranslateY
      ) {
        this._translateX = newTranslateX;
        this._translateY = newTranslateY;
      }
    }
    this.renderPosition();
  }

  renderAdapterSize(): void {
    if (this._minimized) {
      this._contentFrameContainerEl.style.width = 0;
      this._contentFrameContainerEl.style.height = 0;
    } else {
      this._contentFrameContainerEl.style.width = `${this._appWidth}px`;
      this._contentFrameContainerEl.style.height = `${this._appHeight}px`;
      this._contentFrameEl.style.width = `${this._appWidth}px`;
      this._contentFrameEl.style.height = `${this._appHeight}px`;
    }
    if (this._fromPopup) {
      this._contentFrameContainerEl.style.width = '100%';
      this._contentFrameContainerEl.style.height = 'calc(100% - 36px)';
      this._contentFrameEl.style.width = '100%';
      this._contentFrameEl.style.height = '100%';
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'rc-adapter-set-popup-window-size',
            width: this._appWidth,
            height: this._appHeight,
          },
          '*',
        );
      }
    }
  }

  _renderMainClass(): void {
    this._container.setAttribute(
      'class',
      classnames(
        this._styles.root,
        this._styles[this._defaultDirection],
        this._closed && this._styles.closed,
        this._minimized && this._styles.minimized,
        this._dragging && this._styles.dragging,
        this._hover && this._styles.hover,
        this._loading && this._styles.loading,
        this._showDockUI && this._styles.dock,
        this._showDockUI &&
          this._minimized &&
          (this._hoverHeader || this._dragging) &&
          this._styles.expandable,
        this._showDockUI &&
          this._minimized &&
          !(this._userStatus || this._dndStatus) &&
          this._styles.noPresence,
        this._enablePopup && this._styles.showPopup,
        this._disableMinimize && this._styles.hideToggleButton,
        this._showFeedbackAtHead && this._styles.showFeedback,
        this._theme === 'dark' && this._styles.dark,
      ),
    );
    this._headerEl?.setAttribute(
      'class',
      classnames(
        this._styles.header,
        this._minimized && this._styles.minimized,
        this._ringing && this._styles.ringing,
        this._showDockUI &&
          this._minimized &&
          (this._hoverHeader || this._dragging) &&
          this._styles.iconTrans,
      ),
    );
    this._iconContainerEl?.setAttribute(
      'class',
      classnames(
        this._styles.iconContainer,
        !(this._userStatus || this._dndStatus) && this._styles.noPresence,
        !this._showDockUI && this._styles.hidden,
      ),
    );
  }

  renderPresence(): void {
    this._presenceEl.setAttribute(
      'class',
      classnames(
        this._minimized && this._styles.minimized,
        this._styles.presence,
        this._minimized && this._userStatus && this._styles[this._userStatus],
        this._minimized && this._dndStatus && this._styles[this._dndStatus],
      ),
    );

    this._presenceItemEls.forEach((presenceItem: any) => {
      const dataPresence = presenceItem.getAttribute('data-presence');
      if (
        (presenceStatus as any)[dataPresence] === this._presenceOption ||
        (dndStatus as any)[dataPresence] === this._presenceOption
      ) {
        presenceItem.setAttribute(
          'class',
          classnames(this._styles.presenceItem, this._styles.selected),
        );
      } else {
        presenceItem.setAttribute('class', classnames(this._styles.presenceItem));
      }
    });
  }

  calculateState(): number {
    const startTime = this._currentStartTime;
    return Math.round((new Date().getTime() - startTime) / 1000);
  }

  renderCallsBar(): void {
    if (this.rotateInterval) {
      clearInterval(this.rotateInterval);
      this.rotateInterval = 0;
    }
    if (!this._hasActiveCalls) {
      this.currentState = -1;
      this._scrollable = false;
      this._hoverBar = false;
      if (this.durationInterval) {
        clearInterval(this.durationInterval);
        this.durationInterval = 0;
      }
      this._renderCallsBar();
      return;
    }
    if (
      this._currentStartTime > 0 &&
      this._ringingCallsLength === 0 &&
      this._onHoldCallsLength === 0 &&
      this._otherDeviceCallsLength === 0
    ) {
      this.currentState = CURRENT_CALL;
      this._scrollable = false;
      this._renderCallDuration();
      this._renderCallsBar();
      return;
    }
    if (
      this._currentStartTime === 0 &&
      this._otherDeviceCallsLength === 0 &&
      this._ringingCallsLength > 0
    ) {
      this.currentState = RINGING_CALLS;
      this._scrollable = false;
      this._hoverBar = false;
      if (this.durationInterval) {
        clearInterval(this.durationInterval);
        this.durationInterval = 0;
      }
      this._renderRingingCalls();
      this._renderCallsBar();
      return;
    }
    if (
      this._currentStartTime === 0 &&
      this._ringingCallsLength === 0 &&
      this._onHoldCallsLength === 0 &&
      this._otherDeviceCallsLength > 0
    ) {
      this.currentState = OTHER_DEVICE_CALLS;
      this._scrollable = false;
      this._renderOtherDevicesCalls();
      this._renderCallsBar();
      return;
    }
    this.callInfoMap = {
      [CURRENT_CALL]: this._currentStartTime > 0,
      [RINGING_CALLS]: this._ringingCallsLength > 0,
      [ON_HOLD_CALLS]: this._onHoldCallsLength > 0,
      [OTHER_DEVICE_CALLS]: this._otherDeviceCallsLength > 0,
    };
    this.rotateCallInfo();
    this.rotateInterval = setInterval(() => {
      this.rotateCallInfo();
    }, ROTATE_INTERVAL) as unknown as number;
  }

  rotateCallInfo() {
    if (this._hoverBar && this.callInfoMap[this.currentState]) {
      return;
    }
    this.lastState = this.currentState;
    this.currentState = this.increment(this.currentState);
    const hasStatuses = Object.values(this.callInfoMap).some((value) => value);
    if (!hasStatuses) {
      return;
    }
    while (!this.callInfoMap[this.currentState]) {
      this.currentState = this.increment(this.currentState);
    }
    switch (this.currentState) {
      case ON_HOLD_CALLS:
        this._renderOnHoldCalls();
        break;
      case RINGING_CALLS:
        this._renderRingingCalls();
        break;
      case CURRENT_CALL:
        this._renderCallDuration();
        break;
      case OTHER_DEVICE_CALLS:
        this._renderOtherDevicesCalls();
        break;
      default:
        break;
    }
    this._scrollable = true;
    this._renderCallsBar();
    this._scrollable = false;
  }

  increment(state: number): number {
    const newState = state + 1;
    if (state >= ROTATE_LENGTH - 1) {
      return 0;
    }
    return newState;
  }

  _clearCallsBar(): void {
    this._logoEl.setAttribute(
      'class',
      classnames(
        this._styles.logo,
        this._logoUrl && this._logoUrl !== '' && this._styles.visible,
      ),
    );
    this._durationEl.setAttribute('class', classnames(this._styles.duration));
    this._ringingCallsEl.setAttribute('class', classnames(this._styles.ringingCalls));
    this._onHoldCallsEl.setAttribute('class', classnames(this._styles.onHoldCalls));
    this._otherDeviceCallsEl?.setAttribute(
      'class',
      classnames(this._styles.otherDeviceCalls),
    );
    this._currentCallEl.setAttribute(
      'class',
      classnames(this._styles.currentCallBtn),
    );
    this._viewCallsEl.setAttribute('class', classnames(this._styles.viewCallsBtn));
  }

  _renderCallsBar(): void {
    if (!this._minimized) {
      this._clearCallsBar();
      return;
    }
    this._logoEl.setAttribute(
      'class',
      classnames(
        this._styles.logo,
        !this._hasActiveCalls &&
          this._logoUrl &&
          this._logoUrl !== '' &&
          this._styles.visible,
      ),
    );
    this._durationEl.setAttribute(
      'class',
      classnames(
        this._styles.duration,
        this.showDuration && this._styles.visible,
        this.centerDuration && this._styles.center,
        this.moveOutDuration && this._styles.moveOut,
        this.moveInDuration && this._styles.moveIn,
      ),
    );
    this._ringingCallsEl.setAttribute(
      'class',
      classnames(
        this._styles.ringingCalls,
        this.showRingingCalls && this._styles.visible,
        this.centerCallInfo && this._styles.center,
        this.moveOutRingingInfo && this._styles.moveOut,
        this.moveInRingingInfo && this._styles.moveIn,
      ),
    );
    this._onHoldCallsEl.setAttribute(
      'class',
      classnames(
        this._styles.onHoldCalls,
        this.showOnHoldCalls && this._styles.visible,
        this.centerCallInfo && this._styles.center,
        this.moveOutOnHoldInfo && this._styles.moveOut,
        this.moveInOnHoldInfo && this._styles.moveIn,
      ),
    );
    this._otherDeviceCallsEl?.setAttribute(
      'class',
      classnames(
        this._styles.otherDeviceCalls,
        this.showOtherDeviceCalls && this._styles.visible,
        this.centerCallInfo && this._styles.center,
        this.isInMoveOutStatus(OTHER_DEVICE_CALLS) && this._styles.moveOut,
        this.isInMoveInStatus(OTHER_DEVICE_CALLS) && this._styles.moveIn,
      ),
    );
    this._currentCallEl.setAttribute(
      'class',
      classnames(
        this._styles.currentCallBtn,
        this.showCurrentCallBtn && this._styles.visible,
        !this.centerDuration &&
          this.moveOutCurrentCallBtn &&
          this._styles.moveOut,
        !this.centerDuration && this.moveInCurrentCallBtn && this._styles.moveIn,
      ),
    );
    this._viewCallsEl.setAttribute(
      'class',
      classnames(
        this._styles.viewCallsBtn,
        this.showViewCallsBtn && this._styles.visible,
        !this.moveInViewCallsBtn &&
          this.moveOutViewCallsBtn &&
          this._styles.moveOut,
        this.moveInViewCallsBtn && this._styles.moveIn,
      ),
    );
  }

  _renderCallDuration(): void {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = 0;
    }
    const duration = formatDuration(this.calculateState());
    this._durationEl.innerHTML = duration;
    this.durationInterval = setInterval(() => {
      const newDuration = formatDuration(this.calculateState());
      this._durationEl.innerHTML = newDuration;
    }, 1000) as unknown as number;
  }

  _renderRingingCalls(): void {
    if (!this._ringingCallsLength || !this._strings) {
      return;
    }
    let ringCallsStrings = this._strings.ringCallsInfo || '';
    ringCallsStrings = ringCallsStrings.replace('0', String(this._ringingCallsLength));
    this._ringingCallsEl.innerHTML = ringCallsStrings;
    this._ringingCallsEl.title = ringCallsStrings;
  }

  _renderOnHoldCalls(): void {
    if (!this._onHoldCallsLength || !this._strings) {
      return;
    }
    let onHoldCallsInfo = this._strings.onHoldCallsInfo || '';
    onHoldCallsInfo = onHoldCallsInfo.replace('0', String(this._onHoldCallsLength));
    this._onHoldCallsEl.innerHTML = onHoldCallsInfo;
    this._onHoldCallsEl.title = onHoldCallsInfo;
  }

  _renderOtherDevicesCalls(): void {
    if (
      !this._otherDeviceCallsLength ||
      !this._strings ||
      !this._otherDeviceCallsEl
    ) {
      return;
    }
    this._otherDeviceCallsEl.innerHTML = this._strings.otherDeviceCallsInfo;
    this._otherDeviceCallsEl.title = this._strings.otherDeviceCallsInfo;
  }

  _renderCallBarBtn(): void {
    if (!this._strings) {
      return;
    }
    this._currentCallEl.innerHTML = this._strings.currentCallBtn;
    this._viewCallsEl.innerHTML = this._strings.viewCallsBtn;
  }

  _renderPresenceItem(): void {
    if (!this._strings) {
      return;
    }
    this._presenceItemEls.forEach((presenceItem: any) => {
      const dataPresence = presenceItem.getAttribute('data-presence');
      presenceItem.querySelector('span').innerHTML =
        this._strings[`${dataPresence}Btn`];
    });
  }

  _render(): void {
    this.renderPresence();
    this.renderAdapterSize();
    this._renderRestrictedPosition();
    this._renderMainClass();
    this._renderCallsBar();
  }

  dispose(): void {
    window.removeEventListener('mousemove', this._onWindowMouseMove);
    window.removeEventListener('resize', this._onWindowResize);
    if (this._resizeTimeout) {
      clearTimeout(this._resizeTick);
    }
    this._container.remove();
  }

  isInMoveInStatus(state: number): boolean {
    return !this._hoverBar && this.currentState === state && this._scrollable;
  }

  isInMoveOutStatus(state: number): boolean {
    return !this._hoverBar && this._scrollable && this.lastState === state;
  }

  _onHeaderClicked(): void {
    if (!this._minimized) {
      return;
    }
    this.toggleMinimized();
  }

  _setIconUrl(iconUrl: string): void {
    if (!checkValidImageUri(iconUrl)) {
      return;
    }
    this._iconEl.src = iconUrl;
  }

  _setTheme(theme: string): void {
    this._theme = theme;
    this._renderMainClass();
  }

  _setPopupWindowSize(width: number, height: number): void {
    if (this._popupedWindow) {
      this._popupedWindow.resizeTo(
        width,
        this._popupedWindow.outerHeight || this._appHeight + 64,
      );
    }
  }

  async popupWindow(): Promise<void> {
    if (!this._popupWindowPromise) {
      this._popupWindowPromise = this._popupWindow();
    }
    try {
      await this._popupWindowPromise;
    } catch (error) {
      console.error(error);
    }
    this._popupWindowPromise = null;
  }

  async _popupWindow(): Promise<void> {
    const isWindowPoppedUp = await this.isWindowPoppedUp({ alert: true });
    if (isWindowPoppedUp) {
      if (this._popupedWindow?.focus) {
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

  isWindowPoppedUp({ alert = false }: { alert?: boolean } = {}): Promise<any> {
    return this._requestWithPostMessage('/check-popup-window', { alert });
  }

  _requestWithPostMessage(path: string, body: any): Promise<any> {
    return requestWithPostMessage(
      path,
      body,
      5000,
      this._contentFrameEl.contentWindow,
      'rc-adapter-message',
    );
  }

  setRinging(ringing: boolean): void {
    this._ringing = !!ringing;
    this._renderMainClass();
  }

  gotoPresence(): void {
    this._postMessage({
      type: 'rc-adapter-goto-presence',
      version: this._version,
    });
  }

  setEnvironment(): void {
    this._postMessage({
      type: 'rc-adapter-set-environment',
    });
  }

  clickToSMS(
    phoneNumber: string,
    text?: string,
    conversation?: any,
    attachments: any = undefined,
    recipient: any = undefined,
  ): void {
    this.setMinimized(false);
    this._postMessage({
      type: 'rc-adapter-new-sms',
      phoneNumber,
      text,
      conversation,
      attachments,
      recipient,
    });
  }

  clickToCall(phoneNumber: string, toCall: boolean = false): void {
    this.setMinimized(false);
    this._postMessage({
      type: 'rc-adapter-new-call',
      phoneNumber,
      toCall,
    });
  }

  controlCall(action: string, id: string, options: any = {}): void {
    this._postMessage({
      type: 'rc-adapter-control-call',
      callAction: action,
      callId: id,
      options,
    });
  }

  logoutUser(): void {
    this._postMessage({
      type: 'rc-adapter-logout',
    });
  }

  updateCallingSetting({
    callWith,
    myLocation,
    ringoutPrompt,
    fromNumber,
  }: {
    callWith?: string;
    myLocation?: string;
    ringoutPrompt?: boolean;
    fromNumber?: string;
  }): void {
    this._postMessage({
      type: 'rc-calling-settings-update',
      callWith,
      myLocation,
      ringoutPrompt,
      fromNumber,
    });
  }

  updateSmsSetting({ senderNumber }: { senderNumber: string }): void {
    this._postMessage({
      type: 'rc-sms-settings-update',
      senderNumber,
    });
  }

  navigateTo(path: string): void {
    this._postMessage({
      type: 'rc-adapter-navigate-to',
      path,
    });
  }

  scheduleMeeting(meetingInfo: any): Promise<any> {
    return this._requestWithPostMessage('/schedule-meeting', meetingInfo);
  }

  _updateWidgetCurrentPath(path: string): void {
    this._widgetCurrentPath = path;
    this._updateCallBarStatus();
  }

  _updateWebphoneCalls(webphoneCall: any): void {
    const cleanCalls = this._webphoneCalls.filter((call) => call.id !== webphoneCall.id);
    if (webphoneCall.endTime) {
      if (
        webphoneCall.id === this._currentWebhoneCallId &&
        cleanCalls.length > 0
      ) {
        const currentCall = cleanCalls.find(
          (call) => call.callStatus !== 'webphone-session-connecting',
        );
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

  _updateCallBarStatus(): void {
    const activeCalls = this._webphoneCalls.filter(
      (call) =>
        call.callStatus !== 'webphone-session-connecting' ||
        call.direction === 'Inbound',
    );
    this._hasActiveCalls = activeCalls.length > 0;
    const ringingCalls = this._webphoneCalls.filter(
      (call) =>
        call.callStatus === 'webphone-session-connecting' &&
        call.direction === 'Inbound',
    );
    this._ringingCallsLength = ringingCalls.length;
    const holdedCalls = this._webphoneCalls.filter(
      (call) => call.callStatus === 'webphone-session-onHold',
    );
    this._onHoldCallsLength = holdedCalls.length;
    this.renderCallsBar();
  }

  showFeedback({ onFeedback }: { onFeedback: () => void }): void {
    if (typeof onFeedback !== 'function') {
      throw new Error('onFeedback function is required.');
    }
    this._showFeedbackAtHead = true;
    this._renderMainClass();
    this._feedbackEl = this._root.querySelector(`.${this._styles.feedback}`);
    this._feedbackEl.addEventListener('click', (evt: MouseEvent) => {
      evt.stopPropagation();
      onFeedback();
    });
  }

  createSMSTemplate(displayName: string, text: string): Promise<any> {
    return this._requestWithPostMessage('/create-sms-template', {
      displayName,
      text,
    });
  }

  updateRingtone({ name, uri, volume }: { name?: string; uri?: string; volume?: number }): void {
    this._postMessage({
      type: 'rc-adapter-update-ringtone',
      name,
      uri,
      volume,
    });
  }

  alertMessage({ message, level, ttl, details }: { message: string; level?: string; ttl?: number; details?: any }): Promise<any> {
    return this._requestWithPostMessage('/custom-alert-message', {
      message,
      level,
      ttl,
      details,
    });
  }

  dismissMessage(id: string | null = null): Promise<any> {
    return this._requestWithPostMessage('/dismiss-alert-message', {
      id,
    });
  }

  getUnloggedCalls(perPage: number, page: number): Promise<any> {
    return this._requestWithPostMessage('/unlogged-calls', {
      perPage,
      page,
    });
  }

  setAutoLog({ message = undefined, call = undefined }: { message?: any; call?: any } = {}): void {
    this._postMessage({
      type: 'rc-adapter-update-auto-log-settings',
      message,
      call,
    });
  }

  getCallLog({ sessionId, telephonySessionId }: { sessionId: string; telephonySessionId: string }): Promise<any> {
    return this._requestWithPostMessage('/get-call-log', {
      sessionId,
      telephonySessionId,
    });
  }

  setPhoneNumberFormat({
    formatType,
    template,
    readOnly,
    readOnlyReason,
  }: {
    formatType?: string;
    template?: string;
    readOnly?: boolean;
    readOnlyReason?: string;
  }): void {
    this._postMessage({
      type: 'rc-adapter-set-phone-number-format',
      formatType,
      template,
      readOnly,
      readOnlyReason,
    });
  }

  get container(): any {
    return this._container;
  }

  get root(): HTMLElement {
    return this._root;
  }

  get headerEl(): HTMLElement | undefined {
    return this._headerEl;
  }

  get contentFrameContainerEl(): any {
    return this._contentFrameContainerEl;
  }

  get toggleEl(): any {
    return this._toggleEl;
  }

  get closeEl(): any {
    return this._closeEl;
  }

  get presenceEl(): any {
    return this._presenceEl;
  }

  get contentFrameEl(): any {
    return this._contentFrameEl;
  }

  get minTranslateX(): number {
    return this._minTranslateX;
  }

  get minTranslateY(): number {
    return this._minTranslateY;
  }

  get translateX(): number {
    return this._translateX;
  }

  get translateY(): number {
    return this._translateY;
  }

  get appWidth(): number {
    return this._appWidth;
  }

  get appHeight(): number {
    return this._appHeight;
  }

  get dragStartPosition(): any {
    return this._dragStartPosition;
  }

  get closed(): boolean {
    return this._closed;
  }

  get minimized(): boolean {
    return this._minimized;
  }

  get dragging(): boolean {
    return this._dragging;
  }

  get hover(): boolean {
    return this._hover;
  }

  get loading(): boolean {
    return this._loading;
  }

  get userStatus(): any {
    return this._userStatus;
  }

  get dndStatus(): any {
    return this._dndStatus;
  }

  get ringing(): any {
    return this._ringing;
  }

  get showDuration(): boolean {
    return !this._scrollable && this.currentState === CURRENT_CALL;
  }

  get showRingingCalls(): boolean {
    return !this._scrollable && this.currentState === RINGING_CALLS;
  }

  get showOnHoldCalls(): boolean {
    return !this._scrollable && this.currentState === ON_HOLD_CALLS;
  }

  get showOtherDeviceCalls(): boolean {
    return !this._scrollable && this.currentState === OTHER_DEVICE_CALLS;
  }

  get showCurrentCallBtn(): boolean {
    return !isCurrentCallPath(this._widgetCurrentPath) && this.showDuration;
  }

  get showViewCallsBtn(): boolean {
    return (
      !isViewCallsPath(this._widgetCurrentPath) &&
      (this.showOnHoldCalls || this.showRingingCalls)
    );
  }

  get centerDuration(): boolean {
    return isCurrentCallPath(this._widgetCurrentPath);
  }

  get centerCallInfo(): boolean {
    return isViewCallsPath(this._widgetCurrentPath);
  }

  get moveInDuration(): boolean {
    return (
      !this._hoverBar && this.currentState === CURRENT_CALL && this._scrollable
    );
  }

  get moveOutDuration(): boolean {
    return (
      !this._hoverBar && this._scrollable && this.lastState === CURRENT_CALL
    );
  }

  get moveInRingingInfo(): boolean {
    return (
      !this._hoverBar && this.currentState === RINGING_CALLS && this._scrollable
    );
  }

  get moveOutRingingInfo(): boolean {
    return (
      !this._hoverBar && this._scrollable && this.lastState === RINGING_CALLS
    );
  }

  get moveInOnHoldInfo(): boolean {
    return (
      !this._hoverBar && this.currentState === ON_HOLD_CALLS && this._scrollable
    );
  }

  get moveOutOnHoldInfo(): boolean {
    return (
      !this._hoverBar && this._scrollable && this.lastState === ON_HOLD_CALLS
    );
  }

  get moveInCurrentCallBtn(): boolean {
    return !isCurrentCallPath(this._widgetCurrentPath) && this.moveInDuration;
  }

  get moveOutCurrentCallBtn(): boolean {
    return !isCurrentCallPath(this._widgetCurrentPath) && this.moveOutDuration;
  }

  get moveInViewCallsBtn(): boolean {
    return (
      !isViewCallsPath(this._widgetCurrentPath) &&
      (this.moveInRingingInfo ||
        this.moveInOnHoldInfo ||
        this.isInMoveInStatus(OTHER_DEVICE_CALLS))
    );
  }

  get moveOutViewCallsBtn(): boolean {
    return (
      !isViewCallsPath(this._widgetCurrentPath) &&
      (this.moveOutRingingInfo ||
        this.moveOutOnHoldInfo ||
        this.isInMoveOutStatus(OTHER_DEVICE_CALLS))
    );
  }
}

export default Adapter;
