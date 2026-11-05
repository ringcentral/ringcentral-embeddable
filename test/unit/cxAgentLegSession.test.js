const {
  isCxAgentLegSession,
} = require("../../src/app/services/ActiveCallControl/is-cx-agent-leg-session");

const AGENT_EXTENSION_ID = "2575236027";

const rcxIdsMeta = [
  {
    category: "System",
    values: [
      {
        id: "rcx-ids",
        value: "cxdid=s-v-1;cxsid=p-v-1;cxcid=p-v-2;cxiid=202611050307525070001",
      },
    ],
  },
];

const sipUserToUserMeta = [
  {
    category: "System",
    values: [{ id: "sipUserToUser", value: "rcx.372332026.99950001.s-v-1" }],
  },
];

describe("isCxAgentLegSession", () => {
  test("matches the agent leg of a RingCX Ask First transfer", () => {
    expect(
      isCxAgentLegSession({
        extensionId: AGENT_EXTENSION_ID,
        party: {
          extensionId: AGENT_EXTENSION_ID,
          direction: "Outbound",
          meta: rcxIdsMeta,
        },
      })
    ).toBe(true);
  });

  test("finds the own party in parties when party is missing", () => {
    expect(
      isCxAgentLegSession({
        extensionId: Number(AGENT_EXTENSION_ID),
        parties: [
          {
            extensionId: "2651623027",
            direction: "Inbound",
            meta: sipUserToUserMeta,
          },
          {
            extensionId: AGENT_EXTENSION_ID,
            direction: "Outbound",
            meta: rcxIdsMeta,
          },
        ],
      })
    ).toBe(true);
  });

  test("ignores an inbound call transferred from RingCX", () => {
    expect(
      isCxAgentLegSession({
        extensionId: AGENT_EXTENSION_ID,
        party: {
          extensionId: AGENT_EXTENSION_ID,
          direction: "Inbound",
          meta: sipUserToUserMeta,
        },
      })
    ).toBe(false);
  });

  test("ignores an inbound own party even when it has rcx-ids meta", () => {
    expect(
      isCxAgentLegSession({
        party: { direction: "Inbound", meta: rcxIdsMeta },
      })
    ).toBe(false);
  });

  test("ignores a RingEX outbound call without RingCX meta", () => {
    expect(
      isCxAgentLegSession({
        extensionId: AGENT_EXTENSION_ID,
        party: { extensionId: AGENT_EXTENSION_ID, direction: "Outbound" },
      })
    ).toBe(false);
  });

  test("does not read another party's rcx-ids meta as the own party", () => {
    expect(
      isCxAgentLegSession({
        extensionId: AGENT_EXTENSION_ID,
        parties: [
          { extensionId: "1", direction: "Outbound", meta: rcxIdsMeta },
          { extensionId: AGENT_EXTENSION_ID, direction: "Outbound" },
        ],
      })
    ).toBe(false);
  });

  test("ignores a session without an own party", () => {
    expect(isCxAgentLegSession({ parties: [] })).toBe(false);
  });
});
