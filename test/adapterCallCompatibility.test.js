jest.mock("@ringcentral-integration/micro-phone/src/app/views", () => ({
  DialerView: class DialerView {},
}));
jest.mock(
  "@ringcentral-integration/micro-phone/src/app/views/CallView/services",
  () => ({
    CallViewState: class CallViewState {},
  })
);
jest.mock("../src/app/views/SideWidgetView", () => ({
  SideWidgetView: class SideWidgetView {},
}));
jest.mock("../src/app/services/SmartNotes", () => ({
  SmartNotes: class SmartNotes {},
}));
jest.mock("../src/app/services/WebphoneV2/i18n", () => ({
  t: (key, payload = {}) =>
    key === "recordError"
      ? `You cannot record the call at the moment. Error code: ${payload.errorCode}`
      : key,
}));

const normalizeNumber =
  require("@ringcentral-integration/commons/lib/normalizeNumber").default;
const { Adapter } = require("../src/app/services/Adapter");
const {
  recordStatus,
} = require("../src/app/services/WebphoneV2/recordStatus");

describe("Adapter call compatibility", () => {
  function flushAsyncWork() {
    return new Promise((resolve) => setImmediate(resolve));
  }

  function createAdapterInstance() {
    return new Adapter(
      {},
      { enable: jest.fn() },
      { shared: true, onClient: jest.fn(), onServer: jest.fn() },
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {}
    );
  }

  function createWebphone() {
    return {
      activeSessionId: "active-session",
      ringSessionId: "ring-session",
      sessions: [],
      answer: jest.fn(async () => {}),
      reject: jest.fn(async () => {}),
      hangup: jest.fn(async () => {}),
      hold: jest.fn(async () => {}),
      unhold: jest.fn(async () => {}),
      transfer: jest.fn(async () => {}),
      toVoiceMail: jest.fn(async () => {}),
      forward: jest.fn(async () => {}),
      startRecord: jest.fn(async () => {}),
      stopRecord: jest.fn(async () => {}),
      mute: jest.fn(async () => {}),
      unmute: jest.fn(async () => {}),
      toggleMinimized: jest.fn(async () => {}),
      sendDTMF: jest.fn(async () => {}),
    };
  }

  test.each([
    ["answer", "answer", ["ring-session"], {}],
    ["reject", "reject", ["ring-session"], {}],
    ["hangup", "hangup", ["active-session"], {}],
    ["hold", "hold", ["active-session"], {}],
    ["unhold", "unhold", ["active-session"], {}],
    [
      "transfer",
      "transfer",
      ["+16505550110", "active-session"],
      { transferNumber: "+16505550110" },
    ],
    ["toVoicemail", "toVoiceMail", ["ring-session"], {}],
    ["mute", "mute", ["active-session"], {}],
    ["unmute", "unmute", ["active-session"], {}],
    ["toggleRingingDialog", "toggleMinimized", ["ring-session"], {}],
    ["dtmf", "sendDTMF", ["123#", "active-session"], { dtmf: "123#" }],
  ])(
    "maps %s to Webphone.%s with legacy defaults",
    async (action, method, expectedArguments, options) => {
      const webphone = createWebphone();
      const adapter = {
        _webphone: webphone,
        _postMessage: jest.fn(),
      };

      await Adapter.prototype._controlCall.call(
        adapter,
        action,
        undefined,
        options
      );

      expect(webphone[method]).toHaveBeenCalledWith(...expectedArguments);
      expect(adapter._postMessage).not.toHaveBeenCalled();
    }
  );

  test("uses an explicit call ID for control actions", async () => {
    const webphone = createWebphone();
    const adapter = {
      _webphone: webphone,
      _postMessage: jest.fn(),
    };

    await Adapter.prototype._controlCall.call(
      adapter,
      "hold",
      "explicit-session",
      {}
    );

    expect(webphone.hold).toHaveBeenCalledWith("explicit-session");
  });

  test("dispatches raw call-control messages to the compatibility handler", () => {
    const adapter = createAdapterInstance();
    adapter._controlCall = jest.fn(async () => {});

    adapter._onWindowMessage({
      data: {
        type: "rc-adapter-control-call",
        callAction: "hold",
        callId: "call-id",
        options: { source: "host" },
      },
    });

    expect(adapter._controlCall).toHaveBeenCalledWith("hold", "call-id", {
      source: "host",
    });
  });

  test("executes call control through the raw host-message boundary", async () => {
    const adapter = createAdapterInstance();
    const webphone = createWebphone();
    adapter._webphone = webphone;
    adapter._controlCall = Adapter.prototype._controlCall;

    adapter._onWindowMessage({
      data: {
        type: "rc-adapter-control-call",
        callAction: "hold",
        callId: "host-session",
        options: {},
      },
    });
    await Promise.resolve();

    expect(webphone.hold).toHaveBeenCalledWith("host-session");
  });

  test("forwards telephony calls through the raw host-message boundary", async () => {
    const adapter = createAdapterInstance();
    const webphone = createWebphone();
    webphone.sessions = [
      {
        id: "ring-session",
        partyData: { sessionId: "telephony-session", partyId: "party-id" },
      },
    ];
    const activeCallControl = { forward: jest.fn(async () => {}) };
    adapter._webphone = webphone;
    adapter._activeCallControl = activeCallControl;
    adapter._controlCall = Adapter.prototype._controlCall;
    adapter._forward = Adapter.prototype._forward;

    adapter._onWindowMessage({
      data: {
        type: "rc-adapter-control-call",
        callAction: "forward",
        callId: "ring-session",
        options: { forwardNumber: "+16505550111" },
      },
    });
    await flushAsyncWork();

    expect(activeCallControl.forward).toHaveBeenCalledWith(
      "+16505550111",
      "telephony-session"
    );
    expect(webphone.forward).not.toHaveBeenCalled();
  });

  test("emits RecordError through the raw host-message boundary", async () => {
    const adapter = createAdapterInstance();
    const webphone = createWebphone();
    webphone.sessions = [
      {
        id: "active-session",
        recordStatus: recordStatus.recording,
        partyData: null,
      },
    ];
    const postMessage = jest.fn();
    adapter._webphone = webphone;
    adapter._activeCallControl = {
      hasTelephonySession: jest.fn(() => false),
    };
    adapter._postMessage = postMessage;
    adapter._controlCall = Adapter.prototype._controlCall;
    adapter._startRecord = Adapter.prototype._startRecord;

    adapter._onWindowMessage({
      data: {
        type: "rc-adapter-control-call",
        callAction: "startRecord",
        callId: "active-session",
        options: {},
      },
    });
    await flushAsyncWork();

    expect(postMessage).toHaveBeenCalledWith({
      type: "rc-control-call-error",
      error: "RecordError",
      message: "Can't record at current status",
      callId: "active-session",
    });
  });

  test("forwards Webphone-only calls through Webphone", async () => {
    const webphone = createWebphone();
    webphone.sessions = [{ id: "ring-session", partyData: null }];
    const activeCallControl = { forward: jest.fn(async () => {}) };
    const adapter = {
      _webphone: webphone,
      _activeCallControlV2: activeCallControl,
      _forward: Adapter.prototype._forward,
    };

    await Adapter.prototype._controlCall.call(adapter, "forward", undefined, {
      forwardNumber: "+16505550111",
    });

    expect(webphone.forward).toHaveBeenCalledWith(
      "ring-session",
      "+16505550111"
    );
    expect(activeCallControl.forward).not.toHaveBeenCalled();
  });

  test("forwards calls with party data through telephony control", async () => {
    const webphone = createWebphone();
    webphone.sessions = [
      {
        id: "ring-session",
        partyData: { sessionId: "telephony-session", partyId: "party-id" },
      },
    ];
    const activeCallControl = { forward: jest.fn(async () => {}) };
    const adapter = {
      _webphone: webphone,
      _activeCallControlV2: activeCallControl,
      _forward: Adapter.prototype._forward,
    };

    await Adapter.prototype._controlCall.call(adapter, "forward", undefined, {
      forwardNumber: "+16505550111",
    });

    expect(activeCallControl.forward).toHaveBeenCalledWith(
      "+16505550111",
      "telephony-session"
    );
    expect(webphone.forward).not.toHaveBeenCalled();
  });

  test.each([
    ["startRecord", recordStatus.recording, "Can't record at current status"],
    ["stopRecord", recordStatus.idle, "Can't stop record at current status"],
  ])(
    "emits the legacy RecordError when %s is invalid",
    async (action, currentRecordStatus, message) => {
      const webphone = createWebphone();
      webphone.sessions = [
        {
          id: "active-session",
          recordStatus: currentRecordStatus,
          partyData: null,
        },
      ];
      const postMessage = jest.fn();
      const adapter = {
        _webphone: webphone,
        _activeCallControlV2: { hasTelephonySession: jest.fn(() => false) },
        _postMessage: postMessage,
        _startRecord: Adapter.prototype._startRecord,
        _stopRecord: Adapter.prototype._stopRecord,
      };

      await Adapter.prototype._controlCall.call(adapter, action);

      expect(postMessage).toHaveBeenCalledWith({
        type: "rc-control-call-error",
        error: "RecordError",
        message,
        callId: "active-session",
      });
    }
  );

  test("records Webphone-only calls through Webphone", async () => {
    const webphone = createWebphone();
    webphone.sessions = [
      {
        id: "active-session",
        recordStatus: recordStatus.idle,
        partyData: null,
      },
    ];
    const adapter = {
      _webphone: webphone,
      _activeCallControlV2: { hasTelephonySession: jest.fn(() => false) },
      _startRecord: Adapter.prototype._startRecord,
    };

    await Adapter.prototype._controlCall.call(adapter, "startRecord");

    expect(webphone.startRecord).toHaveBeenCalledWith("active-session");
  });

  test.each(["startRecord", "stopRecord"])(
    "silently ignores %s when the Webphone session is missing",
    async (action) => {
      const webphone = createWebphone();
      const activeCallControl = {
        getActiveSession: jest.fn(),
        hasTelephonySession: jest.fn(),
        startRecord: jest.fn(),
        stopRecord: jest.fn(),
      };
      const adapter = {
        _webphone: webphone,
        _activeCallControl: activeCallControl,
        _activeCallControlV2: activeCallControl,
        _postMessage: jest.fn(),
        _startRecord: Adapter.prototype._startRecord,
        _stopRecord: Adapter.prototype._stopRecord,
      };

      await Adapter.prototype._controlCall.call(
        adapter,
        action,
        "missing-session"
      );

      expect(activeCallControl.getActiveSession).not.toHaveBeenCalled();
      expect(activeCallControl.startRecord).not.toHaveBeenCalled();
      expect(activeCallControl.stopRecord).not.toHaveBeenCalled();
      expect(adapter._postMessage).not.toHaveBeenCalled();
    }
  );

  test.each([
    ["startRecord", recordStatus.idle],
    ["stopRecord", recordStatus.recording],
  ])(
    "routes conference %s through Webphone",
    async (action, currentRecordStatus) => {
      const webphone = createWebphone();
      webphone.sessions = [
        {
          id: "active-session",
          recordStatus: currentRecordStatus,
          partyData: { sessionId: "conference-session", partyId: "party-id" },
        },
      ];
      const activeCallControl = {
        getActiveSession: jest.fn(() => ({
          recordStatus: currentRecordStatus,
          to: "conference",
        })),
        hasTelephonySession: jest.fn(() => true),
        startRecord: jest.fn(),
        stopRecord: jest.fn(),
      };
      const adapter = {
        _webphone: webphone,
        _activeCallControl: activeCallControl,
        _activeCallControlV2: activeCallControl,
        _startRecord: Adapter.prototype._startRecord,
        _stopRecord: Adapter.prototype._stopRecord,
      };

      await Adapter.prototype._controlCall.call(adapter, action);

      expect(webphone[action]).toHaveBeenCalledWith("active-session");
      expect(activeCallControl[action]).not.toHaveBeenCalled();
    }
  );

  test("records regular telephony calls with legacy status transitions", async () => {
    const webphone = createWebphone();
    webphone.sessions = [
      {
        id: "active-session",
        recordStatus: recordStatus.idle,
        partyData: { sessionId: "telephony-session", partyId: "party-id" },
      },
    ];
    webphone.updateRecordStatus = jest.fn(async () => {});
    const activeCallControl = {
      getActiveSession: jest.fn(() => ({
        recordStatus: recordStatus.idle,
        to: "+16505550100",
      })),
      hasTelephonySession: jest.fn(() => true),
      startRecord: jest.fn(async () => true),
    };
    const adapter = {
      _webphone: webphone,
      _webphoneV2: webphone,
      _activeCallControl: activeCallControl,
      _activeCallControlV2: activeCallControl,
      _toast: { danger: jest.fn() },
      _startRecord: Adapter.prototype._startRecord,
    };

    await Adapter.prototype._controlCall.call(adapter, "startRecord");

    expect(webphone.updateRecordStatus.mock.calls).toEqual([
      ["active-session", recordStatus.pending],
      ["active-session", recordStatus.recording],
    ]);
    expect(activeCallControl.startRecord).toHaveBeenCalledWith(
      "telephony-session"
    );
  });

  test("restores idle status when telephony recording fails", async () => {
    const error = new Error("recording failed");
    const webphone = createWebphone();
    webphone.sessions = [
      {
        id: "active-session",
        recordStatus: recordStatus.idle,
        partyData: { sessionId: "telephony-session", partyId: "party-id" },
      },
    ];
    webphone.updateRecordStatus = jest.fn(async () => {});
    const activeCallControl = {
      getActiveSession: jest.fn(() => ({
        recordStatus: recordStatus.idle,
        to: "+16505550100",
      })),
      hasTelephonySession: jest.fn(() => true),
      startRecord: jest.fn(async () => {
        throw error;
      }),
    };
    const danger = jest.fn();
    const adapter = {
      _webphone: webphone,
      _webphoneV2: webphone,
      _activeCallControl: activeCallControl,
      _activeCallControlV2: activeCallControl,
      _toast: { danger },
      _postMessage: jest.fn(),
      _startRecord: Adapter.prototype._startRecord,
    };

    await Adapter.prototype._controlCall.call(adapter, "startRecord");

    expect(webphone.updateRecordStatus.mock.calls).toEqual([
      ["active-session", recordStatus.pending],
      ["active-session", recordStatus.idle],
    ]);
    expect(danger).toHaveBeenCalledWith({
      message:
        "You cannot record the call at the moment. Error code: recording failed",
    });
    expect(adapter._postMessage).not.toHaveBeenCalled();
  });

  test("rolls back when telephony control handles start-record failure", async () => {
    const webphone = createWebphone();
    webphone.sessions = [
      {
        id: "active-session",
        recordStatus: recordStatus.idle,
        partyData: { sessionId: "telephony-session", partyId: "party-id" },
      },
    ];
    webphone.updateRecordStatus = jest.fn(async () => {});
    const activeCallControl = {
      getActiveSession: jest.fn(() => ({
        recordStatus: recordStatus.idle,
        to: "+16505550100",
      })),
      hasTelephonySession: jest.fn(() => true),
      startRecord: jest.fn(async () => undefined),
    };
    const danger = jest.fn();
    const adapter = {
      _webphone: webphone,
      _webphoneV2: webphone,
      _activeCallControl: activeCallControl,
      _activeCallControlV2: activeCallControl,
      _toast: { danger },
      _startRecord: Adapter.prototype._startRecord,
    };

    await Adapter.prototype._controlCall.call(adapter, "startRecord");

    expect(webphone.updateRecordStatus.mock.calls).toEqual([
      ["active-session", recordStatus.pending],
      ["active-session", recordStatus.idle],
    ]);
    expect(danger).not.toHaveBeenCalled();
  });

  test("stops regular telephony recording with legacy status transitions", async () => {
    const webphone = createWebphone();
    webphone.sessions = [
      {
        id: "active-session",
        recordStatus: recordStatus.recording,
        partyData: { sessionId: "telephony-session", partyId: "party-id" },
      },
    ];
    webphone.updateRecordStatus = jest.fn(async () => {});
    const activeCallControl = {
      getActiveSession: jest.fn(() => ({
        recordStatus: recordStatus.recording,
        to: "+16505550100",
      })),
      hasTelephonySession: jest.fn(() => true),
      stopRecordForAdapter: jest.fn(async () => true),
    };
    const adapter = {
      _webphone: webphone,
      _webphoneV2: webphone,
      _activeCallControl: activeCallControl,
      _activeCallControlV2: activeCallControl,
      _toast: { danger: jest.fn() },
      _stopRecord: Adapter.prototype._stopRecord,
    };

    await Adapter.prototype._controlCall.call(adapter, "stopRecord");

    expect(webphone.updateRecordStatus.mock.calls).toEqual([
      ["active-session", recordStatus.pending],
      ["active-session", recordStatus.idle],
    ]);
    expect(activeCallControl.stopRecordForAdapter).toHaveBeenCalledWith(
      "telephony-session"
    );
  });

  test.each([
    [
      Object.assign(new Error("stop recording is disabled"), {
        response: { status: 403 },
      }),
      {
        message:
          'Sorry, stopping recording is not supported for this call. Please contact your account administrator to enable "Allow mute in auto recording".',
      },
    ],
    [
      new Error("stop recording failed"),
      {
        message:
          "You cannot record the call at the moment. Error code: stop recording failed",
      },
    ],
  ])(
    "restores recording status when telephony stop recording fails",
    async (error, expectedToast) => {
      const webphone = createWebphone();
      webphone.sessions = [
        {
          id: "active-session",
          recordStatus: recordStatus.recording,
          partyData: { sessionId: "telephony-session", partyId: "party-id" },
        },
      ];
      webphone.updateRecordStatus = jest.fn(async () => {});
      const activeCallControl = {
        getActiveSession: jest.fn(() => ({
          recordStatus: recordStatus.recording,
          to: "+16505550100",
        })),
        hasTelephonySession: jest.fn(() => true),
        stopRecordForAdapter: jest.fn(async () => {
          throw error;
        }),
      };
      const danger = jest.fn();
      const adapter = {
        _webphone: webphone,
        _webphoneV2: webphone,
        _activeCallControl: activeCallControl,
        _activeCallControlV2: activeCallControl,
        _toast: { danger },
        _postMessage: jest.fn(),
        _stopRecord: Adapter.prototype._stopRecord,
      };

      await Adapter.prototype._controlCall.call(adapter, "stopRecord");

      expect(webphone.updateRecordStatus.mock.calls).toEqual([
        ["active-session", recordStatus.pending],
        ["active-session", recordStatus.recording],
      ]);
      expect(danger).toHaveBeenCalledWith(expectedToast);
      expect(adapter._postMessage).not.toHaveBeenCalled();
    }
  );

  test("rolls back when telephony control handles stop-record failure", async () => {
    const webphone = createWebphone();
    webphone.sessions = [
      {
        id: "active-session",
        recordStatus: recordStatus.recording,
        partyData: { sessionId: "telephony-session", partyId: "party-id" },
      },
    ];
    webphone.updateRecordStatus = jest.fn(async () => {});
    const activeCallControl = {
      getActiveSession: jest.fn(() => ({
        recordStatus: recordStatus.recording,
        to: "+16505550100",
      })),
      hasTelephonySession: jest.fn(() => true),
      stopRecordForAdapter: jest.fn(async () => false),
    };
    const danger = jest.fn();
    const adapter = {
      _webphone: webphone,
      _webphoneV2: webphone,
      _activeCallControl: activeCallControl,
      _activeCallControlV2: activeCallControl,
      _toast: { danger },
      _stopRecord: Adapter.prototype._stopRecord,
    };

    await Adapter.prototype._controlCall.call(adapter, "stopRecord");

    expect(webphone.updateRecordStatus.mock.calls).toEqual([
      ["active-session", recordStatus.pending],
      ["active-session", recordStatus.recording],
    ]);
    expect(danger).not.toHaveBeenCalled();
  });

  test("forwards the raw-message callerId to new-call handling", () => {
    const adapter = createAdapterInstance();
    adapter._newCall = jest.fn(async () => {});

    adapter._onWindowMessage({
      data: {
        type: "rc-adapter-new-call",
        phoneNumber: "+16505550100",
        toCall: true,
        callerId: "+16505550199",
      },
    });

    expect(adapter._newCall).toHaveBeenCalledWith(
      "+16505550100",
      true,
      "+16505550199"
    );
  });

  test("places a new call through the raw host-message boundary", async () => {
    const adapter = createAdapterInstance();
    const updateFromNumber = jest.fn(async () => {});
    const push = jest.fn(async () => {});
    const setToNumberField = jest.fn();
    const call = jest.fn(async () => {});
    adapter._auth = { loggedIn: true };
    adapter._call = { isIdle: true };
    adapter._webphone = { sessions: [] };
    adapter._regionSettings = { countryCode: "US", areaCode: "650" };
    adapter._callingSettings = {
      fromNumber: "+16505550198",
      fromNumbers: [{ phoneNumber: "+16505550199" }],
      updateFromNumber,
    };
    adapter._router = { push };
    adapter._dialerView = { setToNumberField, call };
    adapter._newCall = Adapter.prototype._newCall;
    adapter._isCallOngoing = Adapter.prototype._isCallOngoing;

    adapter._onWindowMessage({
      data: {
        type: "rc-adapter-new-call",
        phoneNumber: "+16505550100",
        toCall: true,
        callerId: "+16505550199",
      },
    });
    await flushAsyncWork();

    expect(updateFromNumber).toHaveBeenCalledWith({
      phoneNumber: "+16505550199",
    });
    expect(push).toHaveBeenCalledWith("/dialer");
    expect(setToNumberField).toHaveBeenCalledWith("+16505550100");
    expect(call).toHaveBeenCalledWith({
      recipient: { phoneNumber: "+16505550100" },
    });
  });

  test("updates a valid caller ID before opening and calling from the dialer", async () => {
    const updateFromNumber = jest.fn(async () => {});
    const push = jest.fn(async () => {});
    const setToNumberField = jest.fn();
    const call = jest.fn(async () => {});
    const adapter = {
      _auth: { loggedIn: true },
      _call: { isIdle: true },
      _webphone: { sessions: [] },
      _regionSettings: { countryCode: "US", areaCode: "650" },
      _callingSettings: {
        fromNumber: "+16505550198",
        fromNumbers: [{ phoneNumber: "+16505550199" }],
        updateFromNumber,
      },
      _router: { push },
      _dialerView: { setToNumberField, call },
      _isCallOngoing: Adapter.prototype._isCallOngoing,
    };

    await Adapter.prototype._newCall.call(
      adapter,
      "+16505550100",
      true,
      "+16505550199"
    );

    expect(updateFromNumber).toHaveBeenCalledWith({
      phoneNumber: "+16505550199",
    });
    expect(push).toHaveBeenCalledWith("/dialer");
    expect(setToNumberField).toHaveBeenCalledWith("+16505550100");
    expect(call).toHaveBeenCalledWith({
      recipient: { phoneNumber: "+16505550100" },
    });
    expect(updateFromNumber.mock.invocationCallOrder[0]).toBeLessThan(
      push.mock.invocationCallOrder[0]
    );
  });

  test.each([
    ["anonymous", "anonymous"],
    ["+16505550000", undefined],
  ])(
    "handles caller ID %s according to the public new-call contract",
    async (callerId, expectedFromNumber) => {
      const updateFromNumber = jest.fn(async () => {});
      const adapter = {
        _auth: { loggedIn: true },
        _call: { isIdle: true },
        _webphone: { sessions: [] },
        _regionSettings: { countryCode: "US", areaCode: "650" },
        _callingSettings: {
          fromNumber: "+16505550198",
          fromNumbers: [{ phoneNumber: "+16505550199" }],
          updateFromNumber,
        },
        _router: { push: jest.fn(async () => {}) },
        _dialerView: { setToNumberField: jest.fn() },
        _isCallOngoing: Adapter.prototype._isCallOngoing,
      };

      await Adapter.prototype._newCall.call(
        adapter,
        "+16505550100",
        false,
        callerId
      );

      if (expectedFromNumber) {
        expect(updateFromNumber).toHaveBeenCalledWith({
          phoneNumber: expectedFromNumber,
        });
      } else {
        expect(updateFromNumber).not.toHaveBeenCalled();
      }
    }
  );

  test("does not open the dialer for a normalized duplicate call", async () => {
    const phoneNumber = "6505550100";
    const normalized = normalizeNumber({
      phoneNumber,
      countryCode: "US",
      areaCode: "650",
    });
    const push = jest.fn(async () => {});
    const adapter = {
      _auth: { loggedIn: true },
      _call: { isIdle: true },
      _webphone: { sessions: [{ to: normalized }] },
      _regionSettings: { countryCode: "US", areaCode: "650" },
      _callingSettings: { fromNumbers: [] },
      _router: { push },
      _dialerView: {},
      _isCallOngoing: Adapter.prototype._isCallOngoing,
    };

    await Adapter.prototype._newCall.call(adapter, phoneNumber, false);

    expect(push).not.toHaveBeenCalled();
  });
});
