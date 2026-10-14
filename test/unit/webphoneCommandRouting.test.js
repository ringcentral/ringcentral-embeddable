const { invokeRole } = require('@ringcentral-integration/next-core');
const {
  voicemailDropStatus,
} = require('../../src/app/services/WebphoneV2/voicemailDropStatus');
const {
  sessionStatus,
} = require('../../src/app/services/WebphoneV2/sessionStatus');

const { Webphone } = require('../../src/app/services/WebphoneV2/Webphone');

beforeEach(() => {
  invokeRole.mockReset();
});

function create({ shared = true, isServer = false } = {}) {
  const clientInteraction = { ensureCurrentClient: jest.fn(async () => {}) };
  const toast = { success: jest.fn(), danger: jest.fn(), warning: jest.fn() };
  const webphone = new Webphone(
    { addBeforeLogoutHandler: jest.fn() },
    {},
    { enable: jest.fn() },
    { factory: jest.fn(), isLocalMediaOwner: false },
    { inputDeviceId: '' },
    {
      shared,
      isServer,
      isClient: !isServer,
      isWorkerMode: true,
      onClient: jest.fn(),
      onServer: jest.fn(),
    },
    toast,
    clientInteraction,
    undefined,
    undefined,
  );
  webphone.logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  return { webphone, clientInteraction, toast };
}

it('routes a command through the server endpoint instead of running locally', async () => {
  const { webphone } = create();
  const spy = jest
    .spyOn(webphone, '_executeRuntimeCommand')
    .mockResolvedValue('ok');

  await expect(webphone.mute('session-1')).resolves.toBe('ok');

  // Without this the command would run in the tab, where the runtime holds no
  // session records, and throw "Webphone session <id> is unavailable".
  expect(spy).toHaveBeenCalledWith('mute', ['session-1']);
});

it.each([
  ['hangup', 1],
  ['hold', 1],
  ['unhold', 1],
  ['stopRecord', 1],
  ['mute', 1],
])('strips the %s error handler before delegating', async (command, index) => {
  const { webphone } = create();
  const spy = jest
    .spyOn(webphone, '_executeRuntimeCommand')
    .mockResolvedValue(undefined);
  const handler = jest.fn();
  const args = ['session-1'];
  args[index] = handler;

  await webphone[command](...args);

  // Functions cannot cross the port.
  expect(spy).toHaveBeenCalledWith(command, ['session-1']);
  expect(handler).not.toHaveBeenCalled();
});

it('strips the replyWithMessage error handler after the reply options', async () => {
  // micro-phone's ActiveCallControl passes a callback as the third argument;
  // forwarding it throws DataCloneError on the SharedWorker port.
  const { webphone } = create();
  const spy = jest
    .spyOn(webphone, '_executeRuntimeCommand')
    .mockResolvedValue(true);
  const replyOptions = { replyType: 0, replyText: 'On my way' };
  const handler = jest.fn();

  await expect(
    webphone.replyWithMessage('session-1', replyOptions, handler),
  ).resolves.toBe(true);

  expect(spy).toHaveBeenCalledWith('replyWithMessage', [
    'session-1',
    replyOptions,
  ]);
  expect(handler).not.toHaveBeenCalled();
});

it('invokes the stripped error handler locally when the command fails', async () => {
  const { webphone } = create();
  const failure = new Error('session gone');
  jest.spyOn(webphone, '_executeRuntimeCommand').mockRejectedValue(failure);
  const handler = jest.fn();

  await expect(webphone.mute('session-1', handler)).resolves.toBeUndefined();
  expect(handler).toHaveBeenCalledWith(failure);
});

it('rethrows when the command has no error handler', async () => {
  const { webphone } = create();
  const failure = new Error('session gone');
  jest.spyOn(webphone, '_executeRuntimeCommand').mockRejectedValue(failure);

  await expect(webphone.transfer('session-1', '+16505550123')).rejects.toBe(
    failure,
  );
});

it('claims interaction ownership before a media-starting command', async () => {
  const { webphone, clientInteraction } = create();
  jest.spyOn(webphone, '_executeRuntimeCommand').mockResolvedValue(undefined);

  await webphone.answer('session-1');

  expect(clientInteraction.ensureCurrentClient).toHaveBeenCalledTimes(1);
});

it('does not claim interaction ownership for a plain command', async () => {
  const { webphone, clientInteraction } = create();
  jest.spyOn(webphone, '_executeRuntimeCommand').mockResolvedValue(undefined);

  await webphone.mute('session-1');

  expect(clientInteraction.ensureCurrentClient).not.toHaveBeenCalled();
});

it('survives a failed interaction claim and still runs the command', async () => {
  const { webphone, clientInteraction } = create();
  clientInteraction.ensureCurrentClient.mockRejectedValue(new Error('busy'));
  const spy = jest
    .spyOn(webphone, '_executeRuntimeCommand')
    .mockResolvedValue('ok');

  await expect(webphone.answer('session-1')).resolves.toBe('ok');
  expect(spy).toHaveBeenCalled();
});

it('rejects an unknown command at the server endpoint', async () => {
  const { webphone } = create({ isServer: true });
  await expect(
    webphone._executeRuntimeCommand('notACommand', []),
  ).rejects.toThrow("Webphone command 'notACommand' is not supported.");
});

it('runs the real implementation at the server endpoint', async () => {
  const { webphone } = create({ isServer: true });
  // `mute` reaches the runtime, which rejects because no session exists — proof
  // the endpoint dispatches to the runtime rather than recursing.
  await expect(
    webphone._executeRuntimeCommand('mute', ['missing-session']),
  ).rejects.toThrow(/unavailable/i);
});

describe("call event mirroring", () => {
  const event = {
    type: "callStart",
    session: { id: "wp-1" },
    activeSession: { id: "wp-1" },
    ringSession: null,
  };

  it("re-emits a mirrored event on a client so tab consumers fire", async () => {
    const { webphone } = create({ shared: true, isServer: false });
    const handler = jest.fn();
    webphone.onCallStart(handler);

    await webphone.mirrorCallEvent(event);

    // Without this, Adapter's postMessage relay and SmartNotes' hooks — both
    // running in a tab — never fire, because the runtime emits in the worker.
    expect(handler).toHaveBeenCalledWith(event.session, event.activeSession);
  });

  it("does not re-emit on the server, which already emitted locally", async () => {
    const { webphone } = create({ shared: true, isServer: true });
    const handler = jest.fn();
    webphone.onCallStart(handler);

    await webphone.mirrorCallEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it("passes the ring session for a callRing event", async () => {
    const { webphone } = create({ shared: true, isServer: false });
    const handler = jest.fn();
    webphone.onCallRing(handler);

    await webphone.mirrorCallEvent({
      type: "callRing",
      session: { id: "wp-1" },
      activeSession: null,
      ringSession: { id: "wp-1" },
    });

    expect(handler).toHaveBeenCalledWith({ id: "wp-1" }, { id: "wp-1" });
  });

  it("feeds the mirrored stream so derived observables emit in a tab", async () => {
    const { webphone } = create({ shared: true, isServer: false });
    const ended = [];
    webphone.end$.subscribe((session) => ended.push(session.id));

    await webphone.mirrorCallEvent({ ...event, type: "callEnd" });

    expect(ended).toEqual(["wp-1"]);
  });
});

describe("voicemail drop", () => {
  it("routes the command to the authoritative port", async () => {
    const { webphone } = create({ shared: true, isServer: false });
    const spy = jest
      .spyOn(webphone, "_executeRuntimeCommand")
      .mockResolvedValue(true);

    await expect(webphone.dropVoicemailMessage("wp-1", "msg-1")).resolves.toBe(
      true,
    );

    // In a tab the runtime holds no session records, so validating locally
    // would always return false.
    expect(spy).toHaveBeenCalledWith("dropVoicemailMessage", [
      "wp-1",
      "msg-1",
    ]);
  });

  it("refuses when the session is unknown", async () => {
    const { webphone } = create({ shared: true, isServer: true });
    await expect(
      webphone._executeRuntimeCommand("dropVoicemailMessage", [
        "missing",
        "msg-1",
      ]),
    ).resolves.toBe(false);
  });

  it("refuses a drop that is already in progress", async () => {
    const { webphone } = create({ shared: true, isServer: true });
    webphone._sessionRecords.set("wp-1", {
      normalized: { id: "wp-1", voicemailDropStatus: "waitingForGreetingEnd" },
      finalized: false,
    });

    await expect(webphone.dropVoicemailMessage("wp-1", "msg-1")).resolves.toBe(
      false,
    );
  });

  it("refuses while the call is on hold", async () => {
    const { webphone } = create({ shared: true, isServer: true });
    webphone._sessionRecords.set("wp-1", {
      normalized: { id: "wp-1", isOnHold: true },
      finalized: false,
    });

    await expect(webphone.dropVoicemailMessage("wp-1", "msg-1")).resolves.toBe(
      false,
    );
  });

  it("returns the owner's boolean rather than undefined", async () => {
    // `@delegateRole` discards return values in this next-core build; without
    // invokeRoleForValue the drop succeeds but the view reports a failure.
    const { webphone } = create({ shared: true, isServer: true });
    webphone._sessionRecords.set("wp-1", {
      normalized: { id: "wp-1" },
      finalized: false,
    });
    invokeRole.mockResolvedValue([
      { clientId: "tab-1", status: "fulfilled", value: true },
    ]);

    await expect(webphone.dropVoicemailMessage("wp-1", "msg-1")).resolves.toBe(
      true,
    );
    expect(invokeRole).toHaveBeenCalledWith(
      webphone,
      "_dropVoicemailOnMediaOwner",
      ["wp-1", "msg-1"],
      { role: "webphone.mediaOwner", collectResults: true },
    );
  });

  it("reports failure when no tab owns the call media", async () => {
    const { webphone } = create({ shared: true, isServer: true });
    webphone._sessionRecords.set("wp-1", {
      normalized: { id: "wp-1" },
      finalized: false,
    });
    const unavailable = new Error("Role has no available owner.");
    unavailable.name = "RoleUnavailableError";
    invokeRole.mockRejectedValue(unavailable);

    await expect(webphone.dropVoicemailMessage("wp-1", "msg-1")).resolves.toBe(
      false,
    );
  });

  it("runs the pipeline on the media owner and reports status back", async () => {
    const { webphone } = create({ shared: true, isServer: true });
    const mediaSession = {
      rtcPeerConnection: {},
      stopSessionAudio: jest.fn(async () => {}),
      once: jest.fn(),
      off: jest.fn(),
    };
    webphone._webphoneMedia.getLocalSessionByCallId = jest.fn(
      () => mediaSession,
    );
    webphone._voicemailDrop = {
      prepareVoicemailDrop: jest.fn(async () => ({
        audioBuffer: {},
        audioContext: {},
      })),
      dropVoicemailMessage: jest.fn(async () => {}),
    };
    webphone._sessionRecords.set("wp-1", {
      normalized: { id: "wp-1" },
      finalized: false,
    });
    const setStatus = jest
      .spyOn(webphone, "setVoicemailDropStatus")
      .mockResolvedValue(undefined);

    await expect(
      webphone._dropVoicemailOnMediaOwner("wp-1", "msg-1"),
    ).resolves.toBe(true);

    // Live audio must stop before the greeting replaces the outbound track.
    expect(mediaSession.stopSessionAudio).toHaveBeenCalled();
    expect(webphone._voicemailDrop.dropVoicemailMessage).toHaveBeenCalledWith(
      expect.objectContaining({ webphoneSession: mediaSession }),
    );
    expect(setStatus).toHaveBeenCalledWith("wp-1", expect.any(String));
  });

  it("refuses on the owner when it holds no media for the call", async () => {
    const { webphone } = create({ shared: true, isServer: true });
    webphone._webphoneMedia.getLocalSessionByCallId = jest.fn(() => undefined);
    webphone._voicemailDrop = { prepareVoicemailDrop: jest.fn() };

    await expect(
      webphone._dropVoicemailOnMediaOwner("wp-1", "msg-1"),
    ).resolves.toBe(false);
  });
});

describe('auto-hold while a voicemail is dropping', () => {
  function recordFor(id, overrides = {}) {
    return {
      normalized: {
        id,
        callStatus: sessionStatus.connected,
        isOnHold: false,
        ...overrides,
      },
      finalized: false,
      session: { hold: jest.fn(async () => {}) },
    };
  }

  it('does not hold a call that is playing a recorded voicemail', async () => {
    // Holding it stops the recorded audio, so the callee gets silence.
    const { webphone } = create({ shared: true, isServer: true });
    const dropping = recordFor('wp-dropping', {
      voicemailDropStatus: voicemailDropStatus.sending,
    });
    webphone._sessionRecords.set('wp-dropping', dropping);

    await webphone._holdOtherSessions(null);

    expect(dropping.session.hold).not.toHaveBeenCalled();
  });

  it('still holds an ordinary call', async () => {
    const { webphone } = create({ shared: true, isServer: true });
    const normal = recordFor('wp-normal');
    webphone._sessionRecords.set('wp-normal', normal);

    await webphone._holdOtherSessions(null);

    expect(normal.session.hold).toHaveBeenCalledTimes(1);
  });

  it('refuses an explicit hold on a dropping call', async () => {
    // micro-phone's own CallView auto-holds the previously active call when a
    // new outbound call appears, bypassing _holdOtherSessions — so the guard
    // has to live in hold() itself or the callee hears hold music.
    const { webphone } = create({ shared: true, isServer: true });
    const dropping = recordFor('wp-dropping', {
      voicemailDropStatus: voicemailDropStatus.sending,
    });
    webphone._sessionRecords.set('wp-dropping', dropping);

    await webphone._executeRuntimeCommand('hold', ['wp-dropping']);

    expect(dropping.session.hold).not.toHaveBeenCalled();
    expect(dropping.normalized.isOnHold).toBe(false);
  });

  it('still allows an explicit hold on an ordinary call', async () => {
    const { webphone } = create({ shared: true, isServer: true });
    const normal = recordFor('wp-normal');
    webphone._sessionRecords.set('wp-normal', normal);

    await webphone._executeRuntimeCommand('hold', ['wp-normal']);

    expect(normal.session.hold).toHaveBeenCalledTimes(1);
  });

  it('holds other calls but skips the dropping one', async () => {
    const { webphone } = create({ shared: true, isServer: true });
    const dropping = recordFor('wp-dropping', {
      voicemailDropStatus: voicemailDropStatus.waitingForGreetingEnd,
    });
    const normal = recordFor('wp-normal');
    webphone._sessionRecords.set('wp-dropping', dropping);
    webphone._sessionRecords.set('wp-normal', normal);

    await webphone._holdOtherSessions(null);

    expect(dropping.session.hold).not.toHaveBeenCalled();
    expect(normal.session.hold).toHaveBeenCalledTimes(1);
  });
});
