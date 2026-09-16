const { invokeRole } = require('@ringcentral-integration/next-core');
const { Webphone } = require('../src/app/services/WebphoneV2/Webphone');

function create() {
  const webphone = new Webphone(
    { addBeforeLogoutHandler: jest.fn() },
    {},
    { enable: jest.fn() },
    { factory: jest.fn(), isLocalMediaOwner: false },
    { inputDeviceId: '' },
    {
      shared: true,
      isServer: true,
      isClient: false,
      isWorkerMode: true,
      onClient: jest.fn(),
      onServer: jest.fn(),
    },
    { success: jest.fn(), danger: jest.fn(), warning: jest.fn() },
    undefined,
    undefined,
    undefined,
  );
  webphone.logger = {
    debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn(),
  };
  return webphone;
}

const sipInfo = { outboundProxy: 'main:8083', outboundProxyBackup: 'backup:8083' };

function fakeWebPhone() {
  return { sipClient: { toggleBackupOutboundProxy: jest.fn() } };
}

beforeEach(() => invokeRole.mockReset());

it('uses the main proxy on a first connect', () => {
  const webphone = create();
  const wp = fakeWebPhone();
  webphone._socketRecoveryAttempt = 0;
  webphone._applyOutboundProxyPreference(wp, sipInfo);
  expect(wp.sipClient.toggleBackupOutboundProxy).toHaveBeenCalledWith(false);
});

it('switches to the backup proxy after repeated failures', () => {
  const webphone = create();
  const wp = fakeWebPhone();
  webphone._socketRecoveryAttempt = 2;
  webphone._applyOutboundProxyPreference(wp, sipInfo);
  expect(wp.sipClient.toggleBackupOutboundProxy).toHaveBeenCalledWith(true);
});

it('rotates back to the main proxy if the backup also fails', () => {
  const webphone = create();
  const wp = fakeWebPhone();
  webphone._socketRecoveryAttempt = 4;
  webphone._applyOutboundProxyPreference(wp, sipInfo);
  expect(wp.sipClient.toggleBackupOutboundProxy).toHaveBeenCalledWith(false);
});

it('does nothing when no backup proxy is provisioned', () => {
  const webphone = create();
  const wp = fakeWebPhone();
  webphone._socketRecoveryAttempt = 4;
  webphone._applyOutboundProxyPreference(wp, { outboundProxy: 'main:8083' });
  expect(wp.sipClient.toggleBackupOutboundProxy).not.toHaveBeenCalled();
});

it('tolerates a sip client without the toggle', () => {
  const webphone = create();
  expect(() =>
    webphone._applyOutboundProxyPreference({ sipClient: {} }, sipInfo),
  ).not.toThrow();
});
