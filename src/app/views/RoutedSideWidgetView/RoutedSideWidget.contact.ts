import type { ThirdPartyWidgetContact } from '../../services/ThirdParty';

/** What a routed page already handed to the side widget as its contact. */
export interface PageContactState {
  /** A contact, or no contact, was applied; applying one closes other contacts' tabs. */
  contactApplied: boolean;
  /** The applied contact was none (`null`), which a real contact can replace. */
  blankContactApplied: boolean;
}

export type PageContactDecision =
  /** Nothing to apply: unknown yet, or already applied. */
  | { type: 'keep' }
  /** No contact yet on a page whose contact can arrive just after it opens. */
  | { type: 'defer' }
  | {
      type: 'apply';
      contact: ThirdPartyWidgetContact | null;
      next: PageContactState;
    };

/**
 * Decides whether a routed page applies the contact it resolved to.
 *
 * A contact is applied once per page, since applying it closes the other
 * contacts' tabs. A page that applied no contact still takes a real one that
 * arrives later. A `deferBlankContact` page, such as a click-to-SMS that adds
 * its recipient after navigating, waits before applying no contact.
 *
 * @param contact The resolved contact: `undefined` while unknown, `null` for none.
 */
export function decidePageContact(
  state: PageContactState,
  contact: ThirdPartyWidgetContact | null | undefined,
  deferBlankContact: boolean,
): PageContactDecision {
  if (contact === undefined) {
    return { type: 'keep' };
  }
  if (state.contactApplied && !state.blankContactApplied) {
    return { type: 'keep' };
  }
  if (contact === null) {
    if (state.contactApplied) {
      return { type: 'keep' };
    }
    if (deferBlankContact) {
      return { type: 'defer' };
    }
  }
  return {
    type: 'apply',
    contact,
    next: { contactApplied: true, blankContactApplied: contact === null },
  };
}
