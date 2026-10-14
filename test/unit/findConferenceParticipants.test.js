jest.mock(
  "@ringcentral-integration/micro-phone/src/app/services/ActiveCallControl",
  () => ({ CONFERENCE_ORIGIN_TYPE: "Conference" })
);

const {
  findConferenceParticipants,
} = require("../../src/app/services/ActiveCallControl/find-conference-participants");

const CONFERENCE_ID = "s-conference";

const selfExtensionInfo = {
  id: 1021462048,
  extensionNumber: "103",
  name: "Host User",
  contact: { businessPhone: "+16503626712" },
};

function createConferenceSession(overrides = {}) {
  return {
    id: CONFERENCE_ID,
    data: { sessionId: "0" },
    origin: { type: "Conference" },
    party: {
      id: `${CONFERENCE_ID}-1`,
      direction: "Outbound",
      conferenceRole: "Host",
      status: { code: "Answered" },
    },
    ...overrides,
  };
}

/**
 * A call leg merged into the conference, shaped like the live telephony
 * session event: the conference id is in `peerId.sessionId`.
 */
function createMergedLeg({
  id,
  partyId,
  direction = "Outbound",
  peerId,
  from = { phoneNumber: "+16503626712" },
  to,
  status = { code: "Gone", reason: "Conference" },
}) {
  return {
    id,
    data: { sessionId: `${id}-session` },
    origin: { type: "Call" },
    party: {
      id: `${id}-1`,
      direction,
      from,
      to,
      status: {
        ...status,
        peerId: peerId ?? { partyId, sessionId: CONFERENCE_ID },
      },
    },
  };
}

describe("findConferenceParticipants", () => {
  test("returns no participants for a non conference session", () => {
    const session = createConferenceSession({ origin: { type: "Call" } });

    expect(
      findConferenceParticipants(session, [session], selfExtensionInfo)
    ).toEqual([]);
  });

  test("finds merged legs that reference the conference by peerId.sessionId", () => {
    const conference = createConferenceSession();
    const firstLeg = createMergedLeg({
      id: "s-first",
      partyId: `${CONFERENCE_ID}-3`,
      to: { phoneNumber: "+16579991394" },
    });
    const secondLeg = createMergedLeg({
      id: "s-second",
      partyId: `${CONFERENCE_ID}-2`,
      to: {
        extensionId: "1396693048",
        name: "Participant User",
        phoneNumber: "+16508447090",
      },
    });

    const participants = findConferenceParticipants(
      conference,
      [firstLeg, conference, secondLeg],
      selfExtensionInfo
    );

    expect(participants).toEqual([
      {
        sessionId: "0",
        telephonySessionId: CONFERENCE_ID,
        partyId: undefined,
        isHost: true,
        sessionName: "",
        info: {
          phoneNumber: "+16503626712",
          extensionNumber: "103",
          name: "Host User",
          extensionId: "1021462048",
        },
      },
      {
        sessionId: "s-first-session",
        telephonySessionId: "s-first",
        partyId: `${CONFERENCE_ID}-3`,
        sessionName: undefined,
        info: { phoneNumber: "+16579991394" },
        queueName: undefined,
      },
      {
        sessionId: "s-second-session",
        telephonySessionId: "s-second",
        partyId: `${CONFERENCE_ID}-2`,
        sessionName: "Participant User",
        info: {
          extensionId: "1396693048",
          name: "Participant User",
          phoneNumber: "+16508447090",
        },
        queueName: undefined,
      },
    ]);
  });

  test("still matches legs that reference the conference by peerId.telephonySessionId", () => {
    const conference = createConferenceSession();
    const leg = createMergedLeg({
      id: "s-leg",
      peerId: { partyId: "p-2", telephonySessionId: CONFERENCE_ID },
      to: { phoneNumber: "+16579991394" },
    });

    const participants = findConferenceParticipants(
      conference,
      [conference, leg],
      selfExtensionInfo
    );

    expect(participants.map((item) => item.telephonySessionId)).toEqual([
      CONFERENCE_ID,
      "s-leg",
    ]);
  });

  test("names an inbound leg after its caller and keeps its queue name", () => {
    const conference = createConferenceSession();
    const leg = createMergedLeg({
      id: "s-inbound",
      partyId: "p-2",
      direction: "Inbound",
      from: { name: "Caller", phoneNumber: "+16500000001" },
      to: { phoneNumber: "+16503626712" },
    });
    leg.party.uiCallInfo = { primary: { type: "QueueName", value: "Sales" } };

    const [, participant] = findConferenceParticipants(
      conference,
      [conference, leg],
      selfExtensionInfo
    );

    expect(participant).toMatchObject({
      sessionName: "Caller",
      info: { name: "Caller", phoneNumber: "+16500000001" },
      queueName: "Sales",
    });
  });

  test("ignores legs of another conference and legs that are not gone", () => {
    const conference = createConferenceSession();
    const otherConferenceLeg = createMergedLeg({
      id: "s-other",
      peerId: { partyId: "p-2", sessionId: "s-other-conference" },
      to: { phoneNumber: "+16500000002" },
    });
    const activeLeg = createMergedLeg({
      id: "s-active",
      partyId: "p-3",
      status: { code: "Answered" },
      to: { phoneNumber: "+16500000003" },
    });

    const participants = findConferenceParticipants(
      conference,
      [conference, otherConferenceLeg, activeLeg],
      selfExtensionInfo
    );

    expect(participants).toHaveLength(1);
    expect(participants[0].isHost).toBe(true);
  });

  test("skips participants that were removed from the conference", () => {
    const conference = createConferenceSession();
    const removedLeg = createMergedLeg({
      id: "s-removed",
      partyId: "p-removed",
      to: { phoneNumber: "+16500000004" },
    });
    const keptLeg = createMergedLeg({
      id: "s-kept",
      partyId: "p-kept",
      to: { phoneNumber: "+16500000005" },
    });
    const checkStillExist = jest.fn(
      (_session, partyId) => partyId !== "p-removed"
    );

    const participants = findConferenceParticipants(
      conference,
      [conference, removedLeg, keptLeg],
      selfExtensionInfo,
      checkStillExist
    );

    expect(participants.map((item) => item.telephonySessionId)).toEqual([
      CONFERENCE_ID,
      "s-kept",
    ]);
  });

  test("adds the host without contact info when the extension is unknown", () => {
    const conference = createConferenceSession();

    expect(
      findConferenceParticipants(conference, [conference], undefined)
    ).toEqual([expect.objectContaining({ isHost: true, info: {} })]);
  });
});
