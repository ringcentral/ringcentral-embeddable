// The RingCX offhook leg is left out of `sessions`, but closing the tab that
// carries its media drops the agent's audio all the same, so the unload guard
// counts it like any other call.

const { WebphoneV2 } = require('../../src/app/services/WebphoneV2/WebphoneV2');

function create({ policy = 'end', hasOtherConnectedClients = false } = {}) {
  const webphone = new WebphoneV2(
    { addBeforeLogoutHandler: jest.fn() },
    {},
    { enable: jest.fn() },
    { factory: jest.fn(), isLocalMediaOwner: true, hasOtherConnectedClients },
    { inputDeviceId: '' },
    {
      shared: true,
      isServer: false,
      isClient: true,
      isWorkerMode: true,
      onClient: jest.fn(),
      onServer: jest.fn(),
    },
    { mediaOwnerLossPolicy: policy },
  );
  webphone.logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  return webphone;
}

function unload(webphone) {
  const event = { preventDefault: jest.fn(), returnValue: undefined };
  webphone._handleBeforeUnload(event);
  return event;
}

describe('Webphone unload guard with a RingCX offhook leg', () => {
  test('blocks closing the media tab while only the offhook leg is live', () => {
    const webphone = create();
    webphone.cxOffhookSessionId = 'offhook-session';

    const event = unload(webphone);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.returnValue).toBe(true);
  });

  test('lets the tab close when no call or offhook leg is live', () => {
    const webphone = create();

    expect(unload(webphone).preventDefault).not.toHaveBeenCalled();
  });

  test('lets the tab close when another tab can recover the offhook leg', () => {
    const webphone = create({
      policy: 'recover',
      hasOtherConnectedClients: true,
    });
    webphone.cxOffhookSessionId = 'offhook-session';

    expect(unload(webphone).preventDefault).not.toHaveBeenCalled();
  });

  test('blocks when no other tab is left to recover the offhook leg', () => {
    const webphone = create({ policy: 'recover' });
    webphone.cxOffhookSessionId = 'offhook-session';

    expect(unload(webphone).preventDefault).toHaveBeenCalled();
  });
});
