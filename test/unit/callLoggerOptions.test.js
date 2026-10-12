import { createCallLoggerOptions } from "../../src/app/services/CallLogger/createCallLoggerOptions";

describe("CallLogger options", () => {
  function createOptions() {
    const thirdParty = {
      callLoggerRegistered: true,
      logCall: jest.fn(async () => {}),
    };
    return {
      options: createCallLoggerOptions({
        autoLog: true,
        thirdParty,
      }),
      thirdParty,
    };
  }

  test("preserves the default, readiness, and host log payload", async () => {
    const { options, thirdParty } = createOptions();
    const item = { sessionId: "session-id" };

    expect(options.autoLog).toBe(true);
    expect(options.readyCheckFunction()).toBe(true);
    await options.logFunction({ item, triggerType: "auto" });

    expect(thirdParty.logCall).toHaveBeenCalledWith({
      call: item,
      triggerType: "auto",
    });
  });
});
