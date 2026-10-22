// A CX voicemail drop plays the message on the hidden RingEX webphone session
// that carries the CX audio (the offhook session). CxVoicemailDrop follows the
// drop: it hangs up the CX call once the message ends and puts the voice
// channel back when the CX call ends, so the next CX call has working audio.

jest.mock('../../src/ringcx/services/CxActiveCallControl', () => ({
  CxActiveCallControl: class CxActiveCallControl {},
}));
jest.mock('../../src/ringcx/services/CxCallDisposition', () => ({
  CxCallDisposition: class CxCallDisposition {},
}));
jest.mock('../../src/ringcx/services/CxClient', () => ({
  CxClient: class CxClient {},
}));
jest.mock('../../src/ringcx/services/CxPresence', () => ({
  CxPresence: class CxPresence {},
}));
jest.mock('../../src/app/views/RoutedSideWidgetView', () => ({
  RoutedSideWidgetView: class RoutedSideWidgetView {},
}));
jest.mock('../../src/ringcx/services/CxVoicemailDrop/i18n', () => ({
  __esModule: true,
  default: {},
  t: (key) => key,
}));

import { voicemailDropStatus } from '../../src/app/services/WebphoneV2/voicemailDropStatus';
import { cxPath } from '../../src/ringcx/routes';
import { CxVoicemailDrop } from '../../src/ringcx/services/CxVoicemailDrop/CxVoicemailDrop';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const OFFHOOK_SESSION_ID = 'offhook-session';
const CX_CALL_ID = 'uii-1$session-1';
const MESSAGE_ID = 'message-1';

function createCall(overrides = {}) {
  return {
    session: { uii: 'uii-1', sessionId: 'session-1' },
    callType: 'OUTBOUND',
    endedCall: false,
    outdialDispositions: { dispositions: [{ dispositionId: 'd-1' }] },
    ...overrides,
  };
}

function createVoicemailDrop({
  call = createCall(),
  hasPermission = true,
  offhookSessionId = OFFHOOK_SESSION_ID,
  dropStarts = true,
  disposed = false,
} = {}) {
  let callEndedHandler;
  let dropStatusHandler;
  const cxClient = {
    encodeUii: jest.fn((session) => `${session.uii}$${session.sessionId}`),
  };
  const cxPresence = {
    callsMapping: call ? { [CX_CALL_ID]: call } : {},
    onCallEnded: jest.fn(function onCallEnded(handler) {
      callEndedHandler = handler;
      return this;
    }),
  };
  const cxActiveCallControl = { hangUp: jest.fn(async () => undefined) };
  const cxCallDisposition = { isDisposed: jest.fn(() => disposed) };
  const toast = { danger: jest.fn() };
  const webphone = {
    cxOffhookSessionId: offhookSessionId,
    dropVoicemailMessage: jest.fn(async () => dropStarts),
    cancelVoicemailDrop: jest.fn(async () => true),
    restoreCxVoiceChannel: jest.fn(async () => undefined),
    onVoicemailDropStatusChanged: jest.fn((handler) => {
      dropStatusHandler = handler;
    }),
  };
  const host = {
    hasVoicemailDropPermission: hasPermission,
    setVoicemailDropHandler: jest.fn(),
    openVoicemailDropForCxCall: jest.fn(async () => undefined),
    closeVoicemailDropForCxCall: jest.fn(async () => undefined),
  };
  const bridge = { onVoicemailDropped: jest.fn() };
  const routedSideWidgetView = { showPage: jest.fn(async () => undefined) };
  const voicemailDrop = new CxVoicemailDrop(
    cxClient,
    cxPresence,
    cxActiveCallControl,
    cxCallDisposition,
    toast,
    webphone,
    host,
    bridge,
    routedSideWidgetView,
  );
  return {
    voicemailDrop,
    call,
    cxPresence,
    cxActiveCallControl,
    webphone,
    host,
    bridge,
    routedSideWidgetView,
    endCall: async (endedCall = call) => {
      callEndedHandler(endedCall);
      await flush();
    },
    reportStatus: async (status, details, sessionId = OFFHOOK_SESSION_ID) => {
      dropStatusHandler(sessionId, status, details);
      await flush();
    },
  };
}

let now;

beforeEach(() => {
  now = 1000;
  jest.spyOn(Date, 'now').mockImplementation(() => now);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('CxVoicemailDrop.canDropVoicemail', () => {
  test('allows a live outbound call on the offhook session', () => {
    const { voicemailDrop } = createVoicemailDrop();

    expect(voicemailDrop.canDropVoicemail(CX_CALL_ID)).toBe(true);
  });

  test.each([
    ['the user has no voicemail drop permission', { hasPermission: false }],
    ['there is no offhook session', { offhookSessionId: null }],
    ['the call is unknown', { call: null }],
    ['the call has ended', { call: createCall({ endedCall: true }) }],
    ['the call is inbound', { call: createCall({ callType: 'INBOUND' }) }],
  ])('refuses when %s', (_name, options) => {
    const { voicemailDrop } = createVoicemailDrop(options);

    expect(voicemailDrop.canDropVoicemail(CX_CALL_ID)).toBe(false);
  });

  test('refuses while a drop is running on the call', async () => {
    const { voicemailDrop } = createVoicemailDrop();

    await voicemailDrop.startDrop(CX_CALL_ID, MESSAGE_ID);

    expect(voicemailDrop.canDropVoicemail(CX_CALL_ID)).toBe(false);
  });
});

describe('CxVoicemailDrop.startDrop', () => {
  test('plays the message on the offhook session and keeps the session', async () => {
    const { voicemailDrop, webphone } = createVoicemailDrop();

    await expect(voicemailDrop.startDrop(CX_CALL_ID, MESSAGE_ID)).resolves.toBe(
      true,
    );

    expect(webphone.dropVoicemailMessage).toHaveBeenCalledWith(
      OFFHOOK_SESSION_ID,
      MESSAGE_ID,
      { keepSession: true },
    );
    expect(voicemailDrop.drops[CX_CALL_ID]).toEqual({
      status: voicemailDropStatus.waitingForGreetingEnd,
      startedAt: 1000,
    });
  });

  test('records nothing when the drop does not start', async () => {
    const { voicemailDrop, webphone, endCall } = createVoicemailDrop({
      dropStarts: false,
    });

    await expect(voicemailDrop.startDrop(CX_CALL_ID, MESSAGE_ID)).resolves.toBe(
      false,
    );

    expect(voicemailDrop.drops).toEqual({});
    await endCall();
    expect(webphone.restoreCxVoiceChannel).not.toHaveBeenCalled();
  });

  test('does not start when a drop is not allowed', async () => {
    const { voicemailDrop, webphone } = createVoicemailDrop({
      hasPermission: false,
    });

    await expect(voicemailDrop.startDrop(CX_CALL_ID, MESSAGE_ID)).resolves.toBe(
      false,
    );

    expect(webphone.dropVoicemailMessage).not.toHaveBeenCalled();
    expect(voicemailDrop.drops).toEqual({});
  });
});

describe('CxVoicemailDrop.dropVoicemail', () => {
  test('opens the disposition in the side panel once the drop starts', async () => {
    const { voicemailDrop, routedSideWidgetView } = createVoicemailDrop();

    await expect(
      voicemailDrop.dropVoicemail(CX_CALL_ID, MESSAGE_ID),
    ).resolves.toBe(true);

    expect(routedSideWidgetView.showPage).toHaveBeenCalledWith(
      cxPath.disposition(CX_CALL_ID),
    );
  });

  test.each([
    [
      'the call has no dispositions',
      { call: createCall({ outdialDispositions: { dispositions: [] } }) },
    ],
    [
      'the disposition is suppressed',
      { call: createCall({ surveyPopType: 'SUPPRESS' }) },
    ],
    ['the call is already disposed', { disposed: true }],
    ['the drop does not start', { dropStarts: false }],
  ])('leaves the side panel alone when %s', async (_name, options) => {
    const { voicemailDrop, routedSideWidgetView } =
      createVoicemailDrop(options);

    await voicemailDrop.dropVoicemail(CX_CALL_ID, MESSAGE_ID);

    expect(routedSideWidgetView.showPage).not.toHaveBeenCalled();
  });
});

describe('CxVoicemailDrop drop status', () => {
  test('keeps the start time and records the message timing once it plays', async () => {
    const { voicemailDrop, reportStatus } = createVoicemailDrop();
    await voicemailDrop.startDrop(CX_CALL_ID, MESSAGE_ID);
    now = 5000;

    await reportStatus(voicemailDropStatus.sending, { messageDuration: 12 });

    expect(voicemailDrop.drops[CX_CALL_ID]).toEqual({
      status: voicemailDropStatus.sending,
      startedAt: 1000,
      sendingStartedAt: 5000,
      messageDuration: 12,
    });
  });

  test('hangs up the CX call when the message has finished', async () => {
    const { voicemailDrop, cxActiveCallControl, reportStatus } =
      createVoicemailDrop();
    await voicemailDrop.startDrop(CX_CALL_ID, MESSAGE_ID);

    await reportStatus(voicemailDropStatus.finished);

    expect(voicemailDrop.drops[CX_CALL_ID]).toBeUndefined();
    expect(cxActiveCallControl.hangUp).toHaveBeenCalledWith('session-1');
  });

  test.each([
    voicemailDropStatus.sending,
    voicemailDropStatus.finished,
    voicemailDropStatus.cancelled,
    voicemailDropStatus.terminated,
  ])('forwards %s to the host', async (status) => {
    const { voicemailDrop, call, bridge, reportStatus } = createVoicemailDrop();
    await voicemailDrop.startDrop(CX_CALL_ID, MESSAGE_ID);

    await reportStatus(status);

    expect(bridge.onVoicemailDropped).toHaveBeenCalledWith(call, status);
  });

  test('ignores statuses of a session that carries no drop', async () => {
    const { voicemailDrop, bridge, cxActiveCallControl, reportStatus } =
      createVoicemailDrop();
    await voicemailDrop.startDrop(CX_CALL_ID, MESSAGE_ID);

    await reportStatus(voicemailDropStatus.finished, undefined, 'other');

    expect(bridge.onVoicemailDropped).not.toHaveBeenCalled();
    expect(cxActiveCallControl.hangUp).not.toHaveBeenCalled();
    expect(voicemailDrop.getDropStatus(CX_CALL_ID)).toBe(
      voicemailDropStatus.waitingForGreetingEnd,
    );
  });
});

describe('CxVoicemailDrop CX call end', () => {
  test('closes the picker for the ended call', async () => {
    const { host, endCall } = createVoicemailDrop();

    await endCall();

    expect(host.closeVoicemailDropForCxCall).toHaveBeenCalledWith(CX_CALL_ID);
  });

  test('cancels a running drop and tells the host', async () => {
    const { voicemailDrop, call, bridge, endCall } = createVoicemailDrop();
    await voicemailDrop.startDrop(CX_CALL_ID, MESSAGE_ID);

    await endCall();

    expect(bridge.onVoicemailDropped).toHaveBeenCalledWith(
      call,
      voicemailDropStatus.cancelled,
    );
    expect(voicemailDrop.drops[CX_CALL_ID]).toBeUndefined();
  });

  test('puts the voice channel back once after a drop', async () => {
    const { voicemailDrop, webphone, host, reportStatus, endCall } =
      createVoicemailDrop();
    await voicemailDrop.startDrop(CX_CALL_ID, MESSAGE_ID);
    await reportStatus(voicemailDropStatus.finished);

    await endCall();
    await endCall();

    expect(webphone.restoreCxVoiceChannel).toHaveBeenCalledTimes(1);
    expect(webphone.restoreCxVoiceChannel).toHaveBeenCalledWith(
      OFFHOOK_SESSION_ID,
    );
    expect(host.closeVoicemailDropForCxCall).toHaveBeenCalledTimes(2);
  });
});

describe('CxVoicemailDrop.getDropStatus and getDrop', () => {
  test('return null for a call without a drop', () => {
    const { voicemailDrop } = createVoicemailDrop();

    expect(voicemailDrop.getDropStatus(CX_CALL_ID)).toBeNull();
    expect(voicemailDrop.getDrop(CX_CALL_ID)).toBeNull();
  });

  test('return the running drop of a call', async () => {
    const { voicemailDrop } = createVoicemailDrop();
    await voicemailDrop.startDrop(CX_CALL_ID, MESSAGE_ID);

    expect(voicemailDrop.getDropStatus(CX_CALL_ID)).toBe(
      voicemailDropStatus.waitingForGreetingEnd,
    );
    expect(voicemailDrop.getDrop(CX_CALL_ID)).toEqual({
      status: voicemailDropStatus.waitingForGreetingEnd,
      startedAt: 1000,
    });
  });
});
