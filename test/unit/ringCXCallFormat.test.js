import { formatRingCXCall } from "../../src/ringcx/lib/formatRingCXCall";

function createInput(overrides = {}) {
  return {
    uii: "202609230001",
    sessionId: "2",
    callType: "OUTBOUND",
    agentId: "1001",
    ani: "+16505550100",
    dnis: "+16505550199",
    notes: "Agent notes",
    disposition: { id: "7", name: "Sale" },
    ...overrides,
  };
}

describe("formatRingCXCall", () => {
  it("maps the disposition summary to the RingEX aiNote field", () => {
    const { call } = formatRingCXCall(
      createInput({ summary: "Customer asked for a callback." })
    );

    expect(call.aiNote).toBe("Customer asked for a callback.");
    expect(call.ringcx.notes).toBe("Agent notes");
    expect(call.ringcx).not.toHaveProperty("summary");
  });

  it("leaves aiNote unset when there is no summary", () => {
    expect(formatRingCXCall(createInput()).call.aiNote).toBeUndefined();
    expect(
      formatRingCXCall(createInput({ summary: "" })).call.aiNote
    ).toBeUndefined();
  });

  describe("segmentId and dialogId", () => {
    it("reads them from the live call session", () => {
      const { call } = formatRingCXCall(
        createInput({
          session: { sessionId: "2", segmentId: "seg-1", dialogId: "dialog-1" },
          segmentContext: {
            segmentId: "seg-context",
            dialog: { dialogId: "dialog-context" },
          },
        })
      );

      expect(call.ringcx.segmentId).toBe("seg-1");
      expect(call.ringcx.dialogId).toBe("dialog-1");
    });

    it("falls back to the segment context when the session has none", () => {
      const { call } = formatRingCXCall(
        createInput({
          session: { sessionId: "2", segmentId: "", dialogId: "" },
          segmentContext: {
            segmentId: "seg-context",
            dialog: { dialogId: "dialog-context" },
          },
        })
      );

      expect(call.ringcx.segmentId).toBe("seg-context");
      expect(call.ringcx.dialogId).toBe("dialog-context");
    });

    it("reads the flat fields of a history row", () => {
      const { call } = formatRingCXCall(
        createInput({ segmentId: "seg-history", dialogId: "dialog-history" })
      );

      expect(call.ringcx.segmentId).toBe("seg-history");
      expect(call.ringcx.dialogId).toBe("dialog-history");
    });

    it("leaves them unset when the SDK sends empty strings", () => {
      const { call } = formatRingCXCall(
        createInput({
          session: { sessionId: "2", segmentId: "", dialogId: "" },
          segmentContext: { segmentId: "", dialog: { dialogId: "" } },
        })
      );

      expect(call.ringcx.segmentId).toBeUndefined();
      expect(call.ringcx.dialogId).toBeUndefined();
    });
  });
});
