import { watch } from '@ringcentral-integration/next-core';

import { TabManager } from '../src/app/services/TabManager/TabManager';

function createPortManager(overrides = {}) {
  return {
    shared: false,
    isServer: false,
    isMainTab: true,
    isActiveTab: true,
    clientId: 'client-1',
    mainClientId: 'main-1',
    activeTabId: 'active-1',
    activeNonMainTabId: 'other-1',
    initMainClient$: { next: jest.fn() },
    onClient: jest.fn(),
    onMainTab: jest.fn(() => jest.fn()),
    ...overrides,
  };
}

async function flushPromises() {
  for (let index = 0; index < 5; index += 1) {
    await Promise.resolve();
  }
}

describe('TabManager service', () => {
  beforeEach(() => {
    watch.mockReset();
    watch.mockReturnValue(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('exposes current tab identity and active state in a non-shared runtime', () => {
    const portManager = createPortManager();
    const tabManager = new TabManager(portManager);

    expect(tabManager.id).toBe('client-1');
    expect(tabManager.active).toBe(true);
    expect(tabManager.interactingTabId).toBe('active-1');
    expect(tabManager.interacting).toBe(true);
    expect(tabManager.autoMainTab).toBe(true);
    expect(tabManager.fromPopup).toBe(false);
    expect(tabManager.enable).toBe(true);
    expect(tabManager.tabs).toEqual(['client-1', 'main-1', 'active-1', 'other-1']);
    expect(tabManager.hasMultipleTabs).toBe(true);
    expect(tabManager.isFirstTab).toBe(true);
    expect(portManager.initMainClient$.next).toHaveBeenCalledWith(true);
  });

  test('falls back through client identifiers and removes duplicates', () => {
    const tabManager = new TabManager(
      createPortManager({
        clientId: null,
        mainClientId: 'main',
        activeTabId: 'main',
        activeNonMainTabId: null,
      }),
      { autoMainTab: false },
    );

    expect(tabManager.id).toBe('main');
    expect(tabManager.actualTabIds).toEqual(['main']);
    expect(tabManager.hasMultipleTabs).toBe(false);

    const noId = new TabManager(
      createPortManager({
        clientId: null,
        mainClientId: null,
        activeTabId: null,
        activeNonMainTabId: null,
      }),
      { autoMainTab: false },
    );
    expect(noId.id).toBe('');
    expect(noId.actualTabIds).toEqual([]);
  });

  test.each([
    [{ isServer: true, shared: true, isActiveTab: false, isMainTab: false }, {}, true],
    [{ isServer: false, shared: true, isActiveTab: true, isMainTab: false }, {}, true],
    [{ isServer: false, shared: true, isActiveTab: false, isMainTab: true }, {}, false],
    [
      { isServer: false, shared: true, isActiveTab: false, isMainTab: true },
      { autoMainTab: false },
      true,
    ],
    [
      { isServer: false, shared: true, isActiveTab: true, isMainTab: false },
      { autoMainTab: false },
      false,
    ],
  ])('derives active state from runtime role %#', (portOverrides, options, expected) => {
    let initializeClient;
    const portManager = createPortManager({
      ...portOverrides,
      onClient: jest.fn((handler) => {
        initializeClient = handler;
      }),
    });
    const tabManager = new TabManager(portManager, options);

    expect(tabManager.active).toBe(expected);
    expect(tabManager.interacting).toBe(
      portOverrides.isServer || portOverrides.isActiveTab,
    );
    expect(initializeClient).toEqual(expect.any(Function));
  });

  test('initializes a shared client exactly once', () => {
    let initializeClient;
    const portManager = createPortManager({
      shared: true,
      onClient: jest.fn((handler) => {
        initializeClient = handler;
      }),
    });
    const tabManager = new TabManager(portManager);

    expect(portManager.initMainClient$.next).not.toHaveBeenCalled();
    const dispose = initializeClient();
    expect(portManager.initMainClient$.next).toHaveBeenCalledWith(true);
    expect(typeof dispose).toBe('function');
    expect(initializeClient()).toEqual(expect.any(Function));
    expect(watch).toHaveBeenCalledTimes(1);
    expect(tabManager._clientInitialized).toBe(true);
  });

  test('coordinates popup main-client handoff and pagehide cleanup', async () => {
    let mainTabHandler;
    const removeMainTabListener = jest.fn();
    const portManager = createPortManager({
      shared: false,
      isMainTab: false,
      clientId: 'popup-1',
      onMainTab: jest.fn((handler) => {
        mainTabHandler = handler;
        return removeMainTabListener;
      }),
    });
    const tabManager = new TabManager(portManager, { fromPopup: true });
    await flushPromises();

    expect(portManager.initMainClient$.next).toHaveBeenCalledWith(true);
    expect(tabManager.popupIsBecomingMain).toBe(true);
    expect(tabManager.popupTabId).toBe('popup-1');
    expect(tabManager.fromPopup).toBe(true);
    expect(tabManager.isPopupWindowOpened).toBe(true);
    expect(tabManager.isFirstTab).toBe(true);

    mainTabHandler();
    await flushPromises();
    expect(tabManager.popupIsBecomingMain).toBe(false);

    window.dispatchEvent(new Event('pagehide'));
    await flushPromises();
    expect(tabManager.popupTabId).toBe('');

    const dispose = tabManager._initializePopup();
    dispose();
    expect(removeMainTabListener).toHaveBeenCalled();
  });

  test('keeps a different popup id on pagehide and skips becoming-main state when already main', async () => {
    const portManager = createPortManager({ isMainTab: true, clientId: 'popup-1' });
    const tabManager = new TabManager(portManager, { fromPopup: true });
    await flushPromises();
    await tabManager.setPopupTabId('another-popup');

    window.dispatchEvent(new Event('pagehide'));
    await flushPromises();

    expect(tabManager.popupTabId).toBe('another-popup');
    expect(tabManager.popupIsBecomingMain).toBe(false);
  });

  test('reloads during popup handoff and requests main after handoff', () => {
    let popupHandoffListener;
    const cleanup = jest.fn();
    watch.mockImplementation((_module, _selector, listener) => {
      popupHandoffListener = listener;
      return cleanup;
    });
    const originalLocation = global.location;
    const reload = jest.fn();
    Object.defineProperty(global, 'location', {
      configurable: true,
      value: { reload },
    });
    const portManager = createPortManager();
    const tabManager = new TabManager(portManager);
    portManager.initMainClient$.next.mockClear();

    popupHandoffListener(true);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(portManager.initMainClient$.next).not.toHaveBeenCalled();

    popupHandoffListener(false);
    expect(portManager.initMainClient$.next).toHaveBeenCalledWith(true);
    const dispose = tabManager._initializeNonPopup();
    dispose();
    expect(cleanup).toHaveBeenCalled();

    Object.defineProperty(global, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  test('does not request main when options prohibit promotion', () => {
    const portManager = createPortManager({
      shared: true,
      isServer: false,
      onClient: jest.fn(),
    });
    const tabManager = new TabManager(portManager, {
      autoMainTab: false,
      isMainTab: false,
    });

    tabManager._requestMainClient();
    expect(portManager.initMainClient$.next).not.toHaveBeenCalled();

    tabManager._tabManagerOptions.isMainTab = true;
    tabManager._requestMainClient();
    expect(portManager.initMainClient$.next).toHaveBeenCalledWith(true);
  });

  test('reports first-tab state around popup ownership', async () => {
    const portManager = createPortManager({
      shared: true,
      isServer: false,
      isMainTab: false,
      onClient: jest.fn(),
    });
    const tabManager = new TabManager(portManager, { autoMainTab: false });
    expect(tabManager.isFirstTab).toBe(false);

    await tabManager.setPopupTabId('popup');
    expect(tabManager.isFirstTab).toBe(false);
    portManager.isServer = true;
    expect(tabManager.isFirstTab).toBe(true);
  });

  test('publishes events and emits only on other clients', async () => {
    const tabManager = new TabManager(createPortManager({ clientId: 'sender' }));
    const namedListener = jest.fn();
    const allListener = jest.fn();
    const removeNamed = tabManager.on('updated', namedListener);
    const removeAll = tabManager.onTabEvent(allListener);

    await tabManager.send('updated', 'one', 2);
    expect(tabManager.event).toEqual({ name: 'updated', args: ['one', 2] });
    expect(namedListener).not.toHaveBeenCalled();

    await tabManager._emitEventInClients('another-client', {
      name: 'updated',
      args: ['remote'],
    });
    expect(namedListener).toHaveBeenCalledWith('remote');
    expect(allListener).toHaveBeenCalledWith({ name: 'updated', args: ['remote'] });

    removeNamed();
    removeAll();
    await tabManager._emitEventInClients('another-client', {
      name: 'updated',
      args: ['ignored'],
    });
    expect(namedListener).toHaveBeenCalledTimes(1);
    expect(allListener).toHaveBeenCalledTimes(1);
  });

  test('checks main-client and tab liveness state', async () => {
    const tabManager = new TabManager(
      createPortManager({
        clientId: 'one',
        mainClientId: 'two',
        activeTabId: null,
        activeNonMainTabId: null,
      }),
    );

    await expect(tabManager.checkIsMain()).resolves.toBe(true);
    await expect(tabManager.checkTabAliveById('two')).resolves.toBe(true);
    await expect(tabManager.checkTabAliveById('missing')).resolves.toBe(false);
  });
});
