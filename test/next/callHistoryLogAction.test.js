import {
  addCallHistoryLogStatus,
  createCallHistoryLogAction,
  getCallHistoryLogActionHiddenReason,
  hasLoggedCallActivity,
  insertCallHistoryLogAction,
  logCallFromHistory,
} from "../../next/app/views/CallHistoryView/CallHistoryLogAction";

function createOptions(overrides = {}) {
  return {
    call: { activityMatches: [], type: "Voice" },
    editLogLabel: "Edit log",
    hideEditLogButton: false,
    isLogging: false,
    logButtonTitle: "Save to CRM",
    logCallLabel: "Log call",
    ready: true,
    ...overrides,
  };
}

describe("call-history log action", () => {
  test("derives the shared logged status from non-status activities", () => {
    expect(
      addCallHistoryLogStatus({
        activityMatches: [{ type: "status" }],
        type: "Voice",
      }).isLogged
    ).toBe(false);
    expect(
      addCallHistoryLogStatus({
        activityMatches: [{ type: "callLog" }],
        type: "Voice",
      }).isLogged
    ).toBe(true);
  });

  test("uses the registered title for an unlogged call", () => {
    expect(createCallHistoryLogAction(createOptions())).toEqual({
      disabled: false,
      label: "Save to CRM",
      type: "viewLog",
    });
  });

  test("uses the edit label for a logged call", () => {
    const call = {
      activityMatches: [{ id: "activity", type: "callLog" }],
      type: "Voice",
    };
    expect(hasLoggedCallActivity(call)).toBe(true);
    expect(createCallHistoryLogAction(createOptions({ call }))).toEqual({
      disabled: false,
      label: "Edit log",
      type: "viewLog",
    });
  });

  test.each([
    [{ ready: false }, null],
    [{ call: { activityMatches: [], type: "Fax" } }, null],
    [
      {
        call: {
          activityMatches: [{ type: "callLog" }],
          type: "Voice",
        },
        hideEditLogButton: true,
      },
      null,
    ],
  ])("hides unavailable actions", (overrides, expected) => {
    expect(createCallHistoryLogAction(createOptions(overrides))).toBe(expected);
  });

  test.each([
    [{ ready: false }, "callLoggerNotReady"],
    [{ call: { activityMatches: [], type: "Fax" } }, "faxCall"],
    [
      {
        call: { activityMatches: [{ type: "callLog" }], type: "Voice" },
        hideEditLogButton: true,
      },
      "editLogHidden",
    ],
    [{}, null],
  ])("reports the action visibility reason", (overrides, expected) => {
    const options = createOptions(overrides);
    expect(
      getCallHistoryLogActionHiddenReason({
        call: options.call,
        hideEditLogButton: options.hideEditLogButton,
        ready: options.ready,
      })
    ).toBe(expected);
  });

  test("disables the action while logging or matching is pending", () => {
    expect(
      createCallHistoryLogAction(createOptions({ isLogging: true }))
    ).toEqual(expect.objectContaining({ disabled: true }));
    expect(
      createCallHistoryLogAction(
        createOptions({
          call: {
            activityMatches: [{ status: "pending", type: "status" }],
            type: "Voice",
          },
        })
      )
    ).toEqual(expect.objectContaining({ disabled: true }));
  });

  test("places the integration log action first without duplicates", () => {
    expect(
      insertCallHistoryLogAction(
        [{ type: "call" }, { type: "createLog" }, { type: "copyNumber" }],
        { label: "Log call", type: "viewLog" }
      )
    ).toEqual([
      { label: "Log call", type: "viewLog" },
      { type: "call" },
      { type: "copyNumber" },
    ]);
  });

  test("opens the registered log form when modal logging is enabled", async () => {
    const callLogger = { logCall: jest.fn() };
    const router = { push: jest.fn(async () => {}) };
    await logCallFromHistory({
      call: {
        activityMatches: [],
        sessionId: "session-id",
        type: "Voice",
      },
      callLogger,
      info: { renderInfo: {} },
      router,
      thirdParty: { showLogModal: true },
    });

    expect(router.push).toHaveBeenCalledWith("/log/call/session-id");
    expect(callLogger.logCall).not.toHaveBeenCalled();
  });

  test.each([
    [[], "createLog"],
    [[{ type: "callLog" }], "editLog"],
  ])(
    "submits directly with the correct trigger",
    async (activityMatches, triggerType) => {
      const call = {
        activityMatches,
        sessionId: "session-id",
        type: "Voice",
      };
      const contact = { id: "contact-id" };
      const callLogger = { logCall: jest.fn(async () => {}) };
      await logCallFromHistory({
        call,
        callLogger,
        info: { renderInfo: { matchedContact: contact } },
        router: { push: jest.fn() },
        thirdParty: { showLogModal: false },
      });

      expect(callLogger.logCall).toHaveBeenCalledWith({
        call,
        contact,
        redirect: true,
        triggerType,
      });
    }
  );
});
