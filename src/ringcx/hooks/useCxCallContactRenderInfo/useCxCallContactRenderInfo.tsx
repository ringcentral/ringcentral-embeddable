import { useConnector, useContainer } from '@ringcentral-integration/next-core';
import { useMemo } from 'react';

import {
  type DisplayNameComponent,
  type MatchedContactOption,
  useDisplayNameWithMatches,
} from '../../../app/components/MatchedContactsTag';
import {
  getLoggedContact,
  type MatchedContactSelection,
} from '../../../app/services/MatchedContactSelection';
import {
  type CxContactRenderInfo,
  type UseCxContactRenderInfoOptions,
  useCxContactRenderInfo,
} from '../useCxContactRenderInfo';

export interface UseCxCallContactRenderInfoOptions
  extends Omit<UseCxContactRenderInfoOptions, 'selection' | 'matches'> {
  /** The interaction id the pick is keyed by, see `ringCXLogId`. */
  uii?: string;
  matches?: readonly MatchedContactOption[];
  /** CRM log matches; the contact a call was logged against wins over a pick. */
  activityMatches?: readonly unknown[];
  /**
   * The call is still in progress, so it may borrow the pick a history dial
   * handed it before it has claimed that pick.
   */
  live?: boolean;
}

/**
 * `useCxContactRenderInfo` for a RingCX call, with the matched-contact picker.
 *
 * Resolves the call's contact the way RingEX rows do — the logged contact, else
 * the user's pick — so the name stops guessing `Maybe: <name>` once either is
 * known, and wraps `DisplayName` so the match count opens the picker.
 */
export const useCxCallContactRenderInfo = ({
  uii,
  matches,
  activityMatches,
  live = false,
  ...options
}: UseCxCallContactRenderInfoOptions): CxContactRenderInfo => {
  const matchedContactSelection = useContainer<MatchedContactSelection>(
    'MatchedContactSelection',
  );
  const selectedEntityId = useConnector(() =>
    uii ? matchedContactSelection.getSelectedEntityId('cxCall', uii) : undefined,
  );
  // A live call can reach this tab a moment before the pick it claims does.
  const pendingEntityId = useConnector(() =>
    live
      ? matchedContactSelection.resolvePendingOutboundSelection(
          [options.phoneNumber],
          matches as MatchedContactOption[] | undefined,
          'cxCall',
        )?.displayedSelection.id
      : undefined,
  );
  const loggedContact = getLoggedContact(activityMatches, matches);
  const resolvedContact =
    loggedContact ??
    matches?.find(
      ({ id }) => !!id && (id === selectedEntityId || id === pendingEntityId),
    );
  // `selections` stays the full list: the framework derives the match count
  // from it once a selection exists.
  const selection = useMemo(
    () =>
      resolvedContact && matches
        ? { displayedSelection: resolvedContact, selections: matches }
        : undefined,
    [resolvedContact, matches],
  );
  const renderInfo = useCxContactRenderInfo({ ...options, matches, selection });
  const DisplayName = useDisplayNameWithMatches(
    renderInfo.DisplayName as DisplayNameComponent,
    {
      scope: 'cxCall',
      recordKey: uii,
      matches: loggedContact
        ? [loggedContact]
        : (matches as MatchedContactOption[] | undefined),
      selectable: !loggedContact,
    },
  );
  return { ...renderInfo, DisplayName };
};
