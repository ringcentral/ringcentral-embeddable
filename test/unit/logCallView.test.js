jest.mock("../../src/app/services/ThirdParty", () => ({
  ThirdParty: class ThirdParty {},
}));

jest.mock(
  "@ringcentral-integration/micro-phone/src/app/views/CallsListViewSpring",
  () => ({ CallsListViewSpring: class CallsListViewSpring {} })
);

jest.mock(
  "@ringcentral-integration/micro-phone/src/app/views/CallView/services",
  () => ({ CallViewState: class CallViewState {} })
);

jest.mock("../../src/app/views/SideWidgetView", () => ({
  SideWidgetView: class SideWidgetView {},
  useSideWidgetBack: jest.requireActual(
    "../../src/app/views/SideWidgetView/useSideWidgetBack"
  ).useSideWidgetBack,
}));

jest.mock("@ringcentral-integration/micro-phone/src/app/services", () => ({
  CALLING_ROUTE_PATH: "/calling",
  CallLogger: class CallLogger {},
}));

jest.mock("@ringcentral-integration/next-core", () => {
  const { Route, Switch, useLocation } = jest.requireActual("react-router-dom");
  return {
    ...jest.requireActual("../mocks/nextCoreMock"),
    Route,
    Switch,
    useLocation,
  };
});

const mockLogCallPageProps = [];
jest.mock("../../src/app/views/LogCallView/LogCallPage", () => ({
  LogCallPage: (props) => {
    mockLogCallPageProps.push(props);
    return null;
  },
}));

const { act, render } = require("@testing-library/react");
const React = require("react");
const { MemoryRouter } = require("react-router-dom");

const {
  LogCallView,
} = require("../../src/app/views/LogCallView/LogCall.view");
const {
  SideWidgetBackContext,
} = require("../../src/app/views/SideWidgetView/SideWidgetBackContext");

describe("LogCallView", () => {
  test("enriches the logger call with the call-detail contact selection", async () => {
    const call = {
      activityMatches: [],
      from: {},
      fromMatches: [],
      sessionId: "session-id",
      telephonySessionId: "telephony-session-id",
      to: {},
      toMatches: [],
      type: "Voice",
    };
    const callSelectionInfo = {
      displayedSelection: { id: "contact-2", name: "Grace Hopper" },
      selections: [],
    };
    const callLogger = {
      getCall: jest.fn(async () => call),
    };
    const callViewState = {
      getExtraLogData: jest.fn(() => ({ callSelectionInfo })),
    };
    const view = new LogCallView(callLogger, {}, {}, {}, callViewState);

    await view.loadCall("session-id");

    expect(view.currentCall).toEqual(call);
    expect(view.getCurrentCallWithExtraLogData()).toEqual({
      ...call,
      callSelectionInfo,
    });
    expect(callViewState.getExtraLogData).toHaveBeenCalledWith(
      "session-id",
      "telephony-session-id"
    );
    expect(view.loading).toBe(false);
  });

  test("stores the loaded call on the server port for the side widget contact", async () => {
    const call = { sessionId: "session-id", telephonySessionId: "t-1" };
    const view = new LogCallView(
      { getCall: jest.fn(async () => call) },
      {},
      {},
      {},
      { getExtraLogData: jest.fn(() => ({})) },
    );
    const storeCurrentCall = jest.spyOn(view, "_storeCurrentCall");

    await view.loadCall("session-id");

    expect(storeCurrentCall).toHaveBeenNthCalledWith(1, null);
    expect(storeCurrentCall).toHaveBeenLastCalledWith(call, "session-id");
    expect(view.getLoadedCall("session-id")).toEqual(call);
    expect(view.getLoadedCall("other-session")).toBeNull();
  });

  test("uses the header match selection when the form has no contact field", () => {
    const selectedContact = { id: "contact-2", name: "Grace Hopper" };
    const view = new LogCallView({}, {}, {}, {}, {});
    const call = {
      callSelectionInfo: {
        displayedSelection: selectedContact,
        selections: [selectedContact],
      },
      direction: "Inbound",
      fromMatches: [selectedContact],
      toMatches: [],
    };

    expect(view.getSelectedContact(call, {})).toBe(selectedContact);
  });

  test("opens an existing log with the form contact, like the history item", async () => {
    const formContact = { id: "contact-1", name: "Ada Lovelace" };
    const call = {
      direction: "Inbound",
      fromMatches: [formContact, { id: "contact-2", name: "Grace Hopper" }],
      sessionId: "session-id",
      toMatches: [],
      type: "Voice",
    };
    const callLogger = {
      logCall: jest.fn(async () => undefined),
    };
    const view = new LogCallView(callLogger, {}, {}, {}, {});

    await view.viewLog(call, { contactId: "contact-1" });

    expect(callLogger.logCall).toHaveBeenCalledWith({
      call,
      contact: formContact,
      redirect: true,
      triggerType: "viewLog",
    });
  });
});

describe("LogCallView from the call page", () => {
  beforeEach(() => {
    mockLogCallPageProps.length = 0;
  });

  function createRouter(currentPath = "/calling") {
    return {
      currentPath,
      goBack: jest.fn(),
      push: jest.fn().mockResolvedValue(undefined),
    };
  }

  function createSideWidgetView() {
    const handles = [];
    return {
      handles,
      createContent: jest.fn((options) => {
        const handle = { options };
        handles.push(handle);
        return handle;
      }),
      openContent: jest.fn(),
      closeTabFromPanel: jest.fn().mockResolvedValue(undefined),
    };
  }

  function createView({
    callLogger = {},
    router = createRouter(),
    sideWidgetView,
  } = {}) {
    const view = new LogCallView(
      callLogger,
      { callLoggerTitle: null, customizedLogCallPage: null },
      router,
      {},
      { getExtraLogData: jest.fn(() => ({})) },
      sideWidgetView
    );
    // next-core binds these on a real module.
    view.component = view.component.bind(view);
    return view;
  }

  test("opens the log page in a side widget tab and stays on the call page", async () => {
    const router = createRouter("/calling");
    const sideWidgetView = createSideWidgetView();
    const view = createView({ router, sideWidgetView });
    const [handle] = sideWidgetView.handles;

    await expect(
      view.openLogCallPage("/log/call/session-1")
    ).resolves.toBe(true);

    expect(handle.options).toEqual(
      expect.objectContaining({
        id: "call-page-log-call",
        scope: "contact",
      })
    );
    expect(sideWidgetView.openContent).toHaveBeenCalledWith(handle);
    expect(router.push).not.toHaveBeenCalled();
  });

  test("routes to the log page outside the call page", async () => {
    const router = createRouter("/dialer");
    const sideWidgetView = createSideWidgetView();
    const view = createView({ router, sideWidgetView });

    await expect(
      view.openLogCallPage("/log/call/session-1")
    ).resolves.toBe(true);

    expect(router.push).toHaveBeenCalledWith("/log/call/session-1");
    expect(sideWidgetView.openContent).not.toHaveBeenCalled();
    expect(sideWidgetView.closeTabFromPanel).not.toHaveBeenCalled();
  });

  test("routes to the log page when there is no side widget", async () => {
    const router = createRouter("/calling");
    const view = createView({ router });

    await view.openLogCallPage("/log/call/session-1");

    expect(router.push).toHaveBeenCalledWith("/log/call/session-1");
  });

  test("leaves other paths to the caller", async () => {
    const router = createRouter("/calling");
    const sideWidgetView = createSideWidgetView();
    const view = createView({ router, sideWidgetView });

    await expect(view.openLogCallPage("/log/messages/c-1")).resolves.toBe(
      false
    );

    expect(router.push).not.toHaveBeenCalled();
    expect(sideWidgetView.openContent).not.toHaveBeenCalled();
  });

  test("closes the call page tab when the log page opens as a routed page", async () => {
    const router = createRouter("/calling");
    const sideWidgetView = createSideWidgetView();
    const view = createView({ router, sideWidgetView });

    await view.openLogCallPage("/log/call/session-1");
    router.currentPath = "/dialer";
    await view.openLogCallPage("/log/call/session-2");

    expect(sideWidgetView.closeTabFromPanel).toHaveBeenCalledWith(
      "call-page-log-call"
    );
    expect(router.push).toHaveBeenCalledWith("/log/call/session-2");
  });

  test("leaves side widget tabs alone once the call page tab closed", async () => {
    const router = createRouter("/calling");
    const sideWidgetView = createSideWidgetView();
    const view = createView({ router, sideWidgetView });
    const [handle] = sideWidgetView.handles;

    await view.openLogCallPage("/log/call/session-1");
    handle.options.onClose(null);
    router.currentPath = "/dialer";
    await view.openLogCallPage("/log/call/session-2");

    expect(sideWidgetView.closeTabFromPanel).not.toHaveBeenCalled();
  });

  test("closes the tab from its side widget back button instead of routing", async () => {
    const router = createRouter("/calling");
    const sideWidgetView = createSideWidgetView();
    const view = createView({ router, sideWidgetView });
    const [handle] = sideWidgetView.handles;

    await view.openLogCallPage("/log/call/session-1");
    handle.options.onBack();

    expect(sideWidgetView.closeTabFromPanel).toHaveBeenCalledWith(
      "call-page-log-call"
    );
    expect(router.goBack).not.toHaveBeenCalled();
  });

  describe("tab page", () => {
    function renderTab(view) {
      const { view: HandleView } = view._callPageLogHandle.options;
      return render(
        React.createElement(
          MemoryRouter,
          { initialEntries: ["/calling"] },
          React.createElement(() => HandleView.call(view))
        )
      );
    }

    test("loads the call of the tab's log path, not the router's", async () => {
      const sideWidgetView = createSideWidgetView();
      const view = createView({ sideWidgetView });
      const loadCall = jest
        .spyOn(view, "loadCall")
        .mockResolvedValue(undefined);

      await view.openLogCallPage("/log/call/session-1?source=ringcx");
      renderTab(view);

      expect(loadCall).toHaveBeenCalledWith("session-1", "ringcx");
      expect(mockLogCallPageProps).not.toHaveLength(0);
    });

    test("renders nothing once the tab closed", async () => {
      const sideWidgetView = createSideWidgetView();
      const view = createView({ sideWidgetView });
      jest.spyOn(view, "loadCall").mockResolvedValue(undefined);

      renderTab(view);

      expect(mockLogCallPageProps).toHaveLength(0);
    });

    test("closes the tab from the page's back button", async () => {
      const router = createRouter("/calling");
      const sideWidgetView = createSideWidgetView();
      const view = createView({ router, sideWidgetView });
      jest.spyOn(view, "loadCall").mockResolvedValue(undefined);

      await view.openLogCallPage("/log/call/session-1");
      renderTab(view);
      mockLogCallPageProps[mockLogCallPageProps.length - 1].onBack();

      expect(sideWidgetView.closeTabFromPanel).toHaveBeenCalledWith(
        "call-page-log-call"
      );
      expect(router.goBack).not.toHaveBeenCalled();
    });

    test("closes the tab after saving the log, so the call page stays", async () => {
      const call = { sessionId: "session-1", telephonySessionId: "t-1" };
      const router = createRouter("/calling");
      const sideWidgetView = createSideWidgetView();
      const callLogger = { logCall: jest.fn().mockResolvedValue(undefined) };
      const view = createView({ callLogger, router, sideWidgetView });
      jest.spyOn(view, "loadCall").mockResolvedValue(undefined);
      view.currentCall = call;

      await view.openLogCallPage("/log/call/session-1");
      renderTab(view);
      await act(() =>
        mockLogCallPageProps[mockLogCallPageProps.length - 1].onSubmit({
          note: "Note",
        })
      );

      expect(callLogger.logCall).toHaveBeenCalledWith(
        expect.objectContaining({ call, triggerType: "logForm" })
      );
      expect(sideWidgetView.closeTabFromPanel).toHaveBeenCalledWith(
        "call-page-log-call"
      );
      expect(router.goBack).not.toHaveBeenCalled();
    });

    test("still goes back in the router on a log page in the main column", async () => {
      const router = createRouter("/dialer");
      const view = createView({ router });
      jest.spyOn(view, "loadCall").mockResolvedValue(undefined);

      render(
        React.createElement(view.component, {
          location: { search: "" },
          match: { params: { callSessionId: "session-1" } },
        })
      );
      mockLogCallPageProps[mockLogCallPageProps.length - 1].onBack();

      expect(router.goBack).toHaveBeenCalledTimes(1);
    });
  });
});

describe("LogCallView in a routed side widget tab", () => {
  beforeEach(() => {
    mockLogCallPageProps.length = 0;
  });

  function renderInTab({ callLogger = {}, closeTab }) {
    const router = {
      currentPath: "/log/call/session-1",
      goBack: jest.fn(),
      push: jest.fn(),
    };
    const view = new LogCallView(
      callLogger,
      { callLoggerTitle: null, customizedLogCallPage: null },
      router,
      {},
      { getExtraLogData: jest.fn(() => ({})) }
    );
    view.component = view.component.bind(view);
    jest.spyOn(view, "loadCall").mockResolvedValue(undefined);
    view.currentCall = { sessionId: "session-1", telephonySessionId: "t-1" };
    render(
      React.createElement(
        SideWidgetBackContext.Provider,
        { value: closeTab },
        React.createElement(view.component, {
          location: { search: "?source=ringcx" },
          match: { params: { callSessionId: "session-1" } },
        })
      )
    );
    return { router, view };
  }

  test("closes its tab after saving the log, instead of going back through history", async () => {
    // The host pushed the log page over a submitted disposition: going back
    // would reopen the disposition, which then routes to the agent dialer.
    const closeTab = jest.fn();
    const callLogger = { logCall: jest.fn().mockResolvedValue(undefined) };
    const { router } = renderInTab({ callLogger, closeTab });

    await act(() =>
      mockLogCallPageProps[mockLogCallPageProps.length - 1].onSubmit({
        note: "Note",
      })
    );

    expect(callLogger.logCall).toHaveBeenCalled();
    expect(closeTab).toHaveBeenCalledTimes(1);
    expect(router.goBack).not.toHaveBeenCalled();
  });

  test("closes its tab from the page's back", () => {
    const closeTab = jest.fn();
    const { router } = renderInTab({ closeTab });

    mockLogCallPageProps[mockLogCallPageProps.length - 1].onBack();

    expect(closeTab).toHaveBeenCalledTimes(1);
    expect(router.goBack).not.toHaveBeenCalled();
  });
});
