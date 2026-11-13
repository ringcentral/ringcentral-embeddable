jest.mock("@ringcentral-integration/micro-phone/src/app/views", () => ({
  DialerView: class DialerView {},
}));
jest.mock(
  "@ringcentral-integration/micro-phone/src/app/views/CallView/services",
  () => ({
    CallViewState: class CallViewState {},
  })
);
jest.mock("../../src/app/views/SideWidgetView", () => ({
  SideWidgetView: class SideWidgetView {},
}));
jest.mock("../../src/app/views/CustomizedPageView", () => ({
  CustomizedPageView: class CustomizedPageView {},
}));
jest.mock("../../src/app/views/LogCallView/LogCall.view", () => ({
  LogCallView: class LogCallView {},
}));
jest.mock("../../src/app/services/SmartNotes", () => ({
  SmartNotes: class SmartNotes {},
}));
jest.mock("../../src/app/services/WebphoneV2/i18n", () => ({
  t: (key) => key,
}));

const { Adapter } = require("../../src/app/services/Adapter");

const WEBPHONE_MODE = "callingModes-webphone";

const PICKUP_MESSAGE = {
  type: "rc-adapter-pickup-inbound-call",
  sessionId: "616538395049",
  serverId: "10.120.133.58.TAM",
  fromNumber: "+16579991394",
  toNumber: "+16508446685",
  telephonySessionId: "s-telephony",
};

describe("Adapter pickup inbound call", () => {
  function flushAsyncWork() {
    return new Promise((resolve) => setImmediate(resolve));
  }

  function createAdapter({
    loggedIn = true,
    callingMode = WEBPHONE_MODE,
    connected = true,
    pickupResult = { id: "webphone-call-id" },
    sessions = [],
  } = {}) {
    const adapter = new Adapter(
      {},
      { enable: jest.fn() },
      { shared: true, onClient: jest.fn(), onServer: jest.fn() },
      ...Array.from({ length: 20 }, () => ({}))
    );
    return Object.assign(adapter, {
      _auth: { loggedIn },
      _callingSettings: { callingMode },
      _webphone: {
        connected,
        pickupInboundCall: jest.fn(async () => pickupResult),
      },
      _activeCallControl: { sessions },
      _preinsertCall: { removePreinsert: jest.fn(async () => {}) },
      _postMessage: jest.fn(),
    });
  }

  function sendPickup(adapter, overrides = {}) {
    adapter._onWindowMessage({ data: { ...PICKUP_MESSAGE, ...overrides } });
    return flushAsyncWork();
  }

  function expectPickupError(adapter, message) {
    expect(adapter._postMessage).toHaveBeenCalledWith({
      type: "rc-control-call-error",
      error: "PickupInboundCallError",
      message,
    });
  }

  test("picks up the call and clears its preinsert mark", async () => {
    const adapter = createAdapter();

    await sendPickup(adapter);

    expect(adapter._webphone.pickupInboundCall).toHaveBeenCalledWith({
      sessionId: "616538395049",
      serverId: "10.120.133.58.TAM",
      fromNumber: "+16579991394",
      toNumber: "+16508446685",
      telephonySessionId: "s-telephony",
    });
    expect(adapter._preinsertCall.removePreinsert).toHaveBeenCalledWith(
      "s-telephony"
    );
    expect(adapter._postMessage).not.toHaveBeenCalled();
  });

  test("resolves the telephony session id from the session id when omitted", async () => {
    const adapter = createAdapter({
      sessions: [
        { sessionId: "other-session", telephonySessionId: "s-other" },
        { sessionId: "616538395049", telephonySessionId: "s-resolved" },
      ],
    });

    await sendPickup(adapter, { telephonySessionId: undefined });

    expect(adapter._webphone.pickupInboundCall).toHaveBeenCalledWith(
      expect.objectContaining({ telephonySessionId: "s-resolved" })
    );
    expect(adapter._preinsertCall.removePreinsert).toHaveBeenCalledWith(
      "s-resolved"
    );
  });

  test("picks up without clearing a mark when the telephony session is unknown", async () => {
    const adapter = createAdapter();

    await sendPickup(adapter, { telephonySessionId: undefined });

    expect(adapter._webphone.pickupInboundCall).toHaveBeenCalledWith(
      expect.objectContaining({ telephonySessionId: "" })
    );
    expect(adapter._preinsertCall.removePreinsert).not.toHaveBeenCalled();
    expect(adapter._postMessage).not.toHaveBeenCalled();
  });

  test.each(["sessionId", "serverId", "fromNumber", "toNumber"])(
    "reports an error when %s is missing",
    async (field) => {
      const adapter = createAdapter();

      await sendPickup(adapter, { [field]: undefined });

      expectPickupError(
        adapter,
        "sessionId, serverId, fromNumber and toNumber are required"
      );
      expect(adapter._webphone.pickupInboundCall).not.toHaveBeenCalled();
    }
  );

  test.each([
    [{ loggedIn: false }, "User is not logged in"],
    [
      { callingMode: "callingModes-ringout" },
      "Pickup inbound call is only supported in webphone mode",
    ],
    [{ connected: false }, "Web phone is not connected"],
  ])(
    "reports an error without picking up when %o",
    async (options, message) => {
      const adapter = createAdapter(options);

      await sendPickup(adapter);

      expectPickupError(adapter, message);
      expect(adapter._webphone.pickupInboundCall).not.toHaveBeenCalled();
      expect(adapter._preinsertCall.removePreinsert).not.toHaveBeenCalled();
    }
  );

  test("reports an error and keeps the mark when the pickup returns nothing", async () => {
    const adapter = createAdapter({ pickupResult: null });

    await sendPickup(adapter);

    expectPickupError(adapter, "Failed to pick up the call");
    expect(adapter._preinsertCall.removePreinsert).not.toHaveBeenCalled();
  });

  test("reports the thrown error message when the pickup fails", async () => {
    const adapter = createAdapter();
    adapter._webphone.pickupInboundCall.mockRejectedValue(
      new Error("Webphone is not connected")
    );

    await sendPickup(adapter);

    expectPickupError(adapter, "Webphone is not connected");
    expect(adapter._preinsertCall.removePreinsert).not.toHaveBeenCalled();
  });
});
