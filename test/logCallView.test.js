jest.mock("../src/app/services/ThirdParty", () => ({
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

jest.mock("../src/app/views/LogCallView/LogCallPage", () => ({
  LogCallPage: () => null,
}));

const {
  LogCallView,
} = require("../src/app/views/LogCallView/LogCall.view");

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
