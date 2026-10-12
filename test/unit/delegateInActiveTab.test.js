const { nameKey } = require('@ringcentral-integration/next-core');
const {
  setupActiveTabDelegate,
} = require('../../src/lib/delegateInActiveTab');

function createPortManager(shared = true) {
  const clientCallbacks = [];
  const serverCallbacks = [];

  return {
    shared,
    isActiveTab: true,
    isWorkerMode: false,
    activeTabId: undefined,
    mainClientId: undefined,
    promiseMainTabClient: Promise.resolve(),
    checkMainTabMapping: new Map(),
    customClientDelegateNameMapping: new Map(),
    onClient: jest.fn((callback) => clientCallbacks.push(callback)),
    onServer: jest.fn((callback) => serverCallbacks.push(callback)),
    clientCallbacks,
    serverCallbacks,
  };
}

function createTransport() {
  const listeners = new Map();

  return {
    listeners,
    listen: jest.fn((channelName, callback) => {
      if (listeners.has(channelName)) {
        throw new Error(`Duplicate listener: ${channelName}`);
      }
      listeners.set(channelName, callback);
    }),
    emit: jest.fn(),
  };
}

describe('setupActiveTabDelegate', () => {
  it('registers distinct constructor-safe channels for named modules', () => {
    const portManager = createPortManager();
    const meetingHomeView = { [nameKey]: 'MeetingHomeView' };
    const meetingInviteView = { [nameKey]: 'MeetingInviteView' };

    setupActiveTabDelegate(meetingHomeView, portManager);
    setupActiveTabDelegate(meetingInviteView, portManager);

    expect(portManager.customClientDelegateNameMapping.get(meetingHomeView)).toBe(
      'activeTab:MeetingHomeView',
    );
    expect(
      portManager.customClientDelegateNameMapping.get(meetingInviteView),
    ).toBe('activeTab:MeetingInviteView');

    const clientTransport = createTransport();
    const serverTransport = createTransport();
    portManager.clientCallbacks.forEach((callback) =>
      callback(clientTransport),
    );
    portManager.serverCallbacks.forEach((callback) =>
      callback(serverTransport),
    );

    expect([...clientTransport.listeners.keys()]).toEqual([
      'activeTab:MeetingHomeView',
      'activeTab:MeetingInviteView',
    ]);
    expect([...serverTransport.listeners.keys()]).toEqual([
      'activeTab:MeetingHomeView',
      'activeTab:MeetingInviteView',
    ]);
    expect(clientTransport.listeners.has('activeTab:unknown')).toBe(false);
    expect(serverTransport.listeners.has('activeTab:unknown')).toBe(false);
  });

  it('prefers an explicit channel name', () => {
    const portManager = createPortManager();
    const module = {};

    setupActiveTabDelegate(module, portManager, {
      channelName: 'activeTab:custom',
    });

    expect(portManager.customClientDelegateNameMapping.get(module)).toBe(
      'activeTab:custom',
    );
  });

  it('fails before registering a nameless shared module', () => {
    const portManager = createPortManager();

    expect(() => setupActiveTabDelegate({}, portManager)).toThrow(
      'the module has no stable identifier',
    );
    expect(portManager.onClient).not.toHaveBeenCalled();
    expect(portManager.onServer).not.toHaveBeenCalled();
  });

  it('does nothing outside shared-tab mode', () => {
    const portManager = createPortManager(false);

    expect(() => setupActiveTabDelegate({}, portManager)).not.toThrow();
    expect(portManager.checkMainTabMapping.size).toBe(0);
    expect(portManager.customClientDelegateNameMapping.size).toBe(0);
    expect(portManager.onClient).not.toHaveBeenCalled();
    expect(portManager.onServer).not.toHaveBeenCalled();
  });
});
