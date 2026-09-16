jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/services',
  () => ({
    CallViewState: class CallViewStateBase {
      constructor(router, portManager, callMonitor, callHistory, callLogTasks) {
        Object.assign(this, {
          router,
          portManager,
          callMonitor,
          callHistory,
          callLogTasks,
        });
      }

      getExtraLogData(sessionId, telephonySessionId) {
        return { isLogged: false, hasSmartNote: false, telephonySessionId };
      }
    },
  }),
);

import { Subject } from 'rxjs';

import { CallViewState } from '../src/app/services/CallViewState';
import { MatchedContactSelection } from '../src/app/services/MatchedContactSelection';

const FROM_MATCHES = [
  { id: 'rc-1', name: 'John Smith', type: 'company' },
  { id: 'crm-1', name: 'John Smith', type: 'lead' },
];
const TO_MATCHES = [
  { id: 'rc-2', name: 'Ada Byron', type: 'company' },
  { id: 'crm-2', name: 'Ada Lovelace', type: 'contact' },
];

const INBOUND_CALL = {
  sessionId: 'session-1',
  telephonySessionId: 'telephony-1',
  direction: 'Inbound',
  fromMatches: FROM_MATCHES,
  toMatches: TO_MATCHES,
};

const createCallViewState = ({ calls = [INBOUND_CALL], activeCall } = {}) => {
  const selection = new MatchedContactSelection({ enable: jest.fn() });
  const callHistory = {
    callsInfo: {
      map: calls.reduce((acc, call) => {
        acc[call.sessionId] = call;
        return acc;
      }, {}),
    },
  };
  const newCalls = new Subject();
  const callMonitor = {
    getCallBySessionId: jest.fn(() => activeCall),
    addListener: jest.fn(() => newCalls),
  };
  const callViewState = new CallViewState(
    { push: jest.fn() },
    { shared: false },
    callMonitor,
    callHistory,
    selection,
  );
  return { callViewState, selection, newCalls, callMonitor };
};

describe('CallViewState matched-contact selection', () => {
  test('forwards every base constructor dependency', () => {
    // Re-applying `@injectable` to a subclass drops the base's parameter
    // decorators, so the constructor must be redeclared and passed through in
    // full — otherwise the optional `CallLogTasks` becomes a required binding
    // and the container cannot resolve `CallViewState`.
    const router = { push: jest.fn() };
    const portManager = { shared: false };
    const callMonitor = {
      getCallBySessionId: jest.fn(),
      addListener: jest.fn(() => new Subject()),
    };
    const callHistory = { callsInfo: { map: {} } };
    const selection = new MatchedContactSelection({ enable: jest.fn() });
    const callLogTasks = { callSelectionMap: {} };

    const callViewState = new CallViewState(
      router,
      portManager,
      callMonitor,
      callHistory,
      selection,
      callLogTasks,
    );

    expect(callViewState).toMatchObject({
      router,
      portManager,
      callMonitor,
      callHistory,
      callLogTasks,
    });
  });

  test('resolves without a CallLogTasks binding', () => {
    const { callViewState } = createCallViewState();

    expect(callViewState.callLogTasks).toBeUndefined();
  });

  test('passes through the base log data when nothing was picked', () => {
    const { callViewState } = createCallViewState();

    expect(
      callViewState.getExtraLogData('session-1', 'telephony-1'),
    ).not.toHaveProperty('callSelectionInfo');
  });

  test('adds the pick and the full match list for the resolved call side', () => {
    const { callViewState, selection } = createCallViewState();
    selection.select({ scope: 'call', key: 'session-1', entityId: 'crm-1' });

    const extraLogData = callViewState.getExtraLogData(
      'session-1',
      'telephony-1',
    );

    expect(extraLogData).toEqual({
      isLogged: false,
      hasSmartNote: false,
      telephonySessionId: 'telephony-1',
      callSelectionInfo: {
        displayedSelection: FROM_MATCHES[1],
        selections: FROM_MATCHES,
      },
    });
  });

  test('uses the outbound side for an outbound call', () => {
    const { callViewState, selection } = createCallViewState({
      calls: [{ ...INBOUND_CALL, direction: 'Outbound' }],
    });
    selection.select({ scope: 'call', key: 'session-1', entityId: 'crm-2' });

    expect(
      callViewState.getExtraLogData('session-1', 'telephony-1')
        .callSelectionInfo,
    ).toEqual({
      displayedSelection: TO_MATCHES[1],
      selections: TO_MATCHES,
    });
  });

  test('falls back to the call monitor for a call not yet in history', () => {
    const { callViewState, selection } = createCallViewState({
      calls: [],
      activeCall: INBOUND_CALL,
    });
    selection.select({ scope: 'call', key: 'session-1', entityId: 'rc-1' });

    expect(
      callViewState.getExtraLogData('session-1', 'telephony-1')
        .callSelectionInfo,
    ).toEqual({
      displayedSelection: FROM_MATCHES[0],
      selections: FROM_MATCHES,
    });
  });

  test('passes through when the call cannot be found at all', () => {
    const { callViewState, selection } = createCallViewState({ calls: [] });
    selection.select({ scope: 'call', key: 'session-1', entityId: 'crm-1' });

    expect(
      callViewState.getExtraLogData('session-1', 'telephony-1'),
    ).not.toHaveProperty('callSelectionInfo');
  });

  test('passes through when the pick no longer matches the number', () => {
    const { callViewState, selection } = createCallViewState();
    selection.select({ scope: 'call', key: 'session-1', entityId: 'removed' });

    expect(
      callViewState.getExtraLogData('session-1', 'telephony-1'),
    ).not.toHaveProperty('callSelectionInfo');
  });

  describe('outbound hand-off', () => {
    const OUTBOUND_CALL = {
      sessionId: 'session-new',
      direction: 'Outbound',
      to: { phoneNumber: '+16505550100' },
      fromMatches: [],
      toMatches: TO_MATCHES,
    };

    test('claims the pending pick for a newly placed outbound call', async () => {
      const { selection, newCalls } = createCallViewState();
      await selection.setPendingOutbound({
        entityId: 'crm-2',
        phoneNumber: '+16505550100',
      });

      newCalls.next(OUTBOUND_CALL);
      await Promise.resolve();

      expect(selection.getSelectedEntityId('call', 'session-new')).toBe(
        'crm-2',
      );
    });

    test('leaves an inbound call alone', async () => {
      const { selection, newCalls } = createCallViewState();
      await selection.setPendingOutbound({
        entityId: 'crm-2',
        phoneNumber: '+16505550100',
      });

      newCalls.next({ ...OUTBOUND_CALL, direction: 'Inbound' });
      await Promise.resolve();

      expect(
        selection.getSelectedEntityId('call', 'session-new'),
      ).toBeUndefined();
      // Still pending, so the call the user actually placed can claim it.
      expect(selection.pendingOutbound).not.toBeNull();
    });

    test('claims the pick when the record dialled the callee extension', async () => {
      const { selection, newCalls } = createCallViewState();
      await selection.setPendingOutbound({
        entityId: 'crm-2',
        phoneNumber: '4102',
      });

      // The telephony session reports both numbers for an internal call.
      newCalls.next({
        ...OUTBOUND_CALL,
        to: { phoneNumber: '+16505550100', extensionNumber: '4102' },
      });
      await Promise.resolve();

      expect(selection.getSelectedEntityId('call', 'session-new')).toBe(
        'crm-2',
      );
    });

    test('subscribes to new calls once', () => {
      const { callMonitor } = createCallViewState();

      expect(callMonitor.addListener).toHaveBeenCalledTimes(1);
      expect(callMonitor.addListener).toHaveBeenCalledWith('NewCall');
    });
  });

  test('does not apply a conversation pick to a call', () => {
    const { callViewState, selection } = createCallViewState();
    selection.select({
      scope: 'conversation',
      key: 'session-1',
      entityId: 'crm-1',
    });

    expect(
      callViewState.getExtraLogData('session-1', 'telephony-1'),
    ).not.toHaveProperty('callSelectionInfo');
  });
});
