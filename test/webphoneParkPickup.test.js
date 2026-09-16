const { invokeRole } = require('@ringcentral-integration/next-core');

const { Webphone } = require('../src/app/services/WebphoneV2/Webphone');
const { WebphoneV2 } = require('../src/app/services/WebphoneV2/WebphoneV2');
const {
  recordStatus,
} = require('../src/app/services/WebphoneV2/recordStatus');

beforeEach(() => {
  invokeRole.mockReset();
});

afterEach(() => {
  jest.restoreAllMocks();
});

function create() {
  const toast = { success: jest.fn(), danger: jest.fn(), warning: jest.fn() };
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
    toast,
    undefined,
    undefined,
    undefined,
  );
  webphone.logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  return { webphone, toast };
}

// The presence payload every caller already holds: flat party strings.
const presenceActiveCall = {
  id: 'active-call',
  direction: 'Inbound',
  from: '+16505550111',
  fromName: 'Alice',
  to: '+16505550222',
  toName: 'Front desk',
  telephonySessionId: 'telephony-1',
  sipData: { fromTag: 'from-tag', toTag: 'to-tag' },
};

describe('parkToLocation', () => {
  it('accepts the positional args the app uses and returns the destination', async () => {
    const { webphone, toast } = create();
    const runtime = jest
      .spyOn(WebphoneV2.prototype, 'parkToLocation')
      .mockResolvedValue('Front desk');

    const destination = await webphone.parkToLocation('session-1', {
      id: '101',
      name: 'Front desk',
      extensionNumber: '101',
    });

    // Passing the session id positionally used to land a string where the
    // runtime expected `{ sessionId, location }`, so the command threw on
    // validation and park-to-location silently stopped working.
    expect(runtime).toHaveBeenCalledWith({
      sessionId: 'session-1',
      location: { id: '101', name: 'Front desk', extensionNumber: '101' },
    });
    expect(destination).toBe('Front desk');
    expect(toast.success).toHaveBeenCalledTimes(1);
  });

  it('still accepts the runtime params object', async () => {
    const { webphone } = create();
    const runtime = jest
      .spyOn(WebphoneV2.prototype, 'parkToLocation')
      .mockResolvedValue('101');

    await webphone.parkToLocation({
      sessionId: 'session-1',
      location: { id: '101' },
    });

    expect(runtime).toHaveBeenCalledWith({
      sessionId: 'session-1',
      location: { id: '101' },
    });
  });

  it('does nothing without a park location id', async () => {
    const { webphone, toast } = create();
    const runtime = jest.spyOn(WebphoneV2.prototype, 'parkToLocation');

    await expect(
      webphone.parkToLocation('session-1', {}),
    ).resolves.toBeUndefined();

    expect(runtime).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('reports no destination when the runtime rejects', async () => {
    const { webphone, toast } = create();
    jest
      .spyOn(WebphoneV2.prototype, 'parkToLocation')
      .mockRejectedValue(new Error('not connected'));

    // The park view has no catch of its own; it branches on a falsy result.
    await expect(
      webphone.parkToLocation('session-1', { id: '101' }),
    ).resolves.toBeUndefined();
    expect(toast.success).not.toHaveBeenCalled();
  });
});

describe('park', () => {
  it('returns the park extension and announces it', async () => {
    const { webphone, toast } = create();
    jest.spyOn(WebphoneV2.prototype, 'park').mockResolvedValue('*801');

    await expect(webphone.park('session-1')).resolves.toBe('*801');
    expect(toast.success).toHaveBeenCalledTimes(1);
  });

  it('reports no destination when the runtime rejects', async () => {
    const { webphone, toast } = create();
    jest
      .spyOn(WebphoneV2.prototype, 'park')
      .mockRejectedValue(new Error('busy'));

    await expect(webphone.park('session-1')).resolves.toBeUndefined();
    expect(toast.success).not.toHaveBeenCalled();
  });
});

describe('monitored-extension pickup', () => {
  it('converts the presence call into the runtime params', async () => {
    const { webphone } = create();
    const runtime = jest
      .spyOn(WebphoneV2.prototype, 'pickParkLocation')
      .mockResolvedValue({ id: 'new-session' });

    const result = await webphone.pickParkLocation(
      'park-id',
      presenceActiveCall,
      '+16505550100',
    );

    expect(runtime).toHaveBeenCalledWith({
      extensionId: 'park-id',
      fromNumber: '+16505550100',
      activeCall: {
        telephonySessionId: 'telephony-1',
        direction: 'Inbound',
        from: { phoneNumber: '+16505550111', name: 'Alice' },
        to: { phoneNumber: '+16505550222', name: 'Front desk' },
        sipData: { fromTag: 'from-tag', toTag: 'to-tag' },
      },
    });
    expect(result).toEqual({ id: 'new-session' });
  });

  it('routes the group-call prefix to the matching runtime command', async () => {
    const { webphone } = create();
    const group = jest
      .spyOn(WebphoneV2.prototype, 'pickGroupCall')
      .mockResolvedValue(null);
    const queue = jest
      .spyOn(WebphoneV2.prototype, 'pickCallQueueCall')
      .mockResolvedValue(null);

    await webphone.pickGroupCall(
      'group-id',
      presenceActiveCall,
      '+16505550100',
    );
    // `Adapter` passes 'qpk' for Department extensions; the runtime has split
    // that out into its own command.
    await webphone.pickGroupCall(
      'queue-id',
      presenceActiveCall,
      '+16505550100',
      'qpk',
    );

    expect(group).toHaveBeenCalledTimes(1);
    expect(queue).toHaveBeenCalledTimes(1);
    expect(queue.mock.calls[0][0].extensionId).toBe('queue-id');
  });

  it('picks a call-queue call positionally', async () => {
    const { webphone } = create();
    const queue = jest
      .spyOn(WebphoneV2.prototype, 'pickCallQueueCall')
      .mockResolvedValue(null);

    await webphone.pickCallQueueCall(
      'queue-id',
      presenceActiveCall,
      '+16505550100',
    );

    expect(queue.mock.calls[0][0].extensionId).toBe('queue-id');
  });

  it('rejects a pickup with no active call', async () => {
    const { webphone } = create();

    await expect(webphone.pickParkLocation('park-id')).rejects.toThrow(
      'Invalid activeCall',
    );
  });

  it('picks a call with no sipData, without a Replaces header', async () => {
    const { webphone } = create();
    const createOutbound = jest
      .spyOn(webphone, '_createOutboundSession')
      .mockResolvedValue({ normalized: { id: 'new-session' } });

    await webphone.pickParkLocation(
      'park-id',
      { ...presenceActiveCall, sipData: undefined },
      '+16505550100',
    );

    // Presence does not always carry sipData, and the previous service picked
    // the call anyway.
    expect(createOutbound).toHaveBeenCalledWith(
      'prkpark-id',
      '+16505550100',
      {},
      expect.any(Object),
    );
  });
});

describe('updateRecordStatus', () => {
  it('writes the status onto the session record', async () => {
    const { webphone } = create();
    webphone._sessionRecords.set('session-1', {
      session: {},
      normalized: { id: 'session-1', recordStatus: recordStatus.idle },
      revision: 0,
      finalized: false,
    });
    jest.spyOn(webphone, '_publishLiveState').mockImplementation(() => {});

    await webphone.updateRecordStatus('session-1', recordStatus.recording);

    expect(
      webphone._sessionRecords.get('session-1').normalized.recordStatus,
    ).toBe(recordStatus.recording);
  });

  it('ignores an unknown session', async () => {
    const { webphone } = create();
    await expect(
      webphone.updateRecordStatus('missing', recordStatus.recording),
    ).resolves.toBeUndefined();
  });
});

it('routes every park, pickup and session-record command to the server', async () => {
  const { webphone } = create();
  const spy = jest
    .spyOn(webphone, '_executeRuntimeCommand')
    .mockResolvedValue(undefined);

  // These all read or write `_sessionRecords`, which only exists on the
  // authoritative port — a tab running them locally finds nothing.
  await webphone.parkToLocation('s', { id: '1' });
  await webphone.pickParkLocation('e', presenceActiveCall, '+16505550100');
  await webphone.pickGroupCall('e', presenceActiveCall, '+16505550100');
  await webphone.pickCallQueueCall('e', presenceActiveCall, '+16505550100');
  await webphone.updateRecordStatus('s', recordStatus.idle);
  await webphone.setForwardFlag('s');

  expect(spy.mock.calls.map(([name]) => name)).toEqual([
    'parkToLocation',
    'pickParkLocation',
    'pickGroupCall',
    'pickCallQueueCall',
    'updateRecordStatus',
    'setForwardFlag',
  ]);
});
