import {
  createDefaultLogCallPage,
  resolveLogCallPage,
} from "../src/app/views/LogCallView/LogCallPage.helper";

const labels = {
  addCallLogNote: "Add call log note",
  contact: "Contact",
  editLog: "Edit log",
  logCall: "Log call",
  note: "Note",
  save: "Save",
};

function createCall(overrides = {}) {
  return {
    activityMatches: [],
    aiNote: "AI summary",
    direction: "Inbound",
    from: { name: "Ada", phoneNumber: "+16505550100" },
    fromMatches: [
      { description: "CRM contact", id: "contact-1", name: "Ada Lovelace" },
    ],
    to: { name: "Me", phoneNumber: "+16505550200" },
    toMatches: [],
    type: "Voice",
    ...overrides,
  };
}

describe("log-call page helpers", () => {
  test("builds the default schema from matches and Smart Notes", () => {
    const page = createDefaultLogCallPage(createCall(), labels);

    expect(page).toEqual(
      expect.objectContaining({
        id: "$LOG-CALL",
        title: "Log call",
        formData: {
          contactId: "contact-1",
          note: "AI summary",
        },
      })
    );
    expect(page.schema.properties.contactId.oneOf).toEqual([
      {
        const: "contact-1",
        description: "CRM contact",
        title: "Ada Lovelace",
      },
    ]);
    expect(page.uiSchema.submitButtonOptions.submitText).toBe("Save");
  });

  test("prefills an existing activity for editing", () => {
    const page = createDefaultLogCallPage(
      createCall({
        activityMatches: [
          {
            contact: { id: "contact-1" },
            note: "Existing note",
            type: "callLog",
          },
        ],
      }),
      labels
    );

    expect(page.title).toBe("Edit log");
    expect(page.formData).toEqual({
      contactId: "contact-1",
      note: "Existing note",
    });
  });

  test("prefills the contact selected from multiple call matches", () => {
    const page = createDefaultLogCallPage(
      createCall({
        callSelectionInfo: {
          displayedSelection: { id: "contact-2", name: "Grace Hopper" },
          selections: [],
        },
        fromMatches: [
          { id: "contact-1", name: "Ada Lovelace" },
          { id: "contact-2", name: "Grace Hopper" },
        ],
      }),
      labels
    );

    expect(page.formData.contactId).toBe("contact-2");
  });

  test("uses a registered customized page and fallback title", () => {
    const customPage = {
      id: "$LOG-CALL",
      schema: { properties: { disposition: { type: "string" } } },
    };
    expect(
      resolveLogCallPage(createCall(), customPage, labels, "Save to CRM")
    ).toEqual({ ...customPage, title: "Save to CRM" });
  });
});
