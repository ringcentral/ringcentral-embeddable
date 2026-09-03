import { SmartNotesMd } from '@ringcentral/spring-icon';

import {
  areSmartNotesLinksDisabled,
  createHistorySmartNoteSession,
  createHistorySmartNotesAction,
  insertHistorySmartNotesAction,
} from '../../next/app/views/CallHistoryView/CallHistorySmartNotesAction';
import { getVisibleTelephonySessionIds } from '../../next/app/views/CallHistoryView/CallHistorySmartNotesQuery';

function createCall(overrides = {}) {
  return {
    telephonySessionId: 'telephony-session',
    direction: 'Inbound',
    hasSmartNote: true,
    ...overrides,
  };
}

function createInfo(overrides = {}) {
  return {
    renderInfo: {
      matchedContact: { id: 'contact-id', name: 'Ada' },
    },
    signalSourceInfo: {
      name: 'Server name',
      phoneNumber: '+16505550100',
    },
    ...overrides,
  };
}

describe('call-history Smart Notes action', () => {
  test('creates a disconnected session using the matched contact', () => {
    expect(createHistorySmartNoteSession(createCall(), createInfo())).toEqual({
      id: 'telephony-session',
      status: 'Disconnected',
      direction: 'Inbound',
      phoneNumber: '+16505550100',
      contact: { id: 'contact-id', name: 'Ada' },
    });
  });

  test('uses remote-party fallback data and rejects calls without a session id', () => {
    const info = createInfo({ renderInfo: {} });
    expect(createHistorySmartNoteSession(createCall(), info)).toEqual(
      expect.objectContaining({
        contact: {
          name: 'Server name',
          phoneNumber: '+16505550100',
        },
      })
    );
    expect(
      createHistorySmartNoteSession(
        createCall({ telephonySessionId: undefined }),
        info
      )
    ).toBeNull();
  });

  test.each([
    [{ isOfflineMode: true, isVoipOnlyMode: false, isRestricted: false }, true],
    [{ isOfflineMode: false, isVoipOnlyMode: true, isRestricted: false }, true],
    [{ isOfflineMode: false, isVoipOnlyMode: false, isRestricted: true }, true],
    [
      { isOfflineMode: false, isVoipOnlyMode: false, isRestricted: false },
      false,
    ],
  ])('derives the disabled state from link availability', (state, expected) => {
    expect(areSmartNotesLinksDisabled(state)).toBe(expected);
  });

  test('creates the labeled Spring action and handles its click', () => {
    const onViewSmartNote = jest.fn();
    const stopPropagation = jest.fn();
    const action = createHistorySmartNotesAction({
      call: createCall(),
      disabled: false,
      info: createInfo(),
      label: 'View smart notes',
      onViewSmartNote,
    });

    expect(action).toEqual(
      expect.objectContaining({
        actionType: 'viewSmartNote',
        disabled: false,
        label: 'View smart notes',
        symbol: SmartNotesMd,
      })
    );
    action.onClick({ stopPropagation });

    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(onViewSmartNote).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'telephony-session' })
    );
  });

  test('does not create an action for a call without smart notes', () => {
    expect(
      createHistorySmartNotesAction({
        call: createCall({ hasSmartNote: false }),
        disabled: false,
        info: createInfo(),
        label: 'View smart notes',
        onViewSmartNote: jest.fn(),
      })
    ).toBeNull();
  });

  test('inserts the action after call and text actions', () => {
    const action = { actionType: 'viewSmartNote' };
    expect(
      insertHistorySmartNotesAction(
        [
          { actionType: 'viewLog' },
          { actionType: 'call' },
          { actionType: 'text' },
          { actionType: 'copyNumber' },
        ],
        action
      ).map(({ actionType }) => actionType)
    ).toEqual(['viewLog', 'call', 'text', 'viewSmartNote', 'copyNumber']);
    expect(insertHistorySmartNotesAction([], null)).toEqual([]);
  });

  test('selects the visible call range for the Smart Notes query', () => {
    expect(
      getVisibleTelephonySessionIds(
        [
          { telephonySessionId: 'telephony-1' },
          {},
          { telephonySessionId: 'telephony-2' },
          { telephonySessionId: 'telephony-3' },
        ],
        1,
        2
      )
    ).toEqual(['telephony-2']);
  });
});
