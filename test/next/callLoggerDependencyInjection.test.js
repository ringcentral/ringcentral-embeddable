const nextCore = require("@ringcentral-integration/next-core");
const { SmartNotes } = require("../../next/app/services/SmartNotes");
const { ThirdParty } = require("../../next/app/services/ThirdParty");

const injectSpy = jest
  .spyOn(nextCore, "inject")
  .mockImplementation(() => () => {});

require("../../next/app/services/CallLogger/CallLogger");

describe("EmbeddableCallLogger dependency injection", () => {
  afterAll(() => {
    injectSpy.mockRestore();
  });

  test("uses the registered class tokens for ThirdParty and SmartNotes", () => {
    expect(injectSpy).toHaveBeenCalledWith(ThirdParty);
    expect(injectSpy).toHaveBeenCalledWith(SmartNotes);
    expect(injectSpy).not.toHaveBeenCalledWith("ThirdParty");
    expect(injectSpy).not.toHaveBeenCalledWith("SmartNotes");
  });
});
