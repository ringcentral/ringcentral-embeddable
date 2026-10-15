import { formatHistoryCall } from "../../src/ringcx/services/CxCallHistory/formatHistoryCall";

function createItem({ origination = "OUTBOUND", ...sessionInformation } = {}) {
  return {
    agentSegment: {
      segmentId: "segment-1",
      segmentStart: "2026-10-15T13:50:00.000Z",
      segmentEnd: "2026-10-15T13:50:10.000Z",
    },
    dialog: {
      uii: "202610150150088890000523084042",
      dialogOrigination: origination,
      channelConfiguration: { dnis: "+494022222222022" },
      sessionInformation: {
        phoneNumber: "+16579991394",
        displayName: "",
        rcExtention: false,
        ...sessionInformation,
      },
    },
    outbound: { type: "MANUAL" },
  };
}

describe("formatHistoryCall phone numbers", () => {
  it("keeps the raw E.164 numbers on an outbound call", () => {
    const call = formatHistoryCall(createItem());

    expect(call.to).toEqual({
      name: "+16579991394",
      phoneNumber: "+16579991394",
    });
    expect(call.from).toEqual({ name: "", phoneNumber: "+494022222222022" });
    expect(call.toName).toBe("+16579991394");
    expect(call.fromName).toBe("+494022222222022");
    expect(call.dialableNumber).toBe("+16579991394");
  });

  it("keeps the raw E.164 numbers on an inbound call", () => {
    const call = formatHistoryCall(createItem({ origination: "INBOUND" }));

    expect(call.from.phoneNumber).toBe("+16579991394");
    expect(call.to.phoneNumber).toBe("+494022222222022");
  });

  it("drops a display name that only repeats the formatted number", () => {
    const call = formatHistoryCall(
      createItem({ displayName: "(657) 999-1394" })
    );

    expect(call.to.name).toBe("+16579991394");
  });

  it("uses a real display name with the raw number", () => {
    const call = formatHistoryCall(createItem({ displayName: "Jane Doe" }));

    expect(call.to).toEqual({ name: "Jane Doe", phoneNumber: "+16579991394" });
  });

  it("leaves the parties empty when the server has no numbers", () => {
    const item = createItem({ phoneNumber: null });
    item.dialog.channelConfiguration.dnis = "";
    const call = formatHistoryCall(item);

    expect(call.to).toEqual({ name: "", phoneNumber: "" });
    expect(call.from).toEqual({ name: "", phoneNumber: "" });
    expect(call.dialableNumber).toBeUndefined();
  });
});
