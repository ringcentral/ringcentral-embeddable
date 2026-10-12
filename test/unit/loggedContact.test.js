import { getLoggedContact } from "../../src/app/services/MatchedContactSelection";

const CONTACTS = [
  { id: "contact-1", name: "Ada" },
  { id: "contact-2", name: "Grace" },
];

describe("getLoggedContact", () => {
  test.each([
    [{ contact: "contact-2", type: "activity" }],
    [{ contact: { id: "contact-2" }, type: "activity" }],
    [{ contactId: "contact-2", type: "activity" }],
  ])("resolves every legacy contact reference shape", (logMatch) => {
    expect(getLoggedContact([logMatch], CONTACTS)).toBe(CONTACTS[1]);
  });

  test("skips status matches and continues to a real logged activity", () => {
    expect(
      getLoggedContact(
        [
          { contact: "contact-1", type: "status" },
          { contact: "contact-2", type: "activity" },
        ],
        CONTACTS
      )
    ).toBe(CONTACTS[1]);
  });

  test("returns undefined when the logged contact is not in current matches", () => {
    expect(
      getLoggedContact(
        [{ contact: "missing-contact", type: "activity" }],
        CONTACTS
      )
    ).toBeUndefined();
  });
});
