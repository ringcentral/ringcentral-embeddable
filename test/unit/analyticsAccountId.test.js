const mockMixpanel = {
  init: jest.fn(),
  get_distinct_id: jest.fn(() => "hashed-user"),
  identify: jest.fn(),
  people: { set: jest.fn() },
  add_group: jest.fn(),
  set_group: jest.fn(),
  track: jest.fn(),
  track_pageview: jest.fn(),
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
const {
  hashAnalyticsId,
} = require("../../src/app/services/Analytics/hashAnalyticsId");

function createTrackProps(accountId) {
  const trackProps = new EmbeddableTrackProps(
    { defaultConfig: { code: "rc" } },
    { appVersion: "1.0.0" },
    { server: "https://platform.ringcentral.com" }
  );
  if (accountId !== undefined) {
    trackProps._extensionInfo = { accountId };
  }
  return trackProps;
}

describe("analytics account id", () => {
  test("exposes the raw and hashed account ids in the identity", () => {
    expect(createTrackProps(372332026).identity).toEqual(
      expect.objectContaining({
        accountId: "372332026",
        hashedAccountId: hashAnalyticsId(372332026),
      })
    );
  });

  test("is null before the extension info is available", () => {
    expect(createTrackProps().identity).toEqual(
      expect.objectContaining({ accountId: null, hashedAccountId: null })
    );
  });

  test("keeps the hashed account id as the rcAccountId super property", () => {
    const { trackProps } = createTrackProps("372332026");

    expect(trackProps.rcAccountId).toBe(hashAnalyticsId("372332026"));
    // the raw `accountId` super property comes from upstream TrackPropsService
    expect(trackProps).not.toHaveProperty("accountId");
  });
});

describe("legacy Mixpanel account id", () => {
  const identity = {
    hashedUserId: "hashed-user",
    hashedAccountId: "hashed-account",
    accountId: "372332026",
    environment: "Production",
    userType: "EX",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("links the hashed and raw account groups", async () => {
    const legacyMixpanel = await LegacyMixpanel.load("token");

    legacyMixpanel.syncIdentity(identity);

    for (const groupCall of [mockMixpanel.add_group, mockMixpanel.set_group]) {
      expect(groupCall).toHaveBeenCalledTimes(2);
      expect(groupCall).toHaveBeenCalledWith("rcAccountId", "hashed-account");
      expect(groupCall).toHaveBeenCalledWith("accountId", "372332026");
    }
  });

  test("leaves the profile and groups until the account id is known", async () => {
    const legacyMixpanel = await LegacyMixpanel.load("token");

    legacyMixpanel.syncIdentity({
      ...identity,
      hashedAccountId: null,
      accountId: null,
    });

    expect(mockMixpanel.identify).toHaveBeenCalledWith("hashed-user");
    expect(mockMixpanel.people.set).not.toHaveBeenCalled();
    expect(mockMixpanel.add_group).not.toHaveBeenCalled();
    expect(mockMixpanel.set_group).not.toHaveBeenCalled();
  });

  test("identifies after a reload when the persisted distinct id matches", async () => {
    const legacyMixpanel = await LegacyMixpanel.load("token");

    legacyMixpanel.syncIdentity(identity);

    expect(mockMixpanel.get_distinct_id()).toBe("hashed-user");
    expect(mockMixpanel.identify).toHaveBeenCalledWith("hashed-user");
    expect(mockMixpanel.people.set).toHaveBeenCalledTimes(1);
  });

  test("identifies once per user", async () => {
    const legacyMixpanel = await LegacyMixpanel.load("token");

    legacyMixpanel.syncIdentity(identity);
    legacyMixpanel.syncIdentity({ ...identity, userType: "EX+CX" });
    legacyMixpanel.syncIdentity({ ...identity, hashedUserId: "hashed-user-2" });

    expect(mockMixpanel.identify.mock.calls).toEqual([
      ["hashed-user"],
      ["hashed-user-2"],
    ]);
  });

  test("keeps the raw account id in event properties", async () => {
    const legacyMixpanel = await LegacyMixpanel.load("token");

    legacyMixpanel.track("Int_signIn", {
      accountId: "372332026",
      rcAccountId: "hashed-account",
    });

    expect(mockMixpanel.track).toHaveBeenCalledWith(
      "Int_signIn",
      expect.objectContaining({
        accountId: "372332026",
        rcAccountId: "hashed-account",
      })
    );
  });
});
