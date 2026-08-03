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
const {
  resolveLegacyAdapterPath,
} = require("../../next/app/services/Adapter/resolveLegacyAdapterPath");

describe("Adapter navigation compatibility", () => {
  function createAdapterInstance() {
    return new Adapter(
      {},
      { enable: jest.fn() },
      { shared: true, onClient: jest.fn() },
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

  function createAdapter(overrides = {}) {
    return {
      _router: {
        currentPath: "/",
        goBack: jest.fn(),
        push: jest.fn(async () => {}),
      },
      _webphone: { sessions: [] },
      logger: { warn: jest.fn() },
      _navigateToCurrentCall: jest.fn(async () => {}),
      _navigateToRequestedCall: Adapter.prototype._navigateToRequestedCall,
      _navigateToViewCalls: jest.fn(async () => {}),
      ...overrides,
    };
  }

  test("classifies history before the call-detail route", () => {
    expect(resolveLegacyAdapterPath("/history")).toEqual({
      kind: "dialerTab",
      tab: "calls",
    });
    expect(resolveLegacyAdapterPath("/history/all")).toEqual({
      kind: "dialerTab",
      tab: "calls",
    });
    expect(resolveLegacyAdapterPath("/history/recordings")).toEqual({
      kind: "unsupported",
      path: "/history/recordings",
      reason: 'Legacy call-history type "recordings" is not migrated',
    });
    expect(resolveLegacyAdapterPath("/history/call-log-id").kind).toBe(
      "unsupported"
    );
  });

  test("opens legacy call history in the DialerPad calls tab", async () => {
    const adapter = createAdapter();

    await Adapter.prototype._navigateTo.call(adapter, "/history");

    expect(adapter._router.push).toHaveBeenCalledWith("/dialer", {
      dialPadTabs: "calls",
    });
    expect(adapter._navigateToViewCalls).not.toHaveBeenCalled();
  });

  test("translates navigation through the raw host-message boundary", async () => {
    const adapter = createAdapterInstance();
    const push = jest.fn(async () => {});
    adapter._router = { currentPath: "/", goBack: jest.fn(), push };
    adapter._webphone = { sessions: [] };
    adapter.logger = { warn: jest.fn() };
    adapter._navigateTo = Adapter.prototype._navigateTo;
    adapter._navigateToRequestedCall =
      Adapter.prototype._navigateToRequestedCall;
    adapter._navigateToCurrentCall = jest.fn(async () => {});
    adapter._navigateToViewCalls = jest.fn(async () => {});

    adapter._onWindowMessage({
      data: {
        type: "rc-adapter-navigate-to",
        path: "/history",
      },
    });
    await new Promise((resolve) => setImmediate(resolve));

    expect(push).toHaveBeenCalledWith("/dialer", {
      dialPadTabs: "calls",
    });
  });

  test("does not route unsupported history types to call detail", async () => {
    const adapter = createAdapter();

    await Adapter.prototype._navigateTo.call(adapter, "/history/recordings");

    expect(adapter._router.push).not.toHaveBeenCalled();
    expect(adapter.logger.warn).toHaveBeenCalledWith(
      "Unsupported legacy adapter navigation",
      expect.objectContaining({
        kind: "unsupported",
        path: "/history/recordings",
      })
    );
  });

  test("selects the explicitly requested active call", async () => {
    const navigateToActive = jest.fn(async () => {});
    const adapter = createAdapter({
      _callAction: { navigateToActive },
      _webphone: {
        sessions: [
          {
            id: "webphone-1",
            partyData: { sessionId: "telephony-1" },
          },
          {
            id: "webphone-2",
            partyData: { sessionId: "telephony-2" },
          },
        ],
      },
    });

    await Adapter.prototype._navigateTo.call(
      adapter,
      "/calls/active/webphone-2"
    );

    expect(adapter._router.push).toHaveBeenCalledWith("/calling");
    expect(navigateToActive).toHaveBeenCalledWith("telephony-2");
    expect(adapter._router.push.mock.invocationCallOrder[0]).toBeLessThan(
      navigateToActive.mock.invocationCallOrder[0]
    );
    expect(adapter._navigateToCurrentCall).not.toHaveBeenCalled();
  });

  test("does not fall back when an explicit active-call ID is invalid", async () => {
    const navigateToActive = jest.fn(async () => {});
    const adapter = createAdapter({
      _callAction: { navigateToActive },
      _webphone: {
        sessions: [
          {
            id: "webphone-1",
            partyData: { sessionId: "telephony-1" },
          },
        ],
      },
    });

    await Adapter.prototype._navigateTo.call(adapter, "/calls/active/missing");

    expect(adapter._router.push).not.toHaveBeenCalled();
    expect(navigateToActive).not.toHaveBeenCalled();
    expect(adapter._navigateToCurrentCall).not.toHaveBeenCalled();
  });

  test("keeps current-call navigation when no explicit ID is supplied", async () => {
    const adapter = createAdapter();

    await Adapter.prototype._navigateTo.call(adapter, "/calls/active");

    expect(adapter._navigateToCurrentCall).toHaveBeenCalledTimes(1);
  });

  test.each([
    ["/dialer", "/dialer", { dialPadTabs: "keypad" }],
    ["/messages/voicemail", "/dialer", { dialPadTabs: "voicemail" }],
    ["/meeting/home", "/meeting", { meetingTabs: "upcoming" }],
    ["/meeting/history", "/meeting", { meetingTabs: "history" }],
    ["/meeting/history/recordings", "/meeting", { meetingTabs: "recordings" }],
  ])("maps %s to its next tab state", async (legacyPath, path, state) => {
    const adapter = createAdapter();

    await Adapter.prototype._navigateTo.call(adapter, legacyPath);

    expect(adapter._router.push).toHaveBeenCalledWith(path, state);
  });

  test.each([
    "/customized/page-id",
    "/customizedTabs/tab-id",
  ])("routes registered customized content at %s", async (path) => {
    const adapter = createAdapter();

    await Adapter.prototype._navigateTo.call(adapter, path);

    expect(adapter._router.push).toHaveBeenCalledWith(path);
  });

  test.each([
    "/HUD",
    "/glip",
    "/glip/groups/group-id",
    "/log/call/session-id",
    "/settings/thirdParty/general",
  ])("does not push unsupported legacy path %s", async (path) => {
    const adapter = createAdapter();

    await Adapter.prototype._navigateTo.call(adapter, path);

    expect(adapter._router.push).not.toHaveBeenCalled();
    expect(adapter.logger.warn).toHaveBeenCalled();
  });

  test("reports legacy-equivalent paths for DialerPad tabs", () => {
    const adapter = createAdapter({
      _router: { currentPath: "/dialer" },
      _syncTabView: { getActive: jest.fn(() => "calls") },
    });

    expect(Adapter.prototype._getEffectiveWidgetPath.call(adapter)).toBe(
      "/history"
    );

    adapter._syncTabView.getActive.mockReturnValue("voicemail");
    expect(Adapter.prototype._getEffectiveWidgetPath.call(adapter)).toBe(
      "/messages/voicemail"
    );
  });

  test("reports legacy-equivalent paths for meeting tabs", () => {
    const adapter = createAdapter({
      _router: { currentPath: "/meeting" },
      _syncTabView: { getActive: jest.fn(() => "recordings") },
    });

    expect(Adapter.prototype._getEffectiveWidgetPath.call(adapter)).toBe(
      "/meeting/history/recordings"
    );
  });
});
