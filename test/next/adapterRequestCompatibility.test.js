jest.mock("@ringcentral-integration/micro-phone/src/app/views", () => ({
  DialerView: class DialerView {},
}));
jest.mock(
  "@ringcentral-integration/micro-phone/src/app/views/CallView/services",
  () => ({
    CallViewState: class CallViewState {},
  })
);
jest.mock("../../next/app/views/SideWidgetView", () => ({
  SideWidgetView: class SideWidgetView {},
}));
jest.mock("../../next/app/services/SmartNotes", () => ({
  SmartNotes: class SmartNotes {},
}));

const { Adapter } = require("../../next/app/services/Adapter");

describe("Adapter request compatibility boundary", () => {
  let postMessage;

  beforeEach(() => {
    postMessage = jest
      .spyOn(window, "postMessage")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function createAdapter(overrides = {}) {
    const adapter = Object.create(Adapter.prototype);
    Object.assign(adapter, overrides);
    return adapter;
  }

  function expectResponse(responseId, response) {
    expect(postMessage).toHaveBeenCalledWith(
      {
        type: "rc-adapter-message-response",
        responseId,
        response,
      },
      "*"
    );
  }

  test("returns paginated enriched unlogged calls", async () => {
    const calls = [{ sessionId: "session-id", aiNote: "AI note" }];
    const getRecentUnloggedCalls = jest.fn(async () => ({
      calls,
      hasMore: true,
    }));
    const adapter = createAdapter({
      _callLogger: { getRecentUnloggedCalls },
    });

    await adapter._handleRCAdapterMessageRequest({
      requestId: "unlogged-request",
      path: "/unlogged-calls",
      body: { perPage: 20, page: 2 },
    });

    expect(getRecentUnloggedCalls).toHaveBeenCalledWith({
      perPage: 20,
      page: 2,
    });
    expectResponse("unlogged-request", { calls, hasMore: true });
  });

  test("returns one enriched call log by either identifier", async () => {
    const call = {
      sessionId: "session-id",
      telephonySessionId: "telephony-session-id",
      transcript: "From: hello",
    };
    const getCall = jest.fn(async () => call);
    const adapter = createAdapter({ _callLogger: { getCall } });

    await adapter._handleRCAdapterMessageRequest({
      requestId: "call-request",
      path: "/get-call-log",
      body: { telephonySessionId: "telephony-session-id" },
    });

    expect(getCall).toHaveBeenCalledWith(undefined, "telephony-session-id");
    expectResponse("call-request", { call });
  });

  test("preserves the required-identifier error response", async () => {
    const getCall = jest.fn();
    const adapter = createAdapter({ _callLogger: { getCall } });

    await adapter._handleRCAdapterMessageRequest({
      requestId: "missing-id-request",
      path: "/get-call-log",
      body: {},
    });

    expect(getCall).not.toHaveBeenCalled();
    expectResponse("missing-id-request", {
      error: "sessionId or telephonySessionId is required",
    });
  });

  test("accepts the legacy top-level custom alert payload", async () => {
    const info = jest.fn(() => ({ id: "alert-id" }));
    const danger = jest.fn(() => ({ id: "alert-id" }));
    const adapter = createAdapter({
      _customAlertGroup: "custom-alerts",
      _toast: {
        info,
        danger,
        warning: jest.fn(() => ({ id: "alert-id" })),
        success: jest.fn(() => ({ id: "alert-id" })),
        hint: jest.fn(() => ({ id: "alert-id" })),
      },
    });

    await adapter._handleRCAdapterMessageRequest({
      requestId: "alert-request",
      path: "/custom-alert-message",
      alertLevel: "danger",
      alertMessage: "Legacy alert",
      ttl: 5000,
    });

    expect(info).not.toHaveBeenCalled();
    expect(danger).toHaveBeenCalledWith({
      message: "Legacy alert",
      ttl: 5000,
      group: "custom-alerts",
    });
    expectResponse("alert-request", "alert-id");
  });

  test("preserves the unknown-request response envelope", async () => {
    const adapter = createAdapter();

    await adapter._handleRCAdapterMessageRequest({
      requestId: "unknown-request",
      path: "/unknown",
    });

    expectResponse("unknown-request", { data: "no matched path" });
  });
});
