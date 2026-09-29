import {
  getLoggedContact,
  type MatchedContactSelection,
} from '../../app/services/MatchedContactSelection';

interface CxCallContactSource<T extends { id?: string }> {
  /** The interaction id the pick is keyed by, see `ringCXLogId`. */
  uii?: string;
  matches?: readonly T[];
  activityMatches?: readonly unknown[];
}

/**
 * The contact a RingCX call resolved to, as its row renders it: the contact the
 * call was logged against, else the one the user picked from its matches.
 *
 * The `Maybe: <name>` guess is deliberately not returned, so callers that act on
 * the result — a dial hand-off, a log — never present a guess as a certainty.
 */
export function getCxCallResolvedContact<T extends { id?: string }>(
  matchedContactSelection: Pick<MatchedContactSelection, 'getSelectedEntityId'>,
  { uii, matches, activityMatches }: CxCallContactSource<T>,
): T | undefined {
  const loggedContact = getLoggedContact(activityMatches, matches);
  if (loggedContact) {
    return loggedContact;
  }
  const entityId = uii
    ? matchedContactSelection.getSelectedEntityId('cxCall', uii)
    : undefined;
  return entityId ? matches?.find(({ id }) => id === entityId) : undefined;
}
