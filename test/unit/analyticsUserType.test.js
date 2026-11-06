const mockMixpanel = {
  init: jest.fn(),
  get_distinct_id: jest.fn(() => "hashed-user"),
  identify: jest.fn(),
  people: { set: jest.fn() },
  add_group: jest.fn(),
  set_group: jest.fn(),
};

jest.mock("mixpanel-browser", () => ({
  __esModule: true,
  default: mockMixpanel,
}));

const {
  EmbeddableTrackProps,
} = require("../../src/app/services/Analytics/EmbeddableTrackProps");
const {
  LegacyMixpanel,
} = require("../../src/app/services/Analytics/LegacyMixpanel");

function createTrackProps({ devices, hasRingCXPermission } = {}) {
  const trackProps = new EmbeddableTrackProps(
    { defaultConfig: { code: "rc" } },
    { appVersion: "1.0.0" },
    { server: "https://platform.ringcentral.com" }
  );
  if (devices) {
    trackProps._extensionDevice = { devices };
  }
  if (hasRingCXPermission !== undefined) {
    trackProps._appFeatures = { hasRingCXPermission };
  }
  return trackProps;
}

describe("analytics user type", () => {
  test.each([
    ["EX+CX", [{ id: "device-1" }], true],
    ["EX", [{ id: "device-1" }], false],
    ["CX", [], true],
    [null, [], false],
  ])(
    "reports %s from digital lines and the RingCX permission",
    (userType, devices, hasRingCXPermission) => {
      expect(createTrackProps({ devices, hasRingCXPermission }).userType).toBe(
        userType
      );
    }
  );

  test("is null before devices and features are available", () => {
    expect(createTrackProps().userType).toBeNull();
  });

  test("reports CX while devices are not available yet", () => {
    expect(createTrackProps({ hasRingCXPermission: true }).userType).toBe("CX");
  });

  test("sends the user type as a super property", () => {
    expect(
      createTrackProps({
        devices: [{ id: "device-1" }],
        hasRingCXPermission: true,
      }).trackProps
    ).toEqual(expect.objectContaining({ userType: "EX+CX" }));
  });
});

describe("analytics user type profile", () => {
  const identity = {
    hashedUserId: "hashed-user",
    hashedAccountId: "hashed-account",
    accountId: "372332026",
    environment: "Production",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("leaves the user type off the profile until it is known", async () => {
    const legacyMixpanel = await LegacyMixpanel.load("token");

    legacyMixpanel.syncIdentity({ ...identity, userType: null });

    expect(mockMixpanel.people.set).toHaveBeenCalledWith({
      rcAccountId: "hashed-account",
      accountId: "372332026",
      environment: "Production",
    });
  });

  test("updates the profile when the user type changes", async () => {
    const legacyMixpanel = await LegacyMixpanel.load("token");

    legacyMixpanel.syncIdentity({ ...identity, userType: null });
    legacyMixpanel.syncIdentity({ ...identity, userType: "CX" });
    legacyMixpanel.syncIdentity({ ...identity, userType: "CX" });
    legacyMixpanel.syncIdentity({ ...identity, userType: "EX+CX" });

    expect(mockMixpanel.people.set).toHaveBeenCalledTimes(3);
    expect(mockMixpanel.people.set).toHaveBeenLastCalledWith({
      rcAccountId: "hashed-account",
      accountId: "372332026",
      environment: "Production",
      userType: "EX+CX",
    });
  });

  test("includes the user type in the identity", () => {
    expect(
      createTrackProps({ devices: [{ id: "device-1" }] }).identity
    ).toEqual(expect.objectContaining({ userType: "EX" }));
  });
});
