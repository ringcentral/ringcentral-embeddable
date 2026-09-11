import {
  addCallHistoryLoggedContact,
  addCallHistoryLogStatus,
  createCallHistoryLogActions,
  getCallHistoryLogActionHiddenReason,
  hasLoggedCallActivity,
  insertCallHistoryLogActions,
  logCallFromHistory,
} from '../src/app/views/CallHistoryView/CallHistoryLogAction';

function createOptions(overrides = {}) {
  return {
    call: { activityMatches: [], type: 'Voice' },
    editLogLabel: 'Edit log',
    hideEditLogButton: false,
    isLogging: false,
    logButtonTitle: 'Save to CRM',
    logCallLabel: 'Log call',
    ready: true,
    viewLogLabel: 'View log details',
    ...overrides,
  };
}

describe('call-history log actions', () => {
  test.each([
    ['Inbound', 'fromMatches'],
    ['Outbound', 'toMatches'],
  ])('uses the logged contact for an %s call', (direction, matchesKey) => {
    const loggedContact = { id: 'contact-2', name: 'Grace' };
    const call = {
      activityMatches: [{ contactId: 'contact-2', type: 'activity' }],
      direction,
      fromMatches: [],
      toMatches: [],
      type: 'Voice',
      [matchesKey]: [{ id: 'contact-1', name: 'Ada' }, loggedContact],
    };

    expect(addCallHistoryLoggedContact(call).callSelectionInfo).toEqual({
      displayedSelection: loggedContact,
      selections: [loggedContact],
    });
  });

  test('derives logged status from non-status activities', () => {
    expect(
      addCallHistoryLogStatus({
        activityMatches: [{ type: 'status' }],
        type: 'Voice',
      }).isLogged,
    ).toBe(false);
    expect(
      addCallHistoryLogStatus({
        activityMatches: [{ type: 'callLog' }],
        type: 'Voice',
      }).isLogged,
    ).toBe(true);
  });

  test('creates a primary log action for an unlogged call', () => {
    expect(createCallHistoryLogActions(createOptions())).toEqual([
      {
        disabled: false,
        label: 'Save to CRM',
        type: 'createLog',
      },
    ]);
  });

  test('creates separate edit and view actions for a logged call', () => {
    const call = {
      activityMatches: [{ id: 'activity', type: 'callLog' }],
      type: 'Voice',
    };

    expect(hasLoggedCallActivity(call)).toBe(true);
    expect(createCallHistoryLogActions(createOptions({ call }))).toEqual([
      {
        disabled: false,
        label: 'Edit log',
        type: 'createLog',
      },
      {
        disabled: false,
        label: 'View log details',
        type: 'viewLog',
      },
    ]);
  });

  test('keeps view log available when edit is hidden', () => {
    expect(
      createCallHistoryLogActions(
        createOptions({
          call: {
            activityMatches: [{ type: 'callLog' }],
            type: 'Voice',
          },
          hideEditLogButton: true,
        }),
      ),
    ).toEqual([
      {
        disabled: false,
        label: 'View log details',
        type: 'viewLog',
      },
    ]);
  });

  test.each([
    [{ ready: false }, 'callLoggerNotReady'],
    [{ call: { activityMatches: [], type: 'Fax' } }, 'faxCall'],
    [{}, null],
  ])('reports the action visibility reason', (overrides, expected) => {
    const options = createOptions(overrides);
    expect(
      getCallHistoryLogActionHiddenReason({
        call: options.call,
        ready: options.ready,
      }),
    ).toBe(expected);
  });

  test('hides actions when the logger is unavailable or the item is a fax', () => {
    expect(
      createCallHistoryLogActions(createOptions({ ready: false })),
    ).toEqual([]);
    expect(
      createCallHistoryLogActions(
        createOptions({ call: { activityMatches: [], type: 'Fax' } }),
      ),
    ).toEqual([]);
  });

  test('applies logging and pending state to the correct actions', () => {
    const call = {
      activityMatches: [
        { type: 'callLog' },
        { status: 'pending', type: 'status' },
      ],
      type: 'Voice',
    };

    expect(createCallHistoryLogActions(createOptions({ call }))).toEqual([
      expect.objectContaining({ disabled: true, type: 'createLog' }),
      expect.objectContaining({ disabled: false, type: 'viewLog' }),
    ]);
    expect(
      createCallHistoryLogActions(createOptions({ call, isLogging: true })),
    ).toEqual([
      expect.objectContaining({ disabled: true, type: 'createLog' }),
      expect.objectContaining({ disabled: true, type: 'viewLog' }),
    ]);
  });

  test('places create or edit first and view log last without duplicates', () => {
    expect(
      insertCallHistoryLogActions(
        [{ type: 'call' }, { type: 'viewLog' }, { type: 'copyNumber' }],
        [
          { label: 'Edit log', type: 'createLog' },
          { label: 'View log details', type: 'viewLog' },
        ],
      ),
    ).toEqual([
      { label: 'Edit log', type: 'createLog' },
      { type: 'call' },
      { type: 'copyNumber' },
      { label: 'View log details', type: 'viewLog' },
    ]);
  });

  test('opens the registered log form for create and edit actions', async () => {
    const callLogger = { logCall: jest.fn() };
    const router = { push: jest.fn(async () => {}) };

    await logCallFromHistory({
      actionType: 'createLog',
      call: {
        activityMatches: [],
        sessionId: 'session-id',
        type: 'Voice',
      },
      callLogger,
      info: { renderInfo: {} },
      router,
      thirdParty: { showLogModal: true },
    });

    expect(router.push).toHaveBeenCalledWith('/log/call/session-id');
    expect(callLogger.logCall).not.toHaveBeenCalled();
  });

  test.each([
    ['createLog', [], 'createLog'],
    ['createLog', [{ type: 'callLog' }], 'editLog'],
    ['viewLog', [{ type: 'callLog' }], 'viewLog'],
  ])(
    'submits %s with the correct trigger',
    async (actionType, activityMatches, triggerType) => {
      const call = {
        activityMatches,
        sessionId: 'session-id',
        type: 'Voice',
      };
      const contact = { id: 'contact-id' };
      const callLogger = { logCall: jest.fn(async () => {}) };
      const router = { push: jest.fn() };

      await logCallFromHistory({
        actionType,
        call,
        callLogger,
        info: { renderInfo: { matchedContact: contact } },
        router,
        thirdParty: { showLogModal: actionType === 'viewLog' },
      });

      expect(router.push).not.toHaveBeenCalled();
      expect(callLogger.logCall).toHaveBeenCalledWith({
        call,
        contact,
        redirect: true,
        triggerType,
      });
    },
  );
});
