jest.mock("../../next/app/services/ThirdParty", () => ({
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

jest.mock("../../next/app/views/LogCallView/LogCallPage", () => ({
  LogCallPage: () => null,
}));

const {
  LogCallView,
} = require("../../next/app/views/LogCallView/LogCall.view");

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

  test("opens an existing log without reopening the customized log form", async () => {
    const call = { sessionId: "session-id", type: "Voice" };
    const callLogger = {
      logCall: jest.fn(async () => undefined),
    };
    const view = new LogCallView(callLogger, {}, {}, {}, {});

    await view.viewLog(call);

    expect(callLogger.logCall).toHaveBeenCalledWith({
      call,
      redirect: true,
      triggerType: "viewLog",
    });
  });
});
