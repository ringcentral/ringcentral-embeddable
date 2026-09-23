import { formatRingCXCall } from "../src/ringcx/lib/formatRingCXCall";

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
});
