/**
 * @jest-environment jsdom
 */

function createStyles() {
  return new Proxy({}, {
    get(_target, property) {
      return String(property);
    },
  });
}

function installAdapterMocks({ isSafari = false } = {}) {
  const popWindow = jest.fn(() => ({
    focus: jest.fn(),
    outerHeight: 700,
    resizeTo: jest.fn(),
  }));
  const requestWithPostMessage = jest.fn(async () => ({ ok: true }));
  jest.doMock('@ringcentral-integration/utils', () => ({
    isSafari: () => isSafari,
  }));
  jest.doMock('../../src/lib/popWindow', () => ({
    __esModule: true,
    default: popWindow,
  }));
  jest.doMock('../../src/lib/requestWithPostMessage', () => ({
    __esModule: true,
    default: requestWithPostMessage,
  }));
  jest.doMock('../../src/lib/Adapter/styles.scss', () => ({
    __esModule: true,
    default: createStyles(),
  }));
  jest.doMock('../../src/assets/images/popup.svg?urlLoader', () => ({
    __esModule: true,
    default: 'popup.svg',
  }), { virtual: true });
  jest.doMock('../../src/assets/images/help.svg?urlLoader', () => ({
    __esModule: true,
    default: 'help.svg',
  }), { virtual: true });
  jest.doMock('@ringcentral-integration/widgets/lib/AdapterCore', () => class AdapterCore {
    constructor({
      prefix,
      container,
      styles,
      messageTypes,
      defaultDirection,
    }) {
      this._prefix = prefix;
      this._container = container;
      this._root = container;
      this._styles = styles;
      this._messageTypes = messageTypes;
      this._defaultDirection = defaultDirection;
      this._padding = 6;
      this._translateX = 12;
      this._translateY = 34;
      this._minTranslateX = 4;
      this._minTranslateY = 9;
      this._closed = false;
      this._minimized = false;
      this._dragging = false;
      this._hover = false;
      this._loading = false;
      this._hoverHeader = false;
      this._userStatus = '';
      this._dndStatus = '';
      this.baseMessages = [];
    }

    _generateContentDOM() {
      document.body.appendChild(this._root);
      this._root.innerHTML = this._getContentDOM(
        'allow-scripts allow-downloads',
        'microphone',
      );
      this._headerEl = this._root.querySelector(`.${this._styles.header}`);
      this._contentFrameContainerEl = this._root.querySelector(`.${this._styles.frameContainer}`);
      this._contentFrameEl = this._root.querySelector(`.${this._styles.contentFrame}`);
      this.contentFrameEl = this._contentFrameEl;
      this._logoEl = this._root.querySelector(`.${this._styles.logo}`);
      this._durationEl = this._root.querySelector(`.${this._styles.duration}`);
      this._ringingCallsEl = this._root.querySelector(`.${this._styles.ringingCalls}`);
      this._onHoldCallsEl = this._root.querySelector(`.${this._styles.onHoldCalls}`);
      this._currentCallEl = this._root.querySelector(`.${this._styles.currentCallBtn}`);
      this._viewCallsEl = this._root.querySelector(`.${this._styles.viewCallsBtn}`);
      this._beforeRender();
    }

    _onMessage(data) {
      this.baseMessages.push(data);
    }

    _setLogoUrl(logoUri) {
      this._logoEl.src = logoUri;
    }

    _renderCallsBar() {}

    renderCallsBar() {
      this._renderCallsBar();
    }

    renderAdapterSize() {
      this.renderAdapterSizeCalled = true;
    }

    _syncPosition() {
      this.syncPositionCalled = true;
    }

    _onPushAdapterState(options) {
      this.pushedAdapterState = options;
      return options;
    }

    _calculateFactor() {
      return 1;
    }

    setMinimized(minimized) {
      this._minimized = minimized;
      this._renderMainClass();
    }

    toggleMinimized() {
      this.setMinimized(!this._minimized);
    }

    get showDuration() {
      return this._hasActiveCalls;
    }

    get showOnHoldCalls() {
      return this._onHoldCallsLength > 0;
    }

    get showRingingCalls() {
      return this._ringingCallsLength > 0;
    }

    get moveOutCurrentCallBtn() {
      return false;
    }

    get moveInCurrentCallBtn() {
      return true;
    }
  });
  return {
    popWindow,
    requestWithPostMessage,
  };
}

function loadAdapter(options) {
  jest.resetModules();
  const mocks = installAdapterMocks(options);
  const Adapter = require('../../src/lib/Adapter').default;
  return {
    Adapter,
    ...mocks,
  };
}

function createAdapter(Adapter, options = {}) {
  const adapter = new Adapter({
    appUrl: 'https://apps.example.com/app.html?client=1',
    iconUrl: 'https://example.com/icon.png',
    logoUrl: 'https://example.com/logo.png',
    prefix: 'test-adapter',
    version: '1.0.0',
    newAdapterUI: true,
    enablePopup: true,
    ...options,
  });
  Object.defineProperty(adapter._contentFrameEl.contentWindow, 'postMessage', {
    value: jest.fn(),
    configurable: true,
  });
  return adapter;
}

describe('lib Adapter', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it('renders adapter DOM, applies assets, and handles adapter notifications', () => {
    const { Adapter } = loadAdapter();
    const adapter = createAdapter(Adapter);

    expect(adapter._appOrigin).toBe('https://apps.example.com');
    expect(adapter._contentFrameEl.src).toBe('https://apps.example.com/app.html?client=1');
    expect(adapter._iconEl.src).toBe('https://example.com/icon.png');
    expect(adapter._logoEl.src).toBe('https://example.com/logo.png');

    adapter._onMessage({
      type: 'rc-brand-assets-notify',
      logoUri: 'data:image/png;base64,abc',
      iconUri: 'https://example.com/new-icon.png',
    });
    adapter._onMessage({
      type: 'rc-adapter-theme-notify',
      theme: 'dark',
    });
    adapter._onMessage({
      type: 'rc-route-changed-notify',
      path: '/history',
    });
    adapter._onMessage({
      type: 'unknown-message',
      payload: true,
    });

    expect(adapter._theme).toBe('dark');
    expect(adapter._widgetCurrentPath).toBe('/history');
    expect(adapter._iconEl.src).toBe('https://example.com/new-icon.png');
    expect(adapter._logoEl.src).toBe('data:image/png;base64,abc');
    expect(adapter.baseMessages).toEqual([{ type: 'unknown-message', payload: true }]);
  });

  it('posts adapter commands and request-based commands to the iframe', async () => {
    const { Adapter, requestWithPostMessage } = loadAdapter();
    const adapter = createAdapter(Adapter);

    adapter.gotoPresence();
    adapter.setEnvironment();
    adapter.clickToSMS('+16505550100', 'hello', { id: 'conversation-id' }, [], { name: 'Ada' });
    adapter.clickToCall('+16505550101', true);
    adapter.controlCall('hangup', 'call-id', { reason: 'done' });
    adapter.logoutUser();
    adapter.updateCallingSetting({
      callWith: 'webphone',
      myLocation: 'Office',
      ringoutPrompt: true,
      fromNumber: '+16505550102',
    });
    adapter.updateSmsSetting({ senderNumber: '+16505550103' });
    adapter.navigateTo('/settings');
    adapter.updateRingtone({ name: 'Bell', uri: 'https://example.com/bell.mp3', volume: 0.5 });
    adapter.setAutoLog({ message: true, call: false });
    adapter.setPhoneNumberFormat({
      formatType: 'local',
      template: '(xxx) xxx-xxxx',
      readOnly: true,
      readOnlyReason: 'policy',
    });

    expect(adapter._contentFrameEl.contentWindow.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'rc-adapter-new-call',
        phoneNumber: '+16505550101',
      }),
      'https://apps.example.com',
    );
    expect(adapter._contentFrameEl.contentWindow.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'rc-adapter-set-phone-number-format',
        formatType: 'local',
      }),
      'https://apps.example.com',
    );

    await expect(adapter.scheduleMeeting({ topic: 'Planning' })).resolves.toEqual({ ok: true });
    await expect(adapter.createSMSTemplate('Greeting', 'Hi')).resolves.toEqual({ ok: true });
    await expect(adapter.alertMessage({ message: 'Saved', level: 'success' })).resolves.toEqual({ ok: true });
    await expect(adapter.dismissMessage('alert-id')).resolves.toEqual({ ok: true });
    await expect(adapter.getUnloggedCalls(10, 2)).resolves.toEqual({ ok: true });
    await expect(adapter.getCallLog({
      sessionId: 'session-id',
      telephonySessionId: 'telephony-session-id',
    })).resolves.toEqual({ ok: true });
    await expect(adapter.isWindowPoppedUp({ alert: true })).resolves.toEqual({ ok: true });

    expect(requestWithPostMessage).toHaveBeenCalledWith(
      '/schedule-meeting',
      { topic: 'Planning' },
      5000,
      adapter._contentFrameEl.contentWindow,
      'rc-adapter-message',
    );
  });

  it('intercepts tel and sms links from document clicks', () => {
    const { Adapter } = loadAdapter();
    const adapter = createAdapter(Adapter);
    const smsLink = document.createElement('a');
    smsLink.href = 'sms:+16505550104?body=hello';
    const telLink = document.createElement('a');
    telLink.href = 'tel:+16505550105';
    document.body.appendChild(smsLink);
    document.body.appendChild(telLink);

    smsLink.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    telLink.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(adapter._contentFrameEl.contentWindow.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'rc-adapter-new-sms',
        phoneNumber: '+16505550104',
        text: 'hello',
      }),
      'https://apps.example.com',
    );
    expect(adapter._contentFrameEl.contentWindow.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'rc-adapter-new-call',
        phoneNumber: '+16505550105',
        toCall: true,
      }),
      'https://apps.example.com',
    );
  });

  it('updates call bar state from webphone notifications', () => {
    const { Adapter } = loadAdapter();
    const adapter = createAdapter(Adapter);
    adapter._strings = {
      ringCallsInfo: '0 ringing calls',
      onHoldCallsInfo: '0 calls on hold',
    };

    adapter._updateWebphoneCalls({
      id: 'ringing',
      direction: 'Inbound',
      callStatus: 'webphone-session-connecting',
      startTime: 100,
    });
    adapter._updateWebphoneCalls({
      id: 'connected',
      direction: 'Outbound',
      callStatus: 'webphone-session-connected',
      startTime: 200,
    });
    adapter._updateWebphoneCalls({
      id: 'hold',
      direction: 'Outbound',
      callStatus: 'webphone-session-onHold',
      startTime: 300,
    });
    adapter._renderRingingCalls();
    adapter._renderOnHoldCalls();

    expect(adapter._hasActiveCalls).toBe(true);
    expect(adapter._ringingCallsLength).toBe(1);
    expect(adapter._onHoldCallsLength).toBe(1);
    expect(adapter._currentWebhoneCallId).toBe('connected');
    expect(adapter._ringingCallsEl.innerHTML).toBe('1 ringing calls');
    expect(adapter._onHoldCallsEl.innerHTML).toBe('1 calls on hold');
    expect(adapter.showCurrentCallBtn).toBe(true);
    expect(adapter.showViewCallsBtn).toBe(true);
    expect(adapter.centerDuration).toBe(false);

    adapter._updateWidgetCurrentPath('/calls/active/connected');
    expect(adapter.centerDuration).toBe(true);
    expect(adapter.showCurrentCallBtn).toBe(false);

    adapter._updateWebphoneCalls({
      id: 'connected',
      direction: 'Outbound',
      callStatus: 'webphone-session-connected',
      endTime: 400,
    });
    expect(adapter._currentWebhoneCallId).toBe('hold');

    adapter._updateWebphoneCalls({
      id: 'ringing',
      direction: 'Inbound',
      callStatus: 'webphone-session-connecting',
      endTime: 500,
    });
    adapter._updateWebphoneCalls({
      id: 'hold',
      direction: 'Outbound',
      callStatus: 'webphone-session-onHold',
      endTime: 600,
    });
    expect(adapter._webphoneCalls).toEqual([]);
    expect(adapter._currentStartTime).toBe(0);
  });

  it('handles popup, sizing, position, feedback, and popup-origin behavior', async () => {
    const { Adapter, popWindow, requestWithPostMessage } = loadAdapter();
    const adapter = createAdapter(Adapter, {
      popupPageUri: 'https://popup.example.com/popup.html',
    });

    requestWithPostMessage.mockResolvedValueOnce(false);
    await adapter.popupWindow();
    expect(popWindow).toHaveBeenCalledWith(
      'https://popup.example.com/popup.html?client=1',
      'RCPopupWindow',
      300,
      535,
    );
    expect(adapter._minimized).toBe(true);

    adapter._setPopupWindowSize(400, 600);
    expect(adapter._popupedWindow.resizeTo).toHaveBeenCalledWith(400, 700);

    const feedback = jest.fn();
    adapter.showFeedback({ onFeedback: feedback });
    adapter._feedbackEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(feedback).toHaveBeenCalled();
    expect(() => adapter.showFeedback({})).toThrow('onFeedback function is required.');

    adapter._minimized = true;
    adapter._showDockUI = true;
    adapter.renderPosition();
    expect(adapter._container.getAttribute('style')).toContain('translate(0px, 9px)');
    adapter._minimized = false;
    adapter.renderPosition();
    expect(adapter._container.getAttribute('style')).toContain('translate(12px, 34px)');

    adapter._onHeaderClicked();
    expect(adapter._minimized).toBe(false);
    adapter._minimized = true;
    adapter._onHeaderClicked();
    expect(adapter._minimized).toBe(false);

    const pushedState = adapter._onPushAdapterState({ minimized: true });
    expect(pushedState).toEqual({ minimized: true });
  });

  it('adjusts iframe layout and sandbox behavior in popup and Safari modes', () => {
    const { Adapter } = loadAdapter({ isSafari: true });
    window.opener = {
      postMessage: jest.fn(),
    };
    const adapter = createAdapter(Adapter, {
      fromPopup: true,
      appWidth: 360,
      appHeight: 640,
    });

    expect(adapter._contentFrameEl.getAttribute('sandbox')).not.toContain('allow-downloads');
    adapter.renderAdapterSize();
    adapter.renderPosition();
    adapter._syncPosition();

    expect(adapter._contentFrameContainerEl.style.width).toBe('100%');
    expect(adapter._contentFrameEl.style.height).toBe('100%');
    expect(window.opener.postMessage).toHaveBeenCalledWith({
      type: 'rc-adapter-set-popup-window-size',
      width: 360,
      height: 640,
    }, '*');
    expect(adapter.syncPositionCalled).toBeUndefined();
    expect(adapter._onPushAdapterState({ minimized: true })).toEqual({
      minimized: false,
    });
    delete window.opener;
  });

  it('covers adapter browser edge cases, notification messages, and command defaults', async () => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = 'https://{{rc-styles}} .root {}';
    document.head.appendChild(styleEl);
    const notificationInstances = [];
    window.Notification = jest.fn(function MockNotification(title, options) {
      this.title = title;
      this.options = options;
      notificationInstances.push(this);
    });
    window.Notification.permission = 'granted';
    window.Notification.requestPermission = jest.fn();

    const { Adapter, requestWithPostMessage } = loadAdapter();
    const adapter = createAdapter(Adapter, {
      enableNotification: true,
      enablePopup: false,
      iconUrl: 'ftp://example.com/icon.png',
      logoUrl: 'javascript:alert(1)',
      newAdapterUI: false,
      popupPageUri: undefined,
    });

    expect(adapter._root.querySelectorAll('style')).toHaveLength(1);
    adapter._setIconUrl('data:image/png;base64,abc');
    adapter._setLogoUrl('chrome-extension://extension/logo.png');
    expect(adapter._iconEl.src).toBe('data:image/png;base64,abc');
    expect(adapter._logoEl.src).toBe('chrome-extension://extension/logo.png');
    adapter._setIconUrl('file:///tmp/icon.png');
    adapter._setLogoUrl('ftp://example.com/logo.png');
    expect(adapter._iconEl.src).toBe('data:image/png;base64,abc');
    expect(adapter._logoEl.src).toBe('chrome-extension://extension/logo.png');

    adapter._onMessage({
      type: 'rc-call-ring-notify',
      call: {
        id: 'ring',
        direction: 'Inbound',
        from: '+16505550100',
        fromUserName: 'Caller',
        callStatus: 'webphone-session-connecting',
      },
    });
    expect(window.Notification).toHaveBeenCalledWith(
      'New Call',
      expect.objectContaining({
        body: 'Incoming Call from Caller',
      }),
    );
    window.focus = jest.fn();
    notificationInstances[0].onclick();
    expect(window.focus).toHaveBeenCalled();

    [
      { type: 'rc-call-init-notify', call: { id: 'init', callStatus: 'webphone-session-setup' } },
      { type: 'rc-call-start-notify', call: { id: 'start', callStatus: 'webphone-session-connected', startTime: 1 } },
      { type: 'rc-call-hold-notify', call: { id: 'start', callStatus: 'webphone-session-onHold', startTime: 1 } },
      { type: 'rc-call-resume-notify', call: { id: 'start', callStatus: 'webphone-session-connected', startTime: 1 } },
      { type: 'rc-call-mute-notify', call: { id: 'start' } },
      { type: 'rc-webphone-active-notify', currentActive: true },
      { type: 'rc-webphone-connection-status-notify', connectionStatus: 'connected' },
      { type: 'rc-webphone-sessions-sync', calls: [] },
      { type: 'rc-login-status-notify', loggedIn: true, loginNumber: '+1', contractedCountryCode: 'US', admin: false, features: {}, isFreshLogin: false },
      { type: 'rc-calling-settings-notify', callWith: 'browser', callingMode: 'webphone' },
      { type: 'rc-sms-settings-notify', senderNumber: '+1', senderNumbers: [] },
      { type: 'rc-region-settings-notify', countryCode: 'US', areaCode: '650' },
      { type: 'rc-active-call-notify', call: { id: 'server-call' } },
      { type: 'rc-ringout-call-notify', call: { id: 'ringout-call' } },
      { type: 'rc-inbound-message-notify', message: { id: 'message-1' } },
      { type: 'rc-message-updated-notify', message: { id: 'message-2' } },
      { type: 'rc-message-thread-notify', thread: { id: 'thread-1' } },
      { type: 'rc-message-thread-entity-notify', entity: { id: 'entity-1' } },
      { type: 'rc-callLogger-auto-log-notify', autoLog: true },
      { type: 'rc-dialer-status-notify', ready: true },
      { type: 'rc-meeting-status-notify', ready: true, permission: true },
      { type: 'rc-call-history-synced-notify' },
      { type: 'rc-brand-assets-notify' },
      { type: 'rc-adapter-phone-number-format-settings-notify', formatType: 'custom', template: '###' },
    ].forEach((message) => adapter._onMessage(message));
    expect(adapter._webphoneActive).toBe(true);

    adapter._popupedWindow = {
      resizeTo: jest.fn(),
      outerHeight: 0,
    };
    adapter._onMessage({
      type: 'rc-adapter-set-popup-window-size',
      width: 500,
      height: 700,
    });
    expect(adapter._popupedWindow.resizeTo).toHaveBeenCalledWith(500, 564);
    adapter._popupedWindow = null;
    expect(() => adapter._setPopupWindowSize(400, 500)).not.toThrow();

    const nestedSmsLink = document.createElement('a');
    nestedSmsLink.href = 'sms:+16505550110?text=nested';
    const nestedSmsChild = document.createElement('span');
    nestedSmsLink.appendChild(nestedSmsChild);
    const nestedTelLink = document.createElement('a');
    nestedTelLink.href = 'tel:+16505550111';
    const nestedTelMiddle = document.createElement('span');
    const nestedTelChild = document.createElement('strong');
    nestedTelMiddle.appendChild(nestedTelChild);
    nestedTelLink.appendChild(nestedTelMiddle);
    document.body.appendChild(nestedSmsLink);
    document.body.appendChild(nestedTelLink);
    nestedSmsChild.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    nestedTelChild.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(adapter._contentFrameEl.contentWindow.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'rc-adapter-new-sms',
        phoneNumber: '+16505550110',
        text: 'nested',
      }),
      'https://apps.example.com',
    );
    expect(adapter._contentFrameEl.contentWindow.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'rc-adapter-new-call',
        phoneNumber: '+16505550111',
      }),
      'https://apps.example.com',
    );

    const unloadEvent = new Event('beforeunload', { cancelable: true });
    adapter._webphoneActive = true;
    adapter._webphoneCalls = [{ id: 'active' }];
    window.dispatchEvent(unloadEvent);
    expect(unloadEvent.returnValue).toBe(true);

    adapter._minimized = true;
    adapter._showDockUI = false;
    adapter.renderPosition();
    expect(adapter._container.getAttribute('style')).toContain('translate( 4px, -6px)');
    adapter._fromPopup = true;
    adapter.renderPosition();
    adapter._syncPosition();
    expect(adapter.syncPositionCalled).toBeUndefined();
    adapter._fromPopup = false;
    adapter._minimized = true;
    adapter._renderCallsBar();
    adapter._strings = null;
    adapter._ringingCallsLength = 1;
    adapter._onHoldCallsLength = 1;
    expect(() => adapter._renderRingingCalls()).not.toThrow();
    expect(() => adapter._renderOnHoldCalls()).not.toThrow();
    adapter._updateWidgetCurrentPath('/history');
    expect(adapter.showViewCallsBtn).toBe(false);
    expect(adapter.centerCallInfo).toBe(true);

    requestWithPostMessage.mockResolvedValueOnce(true);
    adapter._popupedWindow = {
      focus: jest.fn(),
    };
    await adapter.popupWindow();
    expect(adapter._popupedWindow.focus).toHaveBeenCalled();
    requestWithPostMessage.mockRejectedValueOnce(new Error('popup check failed'));
    await expect(adapter.popupWindow()).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledWith(expect.any(Error));

    adapter.clickToSMS('+16505550112');
    adapter.clickToCall('+16505550113');
    adapter.controlCall('hold', 'call-id');
    adapter.dismissMessage();
    adapter.setAutoLog();
    adapter.isWindowPoppedUp();
    expect(adapter._contentFrameEl.contentWindow.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'rc-adapter-new-call',
        toCall: false,
      }),
      'https://apps.example.com',
    );
    expect(requestWithPostMessage).toHaveBeenCalledWith(
      '/dismiss-alert-message',
      { id: null },
      5000,
      adapter._contentFrameEl.contentWindow,
      'rc-adapter-message',
    );
    expect(adapter._contentFrameEl.contentWindow.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'rc-adapter-update-auto-log-settings',
        call: undefined,
        message: undefined,
      }),
      'https://apps.example.com',
    );

    Object.defineProperty(adapter._contentFrameEl, 'contentWindow', {
      value: null,
      configurable: true,
    });
    expect(() => adapter._postMessage({ type: 'no-content-window' })).not.toThrow();
    delete window.Notification;
  });
});
