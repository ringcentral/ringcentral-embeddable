const mockBaseForward = jest.fn(async () => true);
const mockBaseStartRecord = jest.fn(async () => true);
const mockBaseStopRecord = jest.fn(async () => true);

jest.mock(
  "@ringcentral-integration/micro-phone/src/app/services/ActiveCallControl",
  () => ({
    ActiveCallControl: class ActiveCallControl {
      async forward(...args) {
        return mockBaseForward(...args);
      }

      async startRecord(...args) {
        return mockBaseStartRecord(...args);
      }

      async stopRecord(...args) {
        return mockBaseStopRecord(...args);
      }
    },
    normalizeToActiveCallControlSession: jest.fn((session) => session),
  })
);
jest.mock("@ringcentral-integration/micro-core/src/app/views", () => ({
  ModalView: class ModalView {},
}));
jest.mock(
  "@ringcentral-integration/micro-phone/src/app/services/ActiveCallControl/i18n",
  () => ({
    t: (key) =>
      key === "pauseRecordError"
        ? "Sorry, we weren't able to stop recording the call. Try again later."
        : key,
  })
);

const {
  ActiveCallControl,
} = require("../../next/app/services/ActiveCallControl/ActiveCallControl");

describe("ActiveCallControl compatibility routing", () => {
  function createControl() {
    return new ActiveCallControl(...Array.from({ length: 23 }, () => ({})));
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("identifies only sessions supplied by RingCentral Call Control", () => {
    const control = {
      data: {
        sessions: [
          { id: "telephony-session" },
          { id: "other", telephonySessionId: "normalized-session" },
        ],
      },
    };

    expect(
      ActiveCallControl.prototype.hasTelephonySession.call(
        control,
        "telephony-session"
      )
    ).toBe(true);
    expect(
      ActiveCallControl.prototype.hasTelephonySession.call(
        control,
        "normalized-session"
      )
    ).toBe(true);
    expect(
      ActiveCallControl.prototype.hasTelephonySession.call(control, "fallback")
    ).toBe(false);
  });

  test.each([
    ["startRecord", mockBaseStartRecord],
    ["stopRecord", mockBaseStopRecord],
  ])(
    "routes real telephony %s through the base service",
    async (method, base) => {
      const control = {
        hasTelephonySession: jest.fn(() => true),
      };

      await ActiveCallControl.prototype[method].call(
        control,
        "telephony-session"
      );

      expect(base).toHaveBeenCalledWith("telephony-session");
    }
  );

  test("reports successful telephony stop recording to Adapter", async () => {
    const control = createControl();
    control.stopRecord = jest.fn(async () => {});

    await expect(
      control.stopRecordForAdapter("telephony-session")
    ).resolves.toBe(true);
  });

  test.each([
    [
      Object.assign(new Error("disabled"), { response: { status: 403 } }),
      'Sorry, stopping recording is not supported for this call. Please contact your account administrator to enable "Allow mute in auto recording".',
    ],
    [
      new Error("failed"),
      "Sorry, we weren't able to stop recording the call. Try again later.",
    ],
  ])(
    "reports readable telephony stop-recording failures to Adapter",
    async (error, expectedMessage) => {
      const control = createControl();
      const danger = jest.fn();
      control._toast = { danger };
      control.stopRecord = jest.fn(async () => {
        await control.stopRecordErrorHandle(error);
      });

      await expect(
        control.stopRecordForAdapter("telephony-session")
      ).resolves.toBe(false);

      expect(danger).toHaveBeenCalledWith({ message: expectedMessage });
      expect(danger).not.toHaveBeenCalledWith({ message: "recordError" });
      expect(danger).not.toHaveBeenCalledWith({
        message: "stopRecordDisabled",
      });
    }
  );

  test.each([
    ["startRecord", "startRecord", mockBaseStartRecord],
    ["stopRecord", "stopRecordWithWebphone", mockBaseStopRecord],
  ])(
    "routes fallback %s through Webphone",
    async (method, webphoneMethod, base) => {
      const record = jest.fn(async () => {});
      const control = {
        hasTelephonySession: jest.fn(() => false),
        getWebphoneSessionId: jest.fn(() => "webphone-session"),
        setCallControlBusyTimestamp: jest.fn(),
        clearCallControlBusyTimestamp: jest.fn(),
        [webphoneMethod]: record,
        _webphone: { startRecord: record },
      };

      await ActiveCallControl.prototype[method].call(
        control,
        "telephony-session"
      );

      expect(record).toHaveBeenCalledWith("webphone-session");
      expect(base).not.toHaveBeenCalled();
    }
  );

  test("forwards calls without party data through Webphone", async () => {
    const forward = jest.fn(async () => true);
    const control = {
      getWebphoneSessionId: jest.fn(() => "webphone-session"),
      _webphone: {
        sessions: [{ id: "webphone-session", partyData: null }],
        forward,
      },
    };

    await ActiveCallControl.prototype.forward.call(
      control,
      "+16505550111",
      "telephony-session"
    );

    expect(forward).toHaveBeenCalledWith("webphone-session", "+16505550111");
  });

  test.each([
    ["12345", { extensionNumber: "12345" }],
    ["+16505550111", { phoneNumber: "+16505550111" }],
  ])(
    "forwards party calls with the legacy request body for %s",
    async (forwardNumber, requestBody) => {
      const post = jest.fn(async () => {});
      const setForwardFlag = jest.fn(async () => true);
      const control = {
        getWebphoneSessionId: jest.fn(() => "webphone-session"),
        setCallControlBusyTimestamp: jest.fn(),
        clearCallControlBusyTimestamp: jest.fn(),
        logger: { error: jest.fn() },
        _webphone: {
          sessions: [
            {
              id: "webphone-session",
              partyData: {
                sessionId: "telephony-session",
                partyId: "party-id",
              },
            },
          ],
        },
        _webphoneV2: { setForwardFlag },
        _brand: { brandConfig: { allowRegionSettings: true } },
        _regionSettings: { areaCode: "650", countryCode: "US" },
        _accountInfo: { maxExtensionNumberLength: 6 },
        _client: { service: { platform: () => ({ post }) } },
        _toast: { warning: jest.fn() },
      };

      await ActiveCallControl.prototype.forward.call(
        control,
        forwardNumber,
        "telephony-session"
      );

      expect(setForwardFlag).toHaveBeenCalledWith("webphone-session");
      expect(post).toHaveBeenCalledWith(
        "/restapi/v1.0/account/~/telephony/sessions/telephony-session/parties/party-id/forward",
        requestBody
      );
      expect(setForwardFlag.mock.invocationCallOrder[0]).toBeLessThan(
        post.mock.invocationCallOrder[0]
      );
    }
  );
});
